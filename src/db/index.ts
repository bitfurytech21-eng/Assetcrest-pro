import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  // Reuse one PostgreSQL pool across hot reloads in development.
  var _postgresPool: Pool | undefined;
}

const connectionString = process.env.DATABASE_URL?.trim() || '';
if (!connectionString) {
  throw new Error(
    '[AssetCrest] DATABASE_URL is required. Configure the Neon PostgreSQL connection string in the server environment; the application will not start with an in-memory database.'
  );
}

export const isDatabaseConfigured = true;

function shouldUseSsl(url: string): boolean {
  if (url.includes('sslmode=disable')) return false;
  if (url.includes('localhost') || url.includes('127.0.0.1')) return false;
  return true;
}

export const createPool = (): Pool => {
  if (!global._postgresPool) {
    const pool = new Pool({
      connectionString,
      ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: true } : false,
      max: 10,
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 30000,
    });

    pool.on('error', (err) => {
      console.error('[AssetCrest] Unexpected error on idle Neon PostgreSQL pool client:', err);
    });

    global._postgresPool = pool;
  }
  return global._postgresPool;
};

// Drizzle is always backed by the configured Neon PostgreSQL pool.
// Connection errors are allowed to propagate; there is deliberately no mock pool or no-op proxy.
const pool = createPool();
export const db = drizzle(pool, { schema });
