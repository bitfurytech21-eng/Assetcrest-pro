import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env first, then .env.local if present (without overriding explicit runtime env vars)
const rootDir = process.cwd();
const envPath = path.resolve(rootDir, '.env');
const envLocalPath = path.resolve(rootDir, '.env.local');

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath, override: false });
}
