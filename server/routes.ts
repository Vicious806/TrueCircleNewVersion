import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { 
  insertMeetupSchema, 
  insertMeetupParticipantSchema, 
  insertChatMessageSchema,
  meetupFilterSchema,
  surveyResponseSchema,
  meetupRequestSchema,
  type MeetupFilter 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Auth routes
  app.get('/api/user', async (req: any, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const user = req.user;
      res.json({ ...user, password: undefined });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Profile update schema - allow username, bio, profile picture, interests, location, and age
  const profileUpdateSchema = z.object({
    username: z.string().min(1).optional(),
    bio: z.string().optional(),
    profileImageUrl: z.string().optional().or(z.literal('')), // Allow base64 data URLs or empty string
    interests: z.array(z.string()).optional(),
    location: z.string().optional(),
    age: z.number().min(18).max(100).optional(),
  });

  app.put('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = profileUpdateSchema.parse(req.body);
      
      // Check if username is being changed and if it's unique
      if (validatedData.username && validatedData.username !== req.user.username) {
        const existingUser = await storage.getUserByUsername(validatedData.username);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "Username already taken" });
        }
      }
      
      const updatedUser = await storage.updateUser(userId, validatedData);
      res.json({ ...updatedUser, password: undefined });
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid profile data" });
      }
      res.status(400).json({ message: "Failed to update profile" });
    }
  });

  // Location update endpoint
  app.patch('/api/user/location', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { location } = req.body;

      if (!location || typeof location !== 'string') {
        return res.status(400).json({ message: "Location is required" });
      }

      const updatedUser = await storage.updateUser(userId, { location: location.trim() });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ ...updatedUser, password: undefined });
    } catch (error) {
      console.error("Error updating user location:", error);
      res.status(500).json({ message: "Failed to update location" });
    }
  });

  // Match details update endpoint
  app.patch('/api/matches/:id/details', isAuthenticated, async (req: any, res) => {
    try {
      const matchId = parseInt(req.params.id);
      const userId = req.user.id;
      const { location, date, time } = req.body;

      // Verify user is part of this match
      const match = await storage.getUserMatches(userId);
      const userMatch = match.find(m => m.id === matchId);
      
      if (!userMatch) {
        return res.status(403).json({ message: "Not authorized to edit this match" });
      }

      // Update match details
      const updates: any = {};
      if (location !== undefined) updates.suggestedLocation = location;
      if (date !== undefined) updates.suggestedDate = date;
      if (time !== undefined) updates.suggestedTime = time;

      const updatedMatch = await storage.updateMatch(matchId, updates);
      
      if (!updatedMatch) {
        return res.status(404).json({ message: "Match not found" });
      }

      res.json(updatedMatch);
    } catch (error) {
      console.error("Error updating match details:", error);
      res.status(500).json({ message: "Failed to update match details" });
    }
  });

  // Survey routes
  app.post('/api/survey', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const surveyData = surveyResponseSchema.parse(req.body);
      
      const response = await storage.createSurveyResponse({
        userId,
        ...surveyData,
      });
      
      res.json(response);
    } catch (error) {
      console.error("Error saving survey response:", error);
      res.status(500).json({ message: "Failed to save survey response" });
    }
  });

  app.get('/api/survey/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const response = await storage.getSurveyResponse(userId);
      
      if (!response) {
        return res.status(404).json({ message: "Survey response not found" });
      }
      
      res.json(response);
    } catch (error) {
      console.error("Error fetching survey response:", error);
      res.status(500).json({ message: "Failed to fetch survey response" });
    }
  });

  // Meetup routes
  app.post('/api/meetups', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const meetupData = insertMeetupSchema.parse({
        ...req.body,
        createdBy: userId,
      });
      
      const meetup = await storage.createMeetup(meetupData);
      
      // Auto-join the creator
      await storage.joinMeetup({
        meetupId: meetup.id,
        userId: userId,
      });
      
      res.json(meetup);
    } catch (error) {
      console.error("Error creating meetup:", error);
      res.status(400).json({ message: "Failed to create meetup" });
    }
  });

  app.get('/api/meetups', async (req, res) => {
    try {
      const filters = meetupFilterSchema.partial().parse(req.query);
      const meetups = await storage.getMeetups(filters);
      res.json(meetups);
    } catch (error) {
      console.error("Error fetching meetups:", error);
      res.status(500).json({ message: "Failed to fetch meetups" });
    }
  });

  app.get('/api/meetups/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const meetup = await storage.getMeetup(id);
      
      if (!meetup) {
        return res.status(404).json({ message: "Meetup not found" });
      }
      
      res.json(meetup);
    } catch (error) {
      console.error("Error fetching meetup:", error);
      res.status(500).json({ message: "Failed to fetch meetup" });
    }
  });

  app.post('/api/meetups/:id/join', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const meetupId = parseInt(req.params.id);
      
      // Check if meetup exists and has space
      const meetup = await storage.getMeetup(meetupId);
      if (!meetup) {
        return res.status(404).json({ message: "Meetup not found" });
      }
      
      if (meetup.currentParticipants >= meetup.maxParticipants) {
        return res.status(400).json({ message: "Meetup is full" });
      }
      
      // Check if already joined
      const isAlreadyJoined = meetup.participants.some(p => p.user.id === userId);
      if (isAlreadyJoined) {
        return res.status(400).json({ message: "Already joined this meetup" });
      }
      
      const participation = await storage.joinMeetup({
        meetupId,
        userId,
      });
      
      res.json(participation);
    } catch (error) {
      console.error("Error joining meetup:", error);
      res.status(400).json({ message: "Failed to join meetup" });
    }
  });

  app.delete('/api/meetups/:id/leave', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const meetupId = parseInt(req.params.id);
      
      const success = await storage.leaveMeetup(meetupId, userId);
      
      if (!success) {
        return res.status(400).json({ message: "Not a participant of this meetup" });
      }
      
      res.json({ message: "Left meetup successfully" });
    } catch (error) {
      console.error("Error leaving meetup:", error);
      res.status(500).json({ message: "Failed to leave meetup" });
    }
  });

  app.get('/api/user/meetups', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const meetups = await storage.getUserMeetups(userId);
      res.json(meetups);
    } catch (error) {
      console.error("Error fetching user meetups:", error);
      res.status(500).json({ message: "Failed to fetch user meetups" });
    }
  });



  // Smart matching routes
  app.post('/api/matching-request', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const requestData = meetupRequestSchema.parse(req.body);
      
      // Check for any existing active request from this user (any meetup type)
      const existingRequest = await storage.getUserAnyActiveRequest(userId);
      if (existingRequest) {
        return res.status(409).json({ 
          message: "You already have an active request. Would you like to cancel it and create a new one?",
          conflict: true,
          existingRequest: {
            id: existingRequest.id,
            meetupType: existingRequest.meetupType,
            venueType: existingRequest.venueType
          }
        });
      }
      
      // Create the matching request
      const matchingRequest = await storage.createMeetupRequest({
        ...requestData,
        userId,
      });
      
      // Try to find compatible matches immediately
      // This ensures only same meetupType and venueType users get matched
      const potentialMatches = await storage.findPotentialMatches(
        userId, 
        requestData.meetupType, 
        requestData.venueType,
        requestData.ageRangeMin,
        requestData.ageRangeMax
      );
      
      if (potentialMatches.length > 0) {
        let match;
        
        if (requestData.meetupType === '1v1') {
          // 1v1 matching - pair with one person
          const participants = [userId, potentialMatches[0]];
          const sharedInterest = await storage.findSharedInterest(userId, potentialMatches[0]);
          
          match = await storage.createMatch({
            participants,
            meetupType: requestData.meetupType,
            venueType: requestData.venueType,
            suggestedTime: requestData.preferredTime,
            suggestedDate: requestData.preferredDate,
            matchScore: 75,
            sharedInterest,
          });
        } else if (requestData.meetupType === 'group') {
          // Group matching - add to existing group or create new one
          if (potentialMatches.length >= 1) {
            // Check if this is joining an existing group or forming a new one
            const isExistingGroup = potentialMatches.length >= 2; // Existing group has multiple members
            
            if (isExistingGroup) {
              // Add user to existing group by updating the match
              const existingMatch = await storage.getUserMatches(potentialMatches[0]);
              if (existingMatch.length > 0) {
                const groupMatch = existingMatch.find(m => 
                  m.meetupType === 'group' && 
                  m.status === 'active' &&
                  m.venueType === requestData.venueType
                );
                
                if (groupMatch) {
                  const updatedParticipants = [...groupMatch.users.map(u => u.id), userId];
                  match = await storage.updateMatch(groupMatch.id, {
                    participants: updatedParticipants
                  });
                }
              }
            } else {
              // Create new group with available users (up to 4 total including current user)
              const participants = [userId, ...potentialMatches.slice(0, 3)]; // Max 4 people
              
              match = await storage.createMatch({
                participants,
                meetupType: requestData.meetupType,
                venueType: requestData.venueType,
                suggestedTime: requestData.preferredTime,
                suggestedDate: requestData.preferredDate,
                matchScore: 70,
                sharedInterest: null, // Groups don't require shared interests
              });
            }
          }
        }
        
        if (match) {
          res.json({ matchingRequest, match });
        } else {
          res.json({ matchingRequest, message: "Request submitted, looking for compatible matches..." });
        }
      } else {
        res.json({ matchingRequest, message: "Request submitted, looking for compatible matches..." });
      }
    } catch (error) {
      console.error("Error creating matching request:", error);
      res.status(500).json({ message: "Failed to create matching request" });
    }
  });

  // Get user's active request route
  app.get('/api/user/active-request', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const activeRequest = await storage.getUserAnyActiveRequest(userId);
      
      if (activeRequest) {
        res.json(activeRequest);
      } else {
        res.status(404).json({ message: "No active request found" });
      }
    } catch (error) {
      console.error("Error fetching active request:", error);
      res.status(500).json({ message: "Failed to fetch active request" });
    }
  });

  // Cancel matching request route
  app.post('/api/matching-request/:id/cancel', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const requestId = parseInt(req.params.id);
      
      // Verify the request belongs to the user
      const request = await storage.getUserActiveRequest(userId, 'group') || await storage.getUserActiveRequest(userId, '1v1');
      if (!request || request.id !== requestId) {
        return res.status(404).json({ message: "Request not found" });
      }
      
      const success = await storage.cancelMeetupRequest(requestId);
      if (success) {
        res.json({ message: "Request cancelled successfully" });
      } else {
        res.status(500).json({ message: "Failed to cancel request" });
      }
    } catch (error) {
      console.error("Error cancelling request:", error);
      res.status(500).json({ message: "Failed to cancel request" });
    }
  });
  
  function getMaxParticipants(meetupType: string): number {
    switch (meetupType) {
      case '1v1': return 2;
      case 'group': return 4;
      default: return 2;
    }
  }
  
  app.get('/api/user/matches', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const matches = await storage.getUserMatches(userId);
      res.json(matches);
    } catch (error) {
      console.error("Error fetching user matches:", error);
      res.status(500).json({ message: "Failed to fetch matches" });
    }
  });



  // Match routes
  app.get('/api/matches/:id', isAuthenticated, async (req, res) => {
    try {
      const matchId = parseInt(req.params.id);
      const userMatches = await storage.getUserMatches((req.user as any).id);
      const match = userMatches.find(m => m.id === matchId);
      
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      res.json(match);
    } catch (error) {
      console.error("Error fetching match:", error);
      res.status(500).json({ message: "Failed to fetch match" });
    }
  });

  // Chat routes for matches
  app.get('/api/matches/:id/messages', isAuthenticated, async (req, res) => {
    try {
      const matchId = parseInt(req.params.id);
      const messages = await storage.getMatchChatMessages(matchId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/matches/:id/messages', isAuthenticated, async (req, res) => {
    try {
      const matchId = parseInt(req.params.id);
      const { message } = req.body;
      const userId = (req.user as any).id;
      
      const chatMessage = await storage.createMatchChatMessage(matchId, userId, message);
      res.json(chatMessage);
    } catch (error) {
      console.error("Error sending chat message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Leave/delete match
  app.delete('/api/matches/:id/leave', isAuthenticated, async (req, res) => {
    try {
      const matchId = parseInt(req.params.id);
      const userId = (req.user as any).id;
      
      // Verify user is in this match
      const match = await storage.getUserMatches(userId);
      const userMatch = match.find(m => m.id === matchId);
      
      if (!userMatch) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      // Delete the match (this removes it for all participants)
      const success = await storage.deleteMatch(matchId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to leave match" });
      }
      
      res.json({ message: "Successfully left match" });
    } catch (error) {
      console.error("Error leaving match:", error);
      res.status(500).json({ message: "Failed to leave match" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws, req) => {
    console.log('WebSocket connection established');
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'chat_message') {
          const { matchId, userId, message: messageText } = message;
          
          // Validate and save message for match
          const chatMessage = await storage.createMatchChatMessage(matchId, userId, messageText);
          
          // Get full message with user info
          const fullMessage = await storage.getMatchChatMessages(matchId);
          const newMessage = fullMessage[fullMessage.length - 1];
          
          // Broadcast to all connected clients
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'new_message',
                data: newMessage,
              }));
            }
          });
          
          // Send confirmation back to sender
          ws.send(JSON.stringify({
            type: 'message_sent',
            data: newMessage,
          }));
        }
        
        if (message.type === 'join_room') {
          const { matchId } = message;
          // Store match room info for this connection
          (ws as any).matchId = matchId;
        }
        
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Failed to process message',
        }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  return httpServer;
}
