import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Define the 'users' table for user authentication and profiles.
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

