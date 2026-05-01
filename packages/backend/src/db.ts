import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function runMigrations(): Promise<void> {
  const sql = fs.readFileSync(
    path.join(__dirname, 'migrations', '001_initial.sql'),
    'utf-8'
  )
  await pool.query(sql)
}
