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
  decimal,
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

// Password reset table for reset codes
export const passwordResets = pgTable("password_resets", {
  id: serial("id").primaryKey(),
  email: varchar("email").notNull(),
  resetCode: varchar("reset_code").notNull(),
  resetExpiry: timestamp("reset_expiry").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Pending registrations table for unverified accounts
export const pendingRegistrations = pgTable("pending_registrations", {
  id: serial("id").primaryKey(),
  username: varchar("username").notNull(),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  dateOfBirth: timestamp("date_of_birth"),
  age: integer("age"),
  verificationCode: varchar("verification_code").notNull(),
  verificationExpiry: timestamp("verification_expiry").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username").unique().notNull(),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  dateOfBirth: timestamp("date_of_birth"),
  age: integer("age"),
  isEmailVerified: boolean("is_email_verified").default(true).notNull(),
  hasTakenSurvey: boolean("has_taken_survey").default(false).notNull(),
  bio: text("bio"),
  interests: text("interests").array(),
  location: varchar("location"),
  latitude: varchar("latitude"),
  longitude: varchar("longitude"),
  // Trust verification fields
  trustScore: integer("trust_score").default(0),
  isIdVerified: boolean("is_id_verified").default(false),
  isPhoneVerified: boolean("is_phone_verified").default(false),
  phoneNumber: varchar("phone_number"),
  isProfilePictureVerified: boolean("is_profile_picture_verified").default(false),
  verificationStatus: varchar("verification_status").default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userSurveyResponses = pgTable("user_survey_responses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  favoriteConversationTopic: varchar("favorite_conversation_topic"),
  favoriteMusic: varchar("favorite_music"),
  personalityType: varchar("personality_type"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const meetupRequests = pgTable("meetup_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  meetupType: varchar("meetup_type").notNull(),
  venueType: varchar("venue_type").notNull(),
  preferredTime: varchar("preferred_time"),
  preferredDate: varchar("preferred_date"),
  maxDistance: integer("max_distance").default(5),
  ageRangeMin: integer("age_range_min"),
  ageRangeMax: integer("age_range_max"),
  status: varchar("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  participants: integer("participants").array().notNull(),
  meetupType: varchar("meetup_type").notNull(),
  venueType: varchar("venue_type").notNull(),
  suggestedTime: varchar("suggested_time"),
  suggestedDate: varchar("suggested_date"),
  matchScore: integer("match_score").default(0),
  suggestedLocation: varchar("suggested_location"), // Group meetup location
  status: varchar("status").default("pending").notNull(),
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
  createdBy: integer("created_by").notNull().references(() => users.id),
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
  userId: integer("user_id").notNull().references(() => users.id),
  status: varchar("status").default('joined').notNull(), // 'joined', 'left', 'removed'
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  meetupId: integer("meetup_id").references(() => meetups.id),
  matchId: integer("match_id").references(() => matches.id),
  userId: integer("user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  createdMeetups: many(meetups),
  participations: many(meetupParticipants),
  chatMessages: many(chatMessages),
  surveyResponse: one(userSurveyResponses),
  meetupRequests: many(meetupRequests),
}));

export const userSurveyResponsesRelations = relations(userSurveyResponses, ({ one }) => ({
  user: one(users, {
    fields: [userSurveyResponses.userId],
    references: [users.id],
  }),
}));

export const meetupRequestsRelations = relations(meetupRequests, ({ one }) => ({
  user: one(users, {
    fields: [meetupRequests.userId],
    references: [users.id],
  }),
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
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
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

export const insertSurveyResponseSchema = createInsertSchema(userSurveyResponses).omit({
  id: true,
  createdAt: true
});

export const insertMeetupRequestSchema = createInsertSchema(meetupRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPendingRegistrationSchema = createInsertSchema(pendingRegistrations).omit({
  id: true,
  createdAt: true
});

export const insertPasswordResetSchema = createInsertSchema(passwordResets).omit({
  id: true,
  createdAt: true
});

// Survey response schema with validation
export const surveyResponseSchema = z.object({
  favoriteConversationTopic: z.enum(['travel', 'food', 'career', 'hobbies', 'current_events']),
  favoriteMusic: z.enum(['pop', 'rock', 'hiphop', 'electronic', 'indie']),
  personalityType: z.enum(['outgoing', 'thoughtful', 'adventurous', 'chill', 'passionate'])
});

// Meetup request schema - group matching only
export const meetupRequestSchema = z.object({
  meetupType: z.enum(['group']),
  venueType: z.enum(['restaurant', 'cafe']),
  preferredTime: z.enum(['lunch', 'dinner']),
  preferredDate: z.string().min(1, "Date is required"),
  maxDistance: z.number().min(5).max(50).default(5),
  ageRangeMin: z.number().min(18).max(80).optional(),
  ageRangeMax: z.number().min(18).max(80).optional()
});

// Registration schema with date of birth validation
export const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  dateOfBirth: z.string().refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age = age - 1;
    }
    return age >= 18;
  }, "You must be at least 18 years old to join"),
  age: z.number().min(18).optional(),
  isAdult: z.boolean().refine((val) => val === true, "You must confirm you are 18+ years old"),
});

// Login schema
export const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, "Username or email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Email verification schema
export const emailVerificationSchema = z.object({
  email: z.string().email("Valid email is required"),
  code: z.string().length(6, "Verification code must be 6 digits"),
});

// Forgot password schemas
export const forgotPasswordSchema = z.object({
  email: z.string().email("Valid email is required"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Valid email is required"),
  code: z.string().length(6, "Reset code must be 6 digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

// Filter schema for meetup search
export const meetupFilterSchema = z.object({
  meetupType: z.enum(['1v1', 'group']),
  ageRangeMin: z.number().min(18).max(80).optional(),
  ageRangeMax: z.number().min(18).max(80).optional(),
  interests: z.array(z.string()).optional(),
  restaurantType: z.enum(['casual', 'fine', 'fast', 'any']).optional(),
  maxDistance: z.number().positive().optional(),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
});

// Types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type User = typeof users.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
export type EmailVerification = z.infer<typeof emailVerificationSchema>;
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
export type InsertSurveyResponse = z.infer<typeof insertSurveyResponseSchema>;
export type SurveyResponse = typeof userSurveyResponses.$inferSelect;
export type SurveyFormData = z.infer<typeof surveyResponseSchema>;
export type InsertMeetupRequest = z.infer<typeof insertMeetupRequestSchema>;
export type MeetupRequest = typeof meetupRequests.$inferSelect;
export type MeetupRequestFormData = z.infer<typeof meetupRequestSchema>;
export type Match = typeof matches.$inferSelect;
export type MatchWithUsers = Match & { users: User[] };
export type InsertPendingRegistration = z.infer<typeof insertPendingRegistrationSchema>;
export type PendingRegistration = typeof pendingRegistrations.$inferSelect;
export type InsertPasswordReset = z.infer<typeof insertPasswordResetSchema>;
export type PasswordReset = typeof passwordResets.$inferSelect;
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;
