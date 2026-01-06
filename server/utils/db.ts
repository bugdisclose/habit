import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../database/schema';

export { sql, eq, and, or, desc } from 'drizzle-orm';

export const tables = schema;

let _db: ReturnType<typeof drizzle> | null = null;
let _sqliteSession: Database.Database | null = null;

export function useDB() {
  if (_db) return _db;

  try {
    const isDev = process.env.NODE_ENV === 'development';
    const dbPath = isDev ? 'sqlite.db' : '/tmp/db.sqlite';

    if (!_sqliteSession) {
      console.log(`[db] Initializing database at ${dbPath}`);
      _sqliteSession = new Database(dbPath); // Lazy open
      // Enable foreign key constraints for data integrity
      _sqliteSession.pragma('foreign_keys = ON');
    }

    const sqlite = _sqliteSession;
    const db = drizzle(sqlite, { schema });

    // Auto-migrate in production (Vercel)
    if (!isDev) {
      const tableCheck = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
      if (!tableCheck) {
        console.log('[db] Empty database detected. Running migrations...');
        sqlite.exec(`
          CREATE TABLE IF NOT EXISTS habits (
            id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            user_id text NOT NULL,
            title text NOT NULL,
            description text,
            frequency text DEFAULT 'daily',
            created_at integer,
            complete_days text DEFAULT '[]',
            habit_view integer DEFAULT 0,
            reminder_time text,
            reminder_enabled integer DEFAULT 0,
            reminder_days text DEFAULT '[]'
          );
          CREATE TABLE IF NOT EXISTS users (
            id text PRIMARY KEY NOT NULL,
            login text NOT NULL,
            name text,
            avatar_url text,
            bio text,
            created_at integer,
            user_view integer DEFAULT 0
          );
           CREATE TABLE IF NOT EXISTS habit_journals (
            id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            habit_id integer NOT NULL,
            date text NOT NULL,
            note text,
            created_at integer,
            FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
          );
          CREATE TABLE IF NOT EXISTS habit_shares (
            id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            habit_id integer NOT NULL,
            user_id text NOT NULL,
            shared_with_id text NOT NULL,
            mode text NOT NULL,
            permissions text NOT NULL,
            status text DEFAULT 'pending',
            buddy_habit_id integer,
            created_at integer
          );
          CREATE TABLE IF NOT EXISTS notifications (
            id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            user_id text NOT NULL,
            type text NOT NULL,
            data text NOT NULL,
            read integer DEFAULT 0,
            created_at integer
          );
          CREATE TABLE IF NOT EXISTS habit_reactions (
            id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            habit_id integer NOT NULL,
            user_id text NOT NULL,
            reaction text NOT NULL,
            created_at integer
          );
          CREATE TABLE IF NOT EXISTS user_badges (
            id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            user_id text NOT NULL,
            badge_id text NOT NULL,
            earned_at integer NOT NULL,
            context text
          );
          CREATE TABLE IF NOT EXISTS push_subscriptions (
            id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            user_id text NOT NULL,
            endpoint text NOT NULL UNIQUE,
            keys text NOT NULL,
            created_at integer NOT NULL
          );
          CREATE TABLE IF NOT EXISTS user_settings (
            id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            user_id text NOT NULL UNIQUE,
            calendar_token text,
            push_enabled integer NOT NULL DEFAULT 0,
            reminder_time text DEFAULT '09:00',
            evening_nudge integer NOT NULL DEFAULT 1,
            evening_nudge_time text DEFAULT '20:00',
            buddy_alerts integer NOT NULL DEFAULT 1,
            updated_at integer NOT NULL
          );
          CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
          CREATE INDEX IF NOT EXISTS idx_user_settings_token ON user_settings(calendar_token);
        `);
        console.log('[db] Schema initialized successfully.');
      } else {
        // Apply missing tables for existing databases
        try {
          sqlite.exec(`
            CREATE TABLE IF NOT EXISTS push_subscriptions (
              id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
              user_id text NOT NULL,
              endpoint text NOT NULL UNIQUE,
              keys text NOT NULL,
              created_at integer NOT NULL
            );
            CREATE TABLE IF NOT EXISTS user_settings (
              id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
              user_id text NOT NULL UNIQUE,
              calendar_token text,
              push_enabled integer NOT NULL DEFAULT 0,
              reminder_time text DEFAULT '09:00',
              evening_nudge integer NOT NULL DEFAULT 1,
              evening_nudge_time text DEFAULT '20:00',
              buddy_alerts integer NOT NULL DEFAULT 1,
              updated_at integer NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
            CREATE INDEX IF NOT EXISTS idx_user_settings_token ON user_settings(calendar_token);
          `);
          console.log('[db] Applied migration: push_subscriptions and user_settings tables.');
        } catch (e) {
          // Tables might already exist
        }
        // Hotfix for existing tables: check if user_view column exists
        try {
          sqlite.exec("ALTER TABLE users ADD COLUMN user_view integer DEFAULT 0");
          console.log('[db] Applied hotfix: Added user_view column.');
        } catch (e) {
          // Ignore: column exists
        }
      }
    }

    _db = db;
    return _db;

  } catch (error: any) {
    console.error('[db] Initialization Failed:', error);
    // Throwing here allows the API handler to catch it (if wrapped) or 500 with stack
    throw createError({
      statusCode: 500,
      statusMessage: `Database Error: ${error.message}`
    });
  }
}

export type Habit = typeof tables.habits.$inferSelect;
export type User = typeof tables.users.$inferSelect;
