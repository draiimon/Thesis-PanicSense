import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Use standard pg Pool instead of Neon serverless with WebSockets
// This avoids WebSocket connection timeout issues

// Force use the specific new database URL
// This is the new database connection string provided by the user
const databaseUrl = "postgresql://neondb_owner:npg_mKCjny10GxcW@ep-fancy-moon-a1b99crw-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

console.log(`Using direct PostgreSQL connection instead of WebSockets`);

// Create a standard pool with shorter timeouts
export const pool = new Pool({ 
  connectionString: databaseUrl,
  ssl: true, // Force SSL for Neon
  max: 5, // Limit max connections
  idleTimeoutMillis: 30000, // 30 seconds
  connectionTimeoutMillis: 5000 // 5 seconds timeout
});

console.log('Connecting to database with schema:', Object.keys(schema).join(', '));
export const db = drizzle(pool, { schema });
