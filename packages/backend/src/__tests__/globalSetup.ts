import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'

export async function setup(): Promise<void> {
  const testPool = new Pool({
    connectionString: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@db_test:5432/kanban_test',
  })
  const sql = fs.readFileSync(
    path.join(__dirname, '..', 'migrations', '001_initial.sql'),
    'utf-8'
  )
  await testPool.query(sql)
  await testPool.end()
}

export async function teardown(): Promise<void> {}
