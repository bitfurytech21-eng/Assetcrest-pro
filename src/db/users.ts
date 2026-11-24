import { eq } from 'drizzle-orm';
import { db, isDatabaseConfigured } from './index.ts';
import { users } from './schema.ts';

export async function getUserById(userId: string) {
  if (!isDatabaseConfigured) return null;
  try {
    const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return rows[0] || null;
  } catch (error) {
    console.error('Failed to query user by id:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function getUsers() {
  if (!isDatabaseConfigured) return [];
  try {
    return await db.select().from(users);
  } catch (error) {
    console.error('Failed to list users:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}
