import { Pool } from 'pg'

const supabasePassword = process.env.SUPABASE_PASSWORD

if (!supabasePassword) {
  throw new Error('Missing SUPABASE_PASSWORD environment variable')
}

// Create PostgreSQL connection pool (singleton pattern for serverless)
let dbPool: Pool | null = null

function getDb(): Pool {
  if (!dbPool) {
    dbPool = new Pool({
      connectionString: `postgresql://postgres:${supabasePassword}@db.urlowlbvagysiyvtedev.supabase.co:5432/postgres`,
      ssl: {
        rejectUnauthorized: false
      },
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
    })

    // Handle pool errors
    dbPool.on('error', (err) => {
      console.error('❌ [Supabase] Unexpected error on idle client', err)
    })
  }
  return dbPool
}

export const db = getDb()

