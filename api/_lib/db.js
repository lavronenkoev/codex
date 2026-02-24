import { Pool } from 'pg';

let pool;

export function getDb() {
  if (!pool) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing');
    pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

export async function q(text, params = []) {
  const db = getDb();
  return db.query(text, params);
}
