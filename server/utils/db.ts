import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../database/schema';

export { sql, eq, and, or, desc } from 'drizzle-orm';

export const tables = schema;

const isDev = process.env.NODE_ENV === 'development';
const dbPath = isDev ? 'sqlite.db' : '/tmp/db.sqlite';

const sqlite = new Database(dbPath);
export function useDB() {
  return drizzle(sqlite, { schema });
}

export type Habit = typeof tables.habits.$inferSelect;
export type User = typeof tables.users.$inferSelect;
