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

export const userBadges = sqliteTable('user_badges', {
  id: integer('id').primaryKey(),
  userId: text('user_id').notNull(),
  badgeId: text('badge_id').notNull(), // References badge ID from shared/badges.ts
  earnedAt: integer('earned_at', { mode: 'timestamp' }).notNull(),
  // Optional: Store context of how badge was earned
  context: text('context', { mode: 'json' }).$type<{ habitId?: number; streak?: number; count?: number }>(),
});

// Push notification subscriptions
export const pushSubscriptions = sqliteTable('push_subscriptions', {
  id: integer('id').primaryKey(),
  userId: text('user_id').notNull(),
  endpoint: text('endpoint').notNull().unique(),
  keys: text('keys', { mode: 'json' }).$type<{ p256dh: string; auth: string }>().notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// User notification settings
export const userSettings = sqliteTable('user_settings', {
  id: integer('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  // Calendar settings
  calendarToken: text('calendar_token'), // Unique token for calendar URL
  // Push notification settings
  pushEnabled: integer('push_enabled', { mode: 'boolean' }).notNull().default(false),
  reminderTime: text('reminder_time').default('09:00'), // HH:MM format
  eveningNudge: integer('evening_nudge', { mode: 'boolean' }).notNull().default(true),
  eveningNudgeTime: text('evening_nudge_time').default('20:00'),
  buddyAlerts: integer('buddy_alerts', { mode: 'boolean' }).notNull().default(true),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
