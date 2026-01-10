import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from './schema'

const { Pool } = pg

// Configuration du pool de connexions PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

// Instance Drizzle avec le schéma
export const db = drizzle(pool, { schema })

// Export du pool pour Better Auth
export { pool }
