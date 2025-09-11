import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure connection pool options for PostgreSQL
const connectionOptions = {
  connectionString: process.env.DATABASE_URL,
  // Connection pool settings
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10
};

export const pool = new Pool(connectionOptions);
export const db = drizzle({ client: pool, schema });