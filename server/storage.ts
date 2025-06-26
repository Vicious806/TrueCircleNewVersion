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
import { eq, and, gte, lte, or, inArray, desc, asc, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  verifyEmail(token: string): Promise<boolean>;
  
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
  
  // Survey operations
  createSurveyResponse(response: InsertSurveyResponse): Promise<SurveyResponse>;
  getSurveyResponse(userId: number): Promise<SurveyResponse | undefined>;
  
  // Meetup request operations
  createMeetupRequest(request: InsertMeetupRequest): Promise<MeetupRequest>;
  
  // Matching operations
  findPotentialMatches(userId: number, meetupType: string): Promise<number[]>;
  createMatch(match: any): Promise<Match>;
  getUserMatches(userId: number): Promise<MatchWithUsers[]>;
  updateMatch(id: number, updates: Partial<Match>): Promise<Match | undefined>;
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
    const [user] = await db.insert(users).values(userData).returning();
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

  async verifyEmail(token: string): Promise<boolean> {
    const [user] = await db
      .update(users)
      .set({ 
        isEmailVerified: true, 
        emailVerificationToken: null,
        updatedAt: new Date()
      })
      .where(eq(users.emailVerificationToken, token))
      .returning();
    return !!user;
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

  // Matching operations - ensures only same meetup types and venue types get matched
  async findPotentialMatches(userId: number, meetupType: string, venueType?: string): Promise<number[]> {
    // Find other users who requested the SAME meetup type AND venue type
    const conditions = [
      eq(meetupRequests.meetupType, meetupType), // CRITICAL: Only same meetup type
      eq(meetupRequests.status, 'active'),
      sql`${meetupRequests.userId} != ${userId}` // Exclude self
    ];
    
    if (venueType) {
      conditions.push(eq(meetupRequests.venueType, venueType)); // CRITICAL: Only same venue type
    }

    const potentialRequests = await db
      .select()
      .from(meetupRequests)
      .leftJoin(userSurveyResponses, eq(meetupRequests.userId, userSurveyResponses.userId))
      .where(and(...conditions))
      .limit(10);

    // Get current user's survey for compatibility matching
    const currentUserSurvey = await this.getSurveyResponse(userId);
    if (!currentUserSurvey) return [];

    // Calculate compatibility scores and return user IDs
    const compatibleUsers = potentialRequests
      .filter(result => result.user_survey_responses)
      .map(result => ({
        userId: result.meetup_requests.userId,
        score: this.calculateCompatibilityScore(currentUserSurvey, result.user_survey_responses!)
      }))
      .filter(user => user.score >= 60) // Minimum compatibility threshold
      .sort((a, b) => b.score - a.score)
      .map(user => user.userId);

    return compatibleUsers;
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
    const userMatches = await db
      .select()
      .from(matches)
      .where(sql`${userId} = ANY(${matches.participants})`)
      .orderBy(desc(matches.createdAt));

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
}

export const storage = new DatabaseStorage();
