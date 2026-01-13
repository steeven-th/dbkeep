import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from './schema'

const { Pool } = pg

// PostgreSQL connection pool configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

// Drizzle instance with schema
export const db = drizzle(pool, { schema })

// Export pool for Better Auth
export { pool }
