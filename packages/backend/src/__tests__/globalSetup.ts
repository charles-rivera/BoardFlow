import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'

export async function setup(): Promise<void> {
  const testPool = new Pool({
    connectionString: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@db_test:5432/kanban_test',
  })
  const migrationsDir = path.join(__dirname, '..', 'migrations')
  const files = fs.readdirSync(migrationsDir).filter((file) => file.endsWith('.sql')).sort()
  for (const file of files) {
    await testPool.query(fs.readFileSync(path.join(migrationsDir, file), 'utf-8'))
  }
  await testPool.end()
}

export async function teardown(): Promise<void> {}
