import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  // Reuse one PostgreSQL pool across hot reloads in development.
  var _postgresPool: Pool | undefined;
}

const connectionString = process.env.DATABASE_URL?.trim() || '';
export let isDatabaseConfigured = Boolean(connectionString);

export function disableDatabaseFallback(): void {
  isDatabaseConfigured = false;
}

function shouldUseSsl(url: string): boolean {
  if (url.includes('sslmode=disable')) return false;
  if (url.includes('localhost') || url.includes('127.0.0.1')) return false;
  return true;
}

export const createPool = (): Pool => {
  if (!connectionString) {
    throw new Error('[AssetCrest] DATABASE_URL is not configured; using in-memory store.');
  }
  if (!global._postgresPool) {
    const pool = new Pool({
      connectionString,
      ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: true } : false,
      max: 10,
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 30000,
    });

    pool.on('error', (err) => {
      console.error('[AssetCrest] Unexpected error on idle PostgreSQL pool client:', err);
    });

    global._postgresPool = pool;
  }
  return global._postgresPool;
};

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

let dbInstance: DrizzleDb | null = null;
try {
  if (connectionString) {
    dbInstance = drizzle(createPool(), { schema });
  } else {
    console.warn('[AssetCrest] DATABASE_URL not set — running with built-in in-memory store.');
  }
} catch (err) {
  console.warn('[AssetCrest] Failed to initialize PostgreSQL pool — falling back to in-memory store.', err);
  isDatabaseConfigured = false;
}

const noOpChain: any = new Proxy(async () => [], {
  get: (_t, prop) => {
    if (prop === 'then') return undefined;
    return () => noOpChain;
  },
});

export const db: DrizzleDb =
  dbInstance ??
  (new Proxy({} as DrizzleDb, {
    get: () => () => noOpChain,
  }) as DrizzleDb);
