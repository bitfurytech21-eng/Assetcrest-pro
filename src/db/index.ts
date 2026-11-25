import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

const connectionString = process.env.DATABASE_URL?.trim() || '';
export const isDatabaseConfigured = Boolean(connectionString);

function shouldUseSsl(url: string): boolean {
  if (!url) return false;
  if (url.includes('sslmode=disable')) return false;
  if (url.includes('localhost') || url.includes('127.0.0.1')) return false;
  return true;
}

const createMockPool = () =>
  ({
    query: async () => ({ rows: [] }),
    connect: async () => ({
      query: async () => ({ rows: [] }),
      release: () => {},
    }),
    on: () => {},
  }) as unknown as Pool;

export const createPool = () => {
  if (!isDatabaseConfigured) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DATABASE_URL is required in production; refusing to start with an in-memory database.');
    }
    if (!global._postgresPool) {
      global._postgresPool = createMockPool();
    }
    return global._postgresPool;
  }

  if (!global._postgresPool) {
    try {
      global._postgresPool = new Pool({
        connectionString,
        ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : false,
        max: 10,
        connectionTimeoutMillis: 15000,
      });

      global._postgresPool.on('error', (err) => {
        console.error('Unexpected error on idle Neon PostgreSQL pool client:', err);
      });
    } catch (err) {
      if (process.env.NODE_ENV === 'production') {
        throw err;
      }
      console.warn('[AssetCrest] Neon pool initialization failed — using development fallback pool:', err);
      global._postgresPool = createMockPool();
    }
  }
  return global._postgresPool;
};

const pool = createPool();

let db: ReturnType<typeof drizzle<typeof schema>>;
try {
  if (!isDatabaseConfigured) {
    throw new Error('Neon DATABASE_URL not configured');
  }
  db = drizzle(pool, { schema });
} catch (err) {
  if (process.env.NODE_ENV === 'production') {
    throw err;
  }
  const noOp = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (d: any) => d?.data ?? {},
    update: async (d: any) => d?.data ?? {},
    delete: async () => ({}),
  };
  db = new Proxy({} as any, {
    get: (_, prop) =>
      prop === 'query'
        ? new Proxy({}, { get: () => noOp })
        : async () => [],
  });
}

export { db };
