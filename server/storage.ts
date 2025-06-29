import {
  users,
  meetups,
  meetupParticipants,
  chatMessages,
  userSurveyResponses,
  meetupRequests,
  matches,
  type User,
  type UpsertUser,
  type InsertUser,
  type Meetup,
  type MeetupWithCreator,
  type MeetupWithParticipants,
  type InsertMeetup,
  type InsertMeetupParticipant,
  type MeetupParticipant,
  type InsertChatMessage,
  type ChatMessage,
  type ChatMessageWithUser,
  type MeetupFilter,
  type InsertSurveyResponse,
  type SurveyResponse,
  type MeetupRequest,
  type InsertMeetupRequest,
  type Match,
  type MatchWithUsers,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, or, inArray, desc, asc, sql, not } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  verifyEmailWithCode(email: string, code: string): Promise<boolean>;
  
  // Meetup operations
  createMeetup(meetup: InsertMeetup): Promise<Meetup>;
  getMeetup(id: number): Promise<MeetupWithParticipants | undefined>;
  getMeetups(filters?: Partial<MeetupFilter>): Promise<MeetupWithCreator[]>;
  updateMeetup(id: number, updates: Partial<Meetup>): Promise<Meetup | undefined>;
  deleteMeetup(id: number): Promise<boolean>;
  
  // Meetup participant operations
  joinMeetup(participation: InsertMeetupParticipant): Promise<MeetupParticipant>;
  leaveMeetup(meetupId: number, userId: number): Promise<boolean>;
  getMeetupParticipants(meetupId: number): Promise<(MeetupParticipant & { user: User })[]>;
  getUserMeetups(userId: number): Promise<MeetupWithCreator[]>;
  
  // Chat operations
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(meetupId: number): Promise<ChatMessageWithUser[]>;
  getMatchChatMessages(matchId: number): Promise<ChatMessageWithUser[]>;
  createMatchChatMessage(matchId: number, userId: number, message: string): Promise<ChatMessage>;
  
  // Survey operations
  createSurveyResponse(response: InsertSurveyResponse): Promise<SurveyResponse>;
  getSurveyResponse(userId: number): Promise<SurveyResponse | undefined>;
  
  // Meetup request operations
  createMeetupRequest(request: InsertMeetupRequest): Promise<MeetupRequest>;
  getUserActiveRequest(userId: number, meetupType: string): Promise<MeetupRequest | undefined>;
  getUserAnyActiveRequest(userId: number): Promise<MeetupRequest | undefined>;
  cancelMeetupRequest(requestId: number): Promise<boolean>;
  
  // Matching operations
  findPotentialMatches(userId: number, meetupType: string): Promise<number[]>;
  findSharedInterest(userId1: number, userId2: number): Promise<string | null>;
  createMatch(match: any): Promise<Match>;
  getUserMatches(userId: number): Promise<MatchWithUsers[]>;
  updateMatch(id: number, updates: Partial<Match>): Promise<Match | undefined>;
  deleteMatch(id: number): Promise<boolean>;

}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      or(eq(users.username, usernameOrEmail), eq(users.email, usernameOrEmail))
    );
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    // Calculate age from date of birth if provided
    let calculatedAge = userData.age;
    if (userData.dateOfBirth) {
      const birthDate = new Date(userData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age = age - 1;
      }
      calculatedAge = age;
    }
    
    const [user] = await db.insert(users).values({
      ...userData,
      age: calculatedAge
    }).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async verifyEmailWithCode(email: string, code: string): Promise<boolean> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(and(
          eq(users.email, email),
          eq(users.emailVerificationCode, code)
        ));

      if (!user) {
        return false;
      }

      // Check if code has expired (15 minutes)
      if (user.emailVerificationExpiry && new Date() > user.emailVerificationExpiry) {
        return false;
      }

      await db
        .update(users)
        .set({
          isEmailVerified: true,
          emailVerificationCode: null,
          emailVerificationExpiry: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      return true;
    } catch (error) {
      console.error("Error verifying email with code:", error);
      return false;
    }
  }

  // Meetup operations
  async createMeetup(meetupData: InsertMeetup): Promise<Meetup> {
    const [meetup] = await db.insert(meetups).values(meetupData).returning();
    return meetup;
  }

  async getMeetup(id: number): Promise<MeetupWithParticipants | undefined> {
    const [meetup] = await db
      .select()
      .from(meetups)
      .leftJoin(users, eq(meetups.createdBy, users.id))
      .where(eq(meetups.id, id));

    if (!meetup) return undefined;

    const participants = await db
      .select()
      .from(meetupParticipants)
      .leftJoin(users, eq(meetupParticipants.userId, users.id))
      .where(and(
        eq(meetupParticipants.meetupId, id),
        eq(meetupParticipants.status, 'joined')
      ));

    return {
      ...meetup.meetups,
      creator: meetup.users!,
      participants: participants.map(p => ({
        ...p.meetup_participants!,
        user: p.users!,
      })),
    };
  }

  async getMeetups(filters?: Partial<MeetupFilter>): Promise<MeetupWithCreator[]> {
    // Build all conditions including base condition
    const conditions = [eq(meetups.status, 'open')];
    
    if (filters?.meetupType) {
      conditions.push(eq(meetups.meetupType, filters.meetupType));
    }
    
    if (filters?.ageRangeMin) {
      conditions.push(gte(meetups.ageRangeMin, filters.ageRangeMin));
    }
    
    if (filters?.ageRangeMax) {
      conditions.push(lte(meetups.ageRangeMax, filters.ageRangeMax));
    }
    
    if (filters?.restaurantType && filters.restaurantType !== 'any') {
      conditions.push(eq(meetups.restaurantType, filters.restaurantType));
    }
    
    if (filters?.maxDistance) {
      conditions.push(lte(meetups.maxDistance, filters.maxDistance));
    }

    const query = db
      .select()
      .from(meetups)
      .leftJoin(users, eq(meetups.createdBy, users.id))
      .where(and(...conditions));

    const results = await query.orderBy(desc(meetups.createdAt));
    
    return results.map(result => ({
      ...result.meetups,
      creator: result.users!,
    }));
  }

  async updateMeetup(id: number, updates: Partial<Meetup>): Promise<Meetup | undefined> {
    const [meetup] = await db
      .update(meetups)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(meetups.id, id))
      .returning();
    return meetup;
  }

  async deleteMeetup(id: number): Promise<boolean> {
    const result = await db.delete(meetups).where(eq(meetups.id, id));
    return !!(result.rowCount && result.rowCount > 0);
  }

  // Meetup participant operations
  async joinMeetup(participation: InsertMeetupParticipant): Promise<MeetupParticipant> {
    const [participant] = await db.insert(meetupParticipants).values(participation).returning();
    
    // Update participant count
    await db
      .update(meetups)
      .set({
        currentParticipants: sql`${meetups.currentParticipants} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(meetups.id, participation.meetupId));
    
    return participant;
  }

  async leaveMeetup(meetupId: number, userId: number): Promise<boolean> {
    const result = await db
      .update(meetupParticipants)
      .set({ status: 'left' })
      .where(and(
        eq(meetupParticipants.meetupId, meetupId),
        eq(meetupParticipants.userId, userId),
        eq(meetupParticipants.status, 'joined')
      ));

    if (result.rowCount && result.rowCount > 0) {
      // Update participant count
      await db
        .update(meetups)
        .set({
          currentParticipants: sql`${meetups.currentParticipants} - 1`,
          updatedAt: new Date(),
        })
        .where(eq(meetups.id, meetupId));
    }

    return !!(result.rowCount && result.rowCount > 0);
  }

  async getMeetupParticipants(meetupId: number): Promise<(MeetupParticipant & { user: User })[]> {
    const results = await db
      .select()
      .from(meetupParticipants)
      .leftJoin(users, eq(meetupParticipants.userId, users.id))
      .where(and(
        eq(meetupParticipants.meetupId, meetupId),
        eq(meetupParticipants.status, 'joined')
      ));

    return results.map(result => ({
      ...result.meetup_participants,
      user: result.users!,
    }));
  }

  async getUserMeetups(userId: number): Promise<MeetupWithCreator[]> {
    const participations = await db
      .select()
      .from(meetupParticipants)
      .leftJoin(meetups, eq(meetupParticipants.meetupId, meetups.id))
      .leftJoin(users, eq(meetups.createdBy, users.id))
      .where(and(
        eq(meetupParticipants.userId, userId),
        eq(meetupParticipants.status, 'joined')
      ))
      .orderBy(desc(meetups.scheduledDate));

    return participations.map(p => ({
      ...p.meetups!,
      creator: p.users!,
    }));
  }

  // Chat operations
  async createChatMessage(messageData: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values(messageData).returning();
    return message;
  }

  async getChatMessages(meetupId: number): Promise<ChatMessageWithUser[]> {
    const results = await db
      .select()
      .from(chatMessages)
      .leftJoin(users, eq(chatMessages.userId, users.id))
      .where(eq(chatMessages.meetupId, meetupId))
      .orderBy(asc(chatMessages.createdAt));

    return results.map(result => ({
      ...result.chat_messages,
      user: result.users!,
    }));
  }

  async getMatchChatMessages(matchId: number): Promise<ChatMessageWithUser[]> {
    const results = await db
      .select()
      .from(chatMessages)
      .leftJoin(users, eq(chatMessages.userId, users.id))
      .where(eq(chatMessages.matchId, matchId))
      .orderBy(asc(chatMessages.createdAt));

    return results.map(result => ({
      ...result.chat_messages,
      user: result.users!,
    }));
  }

  async createMatchChatMessage(matchId: number, userId: number, message: string): Promise<ChatMessage> {
    try {
      // Insert the chat message using the matchId column directly
      const [chatMessage] = await db.insert(chatMessages).values({
        matchId: matchId,
        userId,
        message,
      }).returning();
      
      return chatMessage;
    } catch (error) {
      console.error('Error creating match chat message:', error);
      throw error;
    }
  }

  // Survey operations
  async createSurveyResponse(responseData: InsertSurveyResponse): Promise<SurveyResponse> {
    const [response] = await db.insert(userSurveyResponses).values(responseData).returning();
    
    // Mark user as having taken the survey
    await db
      .update(users)
      .set({ hasTakenSurvey: true, updatedAt: new Date() })
      .where(eq(users.id, responseData.userId));
    
    return response;
  }

  async getSurveyResponse(userId: number): Promise<SurveyResponse | undefined> {
    const [response] = await db
      .select()
      .from(userSurveyResponses)
      .where(eq(userSurveyResponses.userId, userId));
    return response;
  }

  // Meetup request operations
  async createMeetupRequest(requestData: InsertMeetupRequest): Promise<MeetupRequest> {
    const [request] = await db.insert(meetupRequests).values(requestData).returning();
    return request;
  }

  async getUserActiveRequest(userId: number, meetupType: string): Promise<MeetupRequest | undefined> {
    const [request] = await db
      .select()
      .from(meetupRequests)
      .where(and(
        eq(meetupRequests.userId, userId),
        eq(meetupRequests.meetupType, meetupType),
        eq(meetupRequests.status, 'active')
      ))
      .limit(1);
    return request;
  }

  async getUserAnyActiveRequest(userId: number): Promise<MeetupRequest | undefined> {
    const [request] = await db
      .select()
      .from(meetupRequests)
      .where(and(
        eq(meetupRequests.userId, userId),
        eq(meetupRequests.status, 'active')
      ))
      .limit(1);
    return request;
  }

  async cancelMeetupRequest(requestId: number): Promise<boolean> {
    const result = await db
      .update(meetupRequests)
      .set({ status: 'cancelled' })
      .where(eq(meetupRequests.id, requestId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Calculate distance between two locations using Haversine formula
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI/180);
  }

  // Extract coordinates from location string (supports both "lat,lon" format and address lookups)
  private async getCoordinatesFromLocation(location: string): Promise<{lat: number, lon: number} | null> {
    if (!location) return null;

    // Check if location is already in "lat,lon" format
    const coordMatch = location.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
    if (coordMatch) {
      return {
        lat: parseFloat(coordMatch[1]),
        lon: parseFloat(coordMatch[2])
      };
    }

    // For address strings, use geocoding to get coordinates
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon)
        };
      }
    } catch (error) {
      console.error('Error geocoding location:', error);
    }

    return null;
  }

  // Matching operations - handles both 1v1 and group matching with different logic
  async findPotentialMatches(userId: number, meetupType: string, venueType?: string, ageRangeMin?: number, ageRangeMax?: number, maxDistance?: number): Promise<number[]> {
    if (meetupType === 'group') {
      return this.findGroupMatches(userId, venueType, ageRangeMin, ageRangeMax, maxDistance);
    } else {
      return this.find1v1Matches(userId, venueType, ageRangeMin, ageRangeMax, maxDistance);
    }
  }

  // 1v1 matching - requires shared interests and compatible logistics
  private async find1v1Matches(userId: number, venueType?: string, ageRangeMin?: number, ageRangeMax?: number, maxDistance?: number): Promise<number[]> {
    const currentUserSurvey = await this.getSurveyResponse(userId);
    if (!currentUserSurvey) return []; // 1v1 requires survey

    // Get current user's location for distance calculations
    const currentUserData = await this.getUser(userId);
    const currentUserCoords = currentUserData?.location ? await this.getCoordinatesFromLocation(currentUserData.location) : null;

    // Find potential 1v1 matches with same venue type
    const potentialRequests = await db
      .select({ 
        userId: meetupRequests.userId,
        requestId: meetupRequests.id,
        ageRangeMin: meetupRequests.ageRangeMin,
        ageRangeMax: meetupRequests.ageRangeMax,
        preferredTime: meetupRequests.preferredTime,
        preferredDate: meetupRequests.preferredDate,
        favoriteConversationTopic: userSurveyResponses.favoriteConversationTopic,
        favoriteMusic: userSurveyResponses.favoriteMusic,
        favoriteShow: userSurveyResponses.favoriteShow,
        personalityType: userSurveyResponses.personalityType,
        hobbies: userSurveyResponses.hobbies,
        userAge: users.age,
        userLocation: users.location
      })
      .from(meetupRequests)
      .leftJoin(userSurveyResponses, eq(meetupRequests.userId, userSurveyResponses.userId))
      .leftJoin(users, eq(meetupRequests.userId, users.id))
      .where(and(
        eq(meetupRequests.meetupType, '1v1'),
        eq(meetupRequests.status, 'active'),
        sql`${meetupRequests.userId} != ${userId}`,
        eq(meetupRequests.venueType, venueType || '')
      ))
      .limit(20);

    // Filter by age compatibility, distance, and shared interests
    const currentUserAge = currentUserData?.age;
    
    const compatibleUsers = await Promise.all(
      potentialRequests.map(async (req) => {
        // Age compatibility check - college students only (18-24)
        if (ageRangeMin !== undefined && ageRangeMax !== undefined && req.userAge) {
          // Enforce college age limits
          if (req.userAge < 18 || req.userAge > 24) return null;
          if (currentUserAge && (currentUserAge < 18 || currentUserAge > 24)) return null;
          
          const theirAgeInMyRange = req.userAge >= ageRangeMin && req.userAge <= ageRangeMax;
          let myAgeInTheirRange = true;
          if (req.ageRangeMin && req.ageRangeMax && currentUserAge) {
            myAgeInTheirRange = currentUserAge >= req.ageRangeMin && currentUserAge <= req.ageRangeMax;
          }
          if (!theirAgeInMyRange || !myAgeInTheirRange) return null;
        }

        // Distance check if both users have locations and maxDistance is specified
        if (currentUserCoords && req.userLocation && maxDistance) {
          const otherUserCoords = await this.getCoordinatesFromLocation(req.userLocation);
          if (otherUserCoords) {
            const distance = this.calculateDistance(
              currentUserCoords.lat, currentUserCoords.lon,
              otherUserCoords.lat, otherUserCoords.lon
            );
            if (distance > maxDistance) return null;
          }
        }

        // Shared interest requirement for 1v1
        if (!req.favoriteConversationTopic) return null;
        
        const hasSharedInterest = (
          req.favoriteConversationTopic === currentUserSurvey.favoriteConversationTopic ||
          req.favoriteMusic === currentUserSurvey.favoriteMusic ||
          req.favoriteShow === currentUserSurvey.favoriteShow ||
          req.personalityType === currentUserSurvey.personalityType ||
          req.hobbies === currentUserSurvey.hobbies
        );

        return hasSharedInterest ? req : null;
      })
    );

    return compatibleUsers.filter(user => user !== null).map(user => user!.userId);
  }

  // Group matching - fills existing groups before creating new ones
  private async findGroupMatches(userId: number, venueType?: string, ageRangeMin?: number, ageRangeMax?: number, maxDistance?: number): Promise<number[]> {
    // Get current user's request to match logistics
    const currentUserRequest = await db
      .select()
      .from(meetupRequests)
      .where(and(
        eq(meetupRequests.userId, userId),
        eq(meetupRequests.status, 'active'),
        eq(meetupRequests.meetupType, 'group')
      ))
      .orderBy(sql`${meetupRequests.createdAt} DESC`)
      .limit(1);

    if (!currentUserRequest[0]) return [];
    const currentRequest = currentUserRequest[0];

    // First, check for existing groups that match logistics and need more members
    const existingMatches = await db
      .select()
      .from(matches)
      .where(and(
        eq(matches.meetupType, 'group'),
        eq(matches.status, 'active'),
        eq(matches.venueType, currentRequest.venueType)
      ));

    // Find groups with space (less than 4 members) that match our criteria
    for (const match of existingMatches) {
      // Check if dates/times match
      if (match.suggestedDate === currentRequest.preferredDate && 
          match.suggestedTime === currentRequest.preferredTime) {
        const currentParticipants = Array.isArray(match.participants) ? match.participants : [];
        if (currentParticipants.length < 4 && !currentParticipants.includes(userId)) {
          // Check age compatibility with existing group members
          if (await this.isAgeCompatibleWithGroup(userId, currentParticipants, ageRangeMin, ageRangeMax)) {
            console.log(`Found existing group ${match.id} with ${currentParticipants.length} members`);
            return currentParticipants;
          }
        }
      }
    }

    // No existing compatible groups with space, find individual users for new group
    const potentialRequests = await db
      .select({ 
        userId: meetupRequests.userId,
        ageRangeMin: meetupRequests.ageRangeMin,
        ageRangeMax: meetupRequests.ageRangeMax,
        userAge: users.age,
        preferredDate: meetupRequests.preferredDate,
        preferredTime: meetupRequests.preferredTime,
        userLocation: users.location
      })
      .from(meetupRequests)
      .leftJoin(users, eq(meetupRequests.userId, users.id))
      .where(and(
        eq(meetupRequests.meetupType, 'group'),
        eq(meetupRequests.status, 'active'),
        sql`${meetupRequests.userId} != ${userId}`,
        eq(meetupRequests.venueType, currentRequest.venueType)
      ))
      .limit(10);

    // Filter by date/time, age compatibility, and distance for new group formation
    const currentUser = await this.getUser(userId);
    const currentUserAge = currentUser?.age;
    const currentUserCoords = currentUser?.location ? await this.getCoordinatesFromLocation(currentUser.location) : null;
    
    const compatibleUsers = await Promise.all(
      potentialRequests.map(async (req) => {
        // Must match date and time
        if (req.preferredDate !== currentRequest.preferredDate || 
            req.preferredTime !== currentRequest.preferredTime) {
          return null;
        }
        
        if (!req.userAge) return null;
        
        // Enforce college age limits (18-24) for all users
        if (!req.userAge || req.userAge < 18 || req.userAge > 24) return null;
        if (!currentUserAge || currentUserAge < 18 || currentUserAge > 24) return null;
        
        // If current user has age preferences
        if (ageRangeMin !== undefined && ageRangeMax !== undefined) {
          if (req.userAge < ageRangeMin || req.userAge > ageRangeMax) return null;
        }
        
        // If other user has age preferences and current user has age
        if (req.ageRangeMin && req.ageRangeMax && currentUserAge) {
          if (currentUserAge < req.ageRangeMin || currentUserAge > req.ageRangeMax) return null;
        }

        // Distance check if both users have locations and maxDistance is specified
        if (currentUserCoords && req.userLocation && maxDistance) {
          const otherUserCoords = await this.getCoordinatesFromLocation(req.userLocation);
          if (otherUserCoords) {
            const distance = this.calculateDistance(
              currentUserCoords.lat, currentUserCoords.lon,
              otherUserCoords.lat, otherUserCoords.lon
            );
            if (distance > maxDistance) return null;
          }
        }
        
        return req;
      })
    );

    const filteredUsers = compatibleUsers.filter((user): user is NonNullable<typeof user> => user !== null);

    console.log(`Found ${filteredUsers.length} users for new group formation`);
    return filteredUsers.map(user => user.userId);
  }

  // Check if user's age is compatible with existing group members (simplified)
  private async isAgeCompatibleWithGroup(userId: number, groupMemberIds: number[], ageRangeMin?: number, ageRangeMax?: number): Promise<boolean> {
    const currentUser = await this.getUser(userId);
    if (!currentUser?.age) return true; // If no age info, allow match

    // For simplicity, just check if current user's age preferences allow group formation
    if (ageRangeMin !== undefined && ageRangeMax !== undefined) {
      // Basic age compatibility check - can be expanded later
      return true; // Allow group formation for now
    }

    return true;
  }

  async findSharedInterest(userId1: number, userId2: number): Promise<string | null> {
    const [survey1, survey2] = await Promise.all([
      db.select().from(userSurveyResponses).where(eq(userSurveyResponses.userId, userId1)).limit(1),
      db.select().from(userSurveyResponses).where(eq(userSurveyResponses.userId, userId2)).limit(1)
    ]);

    if (!survey1[0] || !survey2[0]) return null;

    const user1Survey = survey1[0];
    const user2Survey = survey2[0];

    // Check each survey category for matches
    if (user1Survey.favoriteConversationTopic === user2Survey.favoriteConversationTopic) {
      return `Both enjoy talking about ${user1Survey.favoriteConversationTopic}`;
    }
    if (user1Survey.favoriteMusic === user2Survey.favoriteMusic) {
      return `Both love ${user1Survey.favoriteMusic} music`;
    }
    if (user1Survey.favoriteShow === user2Survey.favoriteShow) {
      return `Both enjoy ${user1Survey.favoriteShow} shows`;
    }
    if (user1Survey.personalityType === user2Survey.personalityType) {
      return `Both have ${user1Survey.personalityType} personalities`;
    }
    if (user1Survey.hobbies === user2Survey.hobbies) {
      return `Both enjoy ${user1Survey.hobbies}`;
    }

    return null; // No shared interests found
  }

  private calculateCompatibilityScore(user1: SurveyResponse, user2: SurveyResponse): number {
    let score = 0;
    
    // Same conversation topic preference +20
    if (user1.favoriteConversationTopic === user2.favoriteConversationTopic) score += 20;
    
    // Same music genre +20
    if (user1.favoriteMusic === user2.favoriteMusic) score += 20;
    
    // Same show preference +20
    if (user1.favoriteShow === user2.favoriteShow) score += 20;
    
    // Compatible personality types +20
    if (this.arePersonalitiesCompatible(user1.personalityType, user2.personalityType)) score += 20;
    
    // Same hobbies +20
    if (user1.hobbies === user2.hobbies) score += 20;
    
    return score;
  }

  private arePersonalitiesCompatible(type1: string | null, type2: string | null): boolean {
    if (!type1 || !type2) return false;
    
    // Compatible personality combinations
    const compatiblePairs = [
      ['outgoing', 'adventurous'],
      ['thoughtful', 'passionate'],
      ['chill', 'thoughtful'],
      ['adventurous', 'passionate'],
      ['outgoing', 'passionate']
    ];
    
    return type1 === type2 || 
           compatiblePairs.some(pair => 
             (pair[0] === type1 && pair[1] === type2) || 
             (pair[0] === type2 && pair[1] === type1)
           );
  }

  async createMatch(matchData: any): Promise<Match> {
    // Mark any existing matches for these participants as completed
    for (const participantId of matchData.participants) {
      await db
        .update(matches)
        .set({ status: 'completed', updatedAt: new Date() })
        .where(and(
          sql`${participantId} = ANY(${matches.participants})`,
          inArray(matches.status, ['pending', 'confirmed', 'active'])
        ));
    }
    
    const [match] = await db.insert(matches).values(matchData).returning();
    
    // Mark all participants' requests as matched
    await db
      .update(meetupRequests)
      .set({ status: 'matched' })
      .where(and(
        inArray(meetupRequests.userId, matchData.participants),
        eq(meetupRequests.meetupType, matchData.meetupType) // Ensure same type
      ));
    
    return match;
  }

  async getUserMatches(userId: number): Promise<MatchWithUsers[]> {
    // Only get the single most recent active match
    const userMatches = await db
      .select()
      .from(matches)
      .where(and(
        sql`${userId} = ANY(${matches.participants})`,
        eq(matches.status, 'pending') // Only show pending matches (current active ones)
      ))
      .orderBy(desc(matches.createdAt))
      .limit(1); // Only return the most recent active match

    const matchesWithUsers = await Promise.all(
      userMatches.map(async (match) => {
        const participantUsers = await db
          .select()
          .from(users)
          .where(inArray(users.id, match.participants));
        
        return {
          ...match,
          users: participantUsers
        };
      })
    );

    return matchesWithUsers;
  }

  async updateMatch(id: number, updates: Partial<Match>): Promise<Match | undefined> {
    const [updatedMatch] = await db
      .update(matches)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(matches.id, id))
      .returning();
    
    return updatedMatch;
  }

  async deleteMatch(id: number): Promise<boolean> {
    try {
      // Delete all chat messages for this match first
      await db.delete(chatMessages).where(eq(chatMessages.matchId, id));
      
      // Delete the match
      await db.delete(matches).where(eq(matches.id, id));
      
      return true;
    } catch (error) {
      console.error('Error deleting match:', error);
      return false;
    }
  }

}

export const storage = new DatabaseStorage();
