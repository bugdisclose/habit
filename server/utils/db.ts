import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../database/schema';

export { sql, eq, and, or, desc } from 'drizzle-orm';

export const tables = schema;

const isDev = process.env.NODE_ENV === 'development';
const dbPath = isDev ? 'sqlite.db' : '/tmp/db.sqlite';

const sqlite = new Database(dbPath);
export function useDB() {
  const db = drizzle(sqlite, { schema });

  // Auto-migrate in production (Vercel)
  if (!isDev) {
    const tableCheck = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
    if (!tableCheck) {
      console.log('Initialize DB: Running migrations...');
      // We rely on the fact that we bundled migrations as server assets
      // But for simplicity in this synchronous context, we can try to assume 
      // specific CREATE TABLE statements if we want to be 100% sure,
      // OR we can rely on standard sql execution if we can read the files.
      // 
      // Since `useStorage` is async and `useDB` is synchronous/cached, 
      // we'll run a minimal schema init if tables are missing.
      // 
      // However, reading 4 SQL files synchronously from assets is hard.
      // Let's use the Drizzle Migrator if we can resolve the path.
      // 
      // FALLBACK: Execute the schema directly for the critical 'users' table 
      // and others to unblock login.

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
        `);
      console.log('[db] Schema initialized successfully.');
    }

    // Hotfix for existing tables in warm containers
    try {
      sqlite.exec("ALTER TABLE users ADD COLUMN user_view integer DEFAULT 0");
      console.log('[db] Applied hotfix: Added user_view column.');
    } catch (e) {
      // Ignore error if column already exists
    }
    console.log('Initialize DB: Schema applied.');
  }
}

return db;
}

export type Habit = typeof tables.habits.$inferSelect;
export type User = typeof tables.users.$inferSelect;
