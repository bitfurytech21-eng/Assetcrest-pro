import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: Pool | undefined;
}

export const isDatabaseConfigured = Boolean(
  process.env.DATABASE_URL || process.env.SQL_HOST
);

const createMockPool = () =>
  ({
    query: async () => ({ rows: [] }),
    connect: async () => ({
      query: async () => ({ rows: [] }),
      release: () => {},
    }),
    on: () => {},
  }) as unknown as Pool;

// Function to create or retrieve the connection pool.
export const createPool = () => {
  if (!isDatabaseConfigured) {
    if (!global._postgresPool) {
      console.warn('[AI Studio] Database not configured — using in-memory mock pool');
      global._postgresPool = createMockPool();
    }
    return global._postgresPool;
  }

  if (!global._postgresPool) {
    try {
      const config = process.env.DATABASE_URL
        ? { connectionString: process.env.DATABASE_URL, max: 10, connectionTimeoutMillis: 15000 }
        : {
            host: process.env.SQL_HOST || 'localhost',
            user: process.env.SQL_USER || 'postgres',
            password: process.env.SQL_PASSWORD || '',
            database: process.env.SQL_DB_NAME || 'postgres',
            max: 10,
            connectionTimeoutMillis: 15000,
          };

      global._postgresPool = new Pool(config);

      // Prevent unhandled pool-level errors from crashing the application
      global._postgresPool.on('error', (err) => {
        console.error('Unexpected error on idle SQL pool client:', err);
      });
    } catch (err) {
      console.warn('[AI Studio] Database pool initialization failed — using mock pool:', err);
      global._postgresPool = createMockPool();
    }
  }
  return global._postgresPool;
};

// Create or retrieve the pool instance.
const pool = createPool();

// Initialize Drizzle with the pool and schema, falling back to a no-op Proxy if offline.
let db: ReturnType<typeof drizzle<typeof schema>>;
try {
  if (!isDatabaseConfigured) {
    throw new Error('Database not configured');
  }
  db = drizzle(pool, { schema });
} catch {
  console.warn('[AI Studio] Database not connected — using mock Drizzle instance');
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

