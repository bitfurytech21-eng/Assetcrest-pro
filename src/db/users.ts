import { eq } from 'drizzle-orm';
import { db, isDatabaseConfigured } from './index.ts';
import { users } from './schema.ts';

interface MockUser {
  id: number;
  uid: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  createdAt: Date;
}

const mockUsers = new Map<string, MockUser>();
let mockIdCounter = 1;

export async function getOrCreateUser(uid: string, email: string, name?: string) {
  if (!isDatabaseConfigured) {
    const existing = mockUsers.get(uid);
    if (existing) {
      existing.email = email;
      if (name) existing.name = name;
      return existing;
    }
    const created: MockUser = {
      id: mockIdCounter++,
      uid,
      email,
      name: name || null,
      role: 'user',
      status: 'active',
      createdAt: new Date(),
    };
    mockUsers.set(uid, created);
    return created;
  }

  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
        name: name || null,
        role: 'user',
        status: 'active',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(name ? { name } : {}),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Failed to get or create user:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  if (!isDatabaseConfigured) {
    return mockUsers.get(uid) || null;
  }

  try {
    const result = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("Failed to get user by uid:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

export async function getUsers() {
  if (!isDatabaseConfigured) {
    return Array.from(mockUsers.values());
  }

  try {
    return await db.select().from(users);
  } catch (error) {
    console.error("Database query failed:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}
