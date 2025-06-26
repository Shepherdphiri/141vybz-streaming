import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const calls = pgTable("calls", {
  id: serial("id").primaryKey(),
  callerId: text("caller_id").notNull(),
  calleeId: text("callee_id").notNull(),
  duration: integer("duration").notNull().default(0), // in seconds
  status: text("status").notNull(), // 'completed', 'missed', 'rejected'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCallSchema = createInsertSchema(calls).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCall = z.infer<typeof insertCallSchema>;
export type Call = typeof calls.$inferSelect;

// WebRTC signaling message types
export const signalingMessageSchema = z.object({
  type: z.enum(['offer', 'answer', 'ice-candidate', 'call-request', 'call-response', 'call-end', 'register', 'error']),
  from: z.string(),
  to: z.string().optional(),
  data: z.any().optional(),
  message: z.string().optional(),
  targetUser: z.string().optional(),
});

export type SignalingMessage = z.infer<typeof signalingMessageSchema>;
