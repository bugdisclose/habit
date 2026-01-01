import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const habits = sqliteTable('habits', {
  id: integer('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  completeDays: text('complete_days', { mode: 'json' }).$type<string[]>().notNull().default([]),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  habitView: integer('habit_view', { mode: 'boolean' }).notNull().default(false),
});

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  login: text('login').notNull().unique(),
  name: text('name'),
  bio: text('bio'),
  avatarUrl: text('avatar_url').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  userView: integer('user_view', { mode: 'boolean' }).notNull().default(false),
});

export const habitShares = sqliteTable('habit_shares', {
  id: integer('id').primaryKey(),
  habitId: integer('habit_id').notNull(),
  userId: text('user_id').notNull(),
  sharedWithId: text('shared_with_id').notNull(),
  mode: text('mode').notNull(), // 'buddy' | 'observer'
  permissions: text('permissions', { mode: 'json' }).$type<{ streak: boolean; status: boolean; journal: boolean }>().notNull(),
  status: text('status').notNull().default('pending'), // 'pending' | 'accepted' | 'rejected'
  buddyHabitId: integer('buddy_habit_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const notifications = sqliteTable('notifications', {
  id: integer('id').primaryKey(),
  userId: text('user_id').notNull(),
  type: text('type').notNull(), // 'share_invite' | 'reaction' | 'reminder'
  data: text('data', { mode: 'json' }).$type<any>().notNull(), // JSON data specific to the notification type
  read: integer('read', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const habitReactions = sqliteTable('habit_reactions', {
  id: integer('id').primaryKey(),
  habitId: integer('habit_id').notNull(),
  userId: text('user_id').notNull(),
  reaction: text('reaction').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const habitJournals = sqliteTable('habit_journals', {
  id: integer('id').primaryKey(),
  habitId: integer('habit_id').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  note: text('note').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
