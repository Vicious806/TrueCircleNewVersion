import {
  users,
  meetups,
  meetupParticipants,
  chatMessages,
  type User,
  type UpsertUser,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, or, inArray, desc, asc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Meetup operations
  createMeetup(meetup: InsertMeetup): Promise<Meetup>;
  getMeetup(id: number): Promise<MeetupWithParticipants | undefined>;
  getMeetups(filters?: Partial<MeetupFilter>): Promise<MeetupWithCreator[]>;
  updateMeetup(id: number, updates: Partial<Meetup>): Promise<Meetup | undefined>;
  deleteMeetup(id: number): Promise<boolean>;
  
  // Meetup participant operations
  joinMeetup(participation: InsertMeetupParticipant): Promise<MeetupParticipant>;
  leaveMeetup(meetupId: number, userId: string): Promise<boolean>;
  getMeetupParticipants(meetupId: number): Promise<(MeetupParticipant & { user: User })[]>;
  getUserMeetups(userId: string): Promise<MeetupWithCreator[]>;
  
  // Chat operations
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(meetupId: number): Promise<ChatMessageWithUser[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
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
    let query = db
      .select()
      .from(meetups)
      .leftJoin(users, eq(meetups.createdBy, users.id))
      .where(eq(meetups.status, 'open'));

    // Apply filters
    const conditions = [];
    
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

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

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
    return result.rowCount > 0;
  }

  // Meetup participant operations
  async joinMeetup(participation: InsertMeetupParticipant): Promise<MeetupParticipant> {
    const [participant] = await db.insert(meetupParticipants).values(participation).returning();
    
    // Update participant count
    await db
      .update(meetups)
      .set({
        currentParticipants: meetups.currentParticipants + 1,
        updatedAt: new Date(),
      })
      .where(eq(meetups.id, participation.meetupId));
    
    return participant;
  }

  async leaveMeetup(meetupId: number, userId: string): Promise<boolean> {
    const result = await db
      .update(meetupParticipants)
      .set({ status: 'left' })
      .where(and(
        eq(meetupParticipants.meetupId, meetupId),
        eq(meetupParticipants.userId, userId),
        eq(meetupParticipants.status, 'joined')
      ));

    if (result.rowCount > 0) {
      // Update participant count
      await db
        .update(meetups)
        .set({
          currentParticipants: meetups.currentParticipants - 1,
          updatedAt: new Date(),
        })
        .where(eq(meetups.id, meetupId));
    }

    return result.rowCount > 0;
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

  async getUserMeetups(userId: string): Promise<MeetupWithCreator[]> {
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
}

export const storage = new DatabaseStorage();
