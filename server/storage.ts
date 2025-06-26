import {
  users,
  meetups,
  meetupParticipants,
  chatMessages,
  userSurveyResponses,
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
}

export const storage = new DatabaseStorage();
