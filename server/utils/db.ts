import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../database/schema';

export { sql, eq, and, or, desc } from 'drizzle-orm';

export const tables = schema;

const sqlite = new Database('sqlite.db');
export function useDB() {
  return drizzle(sqlite, { schema });
}

export type Habit = typeof tables.habits.$inferSelect;
export type User = typeof tables.users.$inferSelect;
