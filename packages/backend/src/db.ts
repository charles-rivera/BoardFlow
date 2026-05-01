import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

function getMigrationSql(): string[] {
  const migrationsDir = path.join(__dirname, 'migrations')
  return fs.readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .map((file) => fs.readFileSync(path.join(migrationsDir, file), 'utf-8'))
}

export async function runMigrations(): Promise<void> {
  for (const sql of getMigrationSql()) {
    await pool.query(sql)
  }
}
