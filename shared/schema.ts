import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isAgeVerified: boolean("is_age_verified").default(false).notNull(),
  bio: text("bio"),
  interests: text("interests").array(),
  location: varchar("location"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const meetups = pgTable("meetups", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  meetupType: varchar("meetup_type").notNull(), // '1v1', '3people', 'group'
  maxParticipants: integer("max_participants").notNull(),
  currentParticipants: integer("current_participants").default(0).notNull(),
  restaurantName: varchar("restaurant_name"),
  restaurantAddress: text("restaurant_address"),
  restaurantType: varchar("restaurant_type"), // 'casual', 'fine', 'fast', 'any'
  scheduledDate: timestamp("scheduled_date"),
  scheduledTime: varchar("scheduled_time"),
  status: varchar("status").default('open').notNull(), // 'open', 'full', 'completed', 'cancelled'
  createdBy: varchar("created_by").notNull().references(() => users.id),
  ageRangeMin: integer("age_range_min"),
  ageRangeMax: integer("age_range_max"),
  maxDistance: integer("max_distance"), // in miles
  requiredInterests: text("required_interests").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const meetupParticipants = pgTable("meetup_participants", {
  id: serial("id").primaryKey(),
  meetupId: integer("meetup_id").notNull().references(() => meetups.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  status: varchar("status").default('joined').notNull(), // 'joined', 'left', 'removed'
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  meetupId: integer("meetup_id").notNull().references(() => meetups.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdMeetups: many(meetups),
  participations: many(meetupParticipants),
  chatMessages: many(chatMessages),
}));

export const meetupsRelations = relations(meetups, ({ one, many }) => ({
  creator: one(users, {
    fields: [meetups.createdBy],
    references: [users.id],
  }),
  participants: many(meetupParticipants),
  chatMessages: many(chatMessages),
}));

export const meetupParticipantsRelations = relations(meetupParticipants, ({ one }) => ({
  meetup: one(meetups, {
    fields: [meetupParticipants.meetupId],
    references: [meetups.id],
  }),
  user: one(users, {
    fields: [meetupParticipants.userId],
    references: [users.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  meetup: one(meetups, {
    fields: [chatMessages.meetupId],
    references: [meetups.id],
  }),
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));

// Schemas
export const upsertUserSchema = createInsertSchema(users);
export const insertMeetupSchema = createInsertSchema(meetups).omit({ 
  id: true, 
  currentParticipants: true,
  createdAt: true,
  updatedAt: true 
});
export const insertMeetupParticipantSchema = createInsertSchema(meetupParticipants).omit({ 
  id: true, 
  joinedAt: true 
});
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ 
  id: true, 
  createdAt: true 
});

// Filter schema for meetup search
export const meetupFilterSchema = z.object({
  meetupType: z.enum(['1v1', '3people', 'group']),
  ageRangeMin: z.number().min(18).optional(),
  ageRangeMax: z.number().min(18).optional(),
  interests: z.array(z.string()).optional(),
  restaurantType: z.enum(['casual', 'fine', 'fast', 'any']).optional(),
  maxDistance: z.number().positive().optional(),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
});

// Types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertMeetup = z.infer<typeof insertMeetupSchema>;
export type Meetup = typeof meetups.$inferSelect;
export type MeetupWithCreator = Meetup & { creator: User };
export type MeetupWithParticipants = Meetup & { 
  creator: User; 
  participants: (typeof meetupParticipants.$inferSelect & { user: User })[] 
};
export type InsertMeetupParticipant = z.infer<typeof insertMeetupParticipantSchema>;
export type MeetupParticipant = typeof meetupParticipants.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type ChatMessageWithUser = ChatMessage & { user: User };
export type MeetupFilter = z.infer<typeof meetupFilterSchema>;
