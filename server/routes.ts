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
  type MeetupFilter 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Auth routes
  app.get('/api/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      res.json({ ...user, password: undefined });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Profile update schema - allow username, bio, profile picture, and interests
  const profileUpdateSchema = z.object({
    username: z.string().min(1).optional(),
    bio: z.string().optional(),
    profileImageUrl: z.string().url().optional().or(z.literal('')),
    interests: z.array(z.string()).optional(),
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

  // Chat routes
  app.get('/api/meetups/:id/messages', isAuthenticated, async (req, res) => {
    try {
      const meetupId = parseInt(req.params.id);
      const messages = await storage.getChatMessages(meetupId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
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
          const { meetupId, userId, message: messageText } = message;
          
          // Validate and save message
          const chatMessage = await storage.createChatMessage({
            meetupId,
            userId,
            message: messageText,
          });
          
          // Get full message with user info
          const fullMessage = await storage.getChatMessages(meetupId);
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
          const { meetupId } = message;
          // Store meetup room info for this connection
          (ws as any).meetupId = meetupId;
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
