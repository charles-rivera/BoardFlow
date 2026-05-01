import request from 'supertest'
import { app } from '../index'
import { pool } from '../db'

export async function clearDb(): Promise<void> {
  await pool.query('DELETE FROM cards')
  await pool.query('DELETE FROM lanes')
  await pool.query('DELETE FROM users')
}

export async function createUser(
  email = 'alice@example.com',
  password = 'password123'
): Promise<{ id: string; email: string }> {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password })
  if (res.status !== 201) throw new Error(`createUser failed: ${JSON.stringify(res.body)}`)
  return res.body.user
}

export async function loginUser(
  email = 'alice@example.com',
  password = 'password123'
): Promise<string> {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password })
  if (res.status !== 200) throw new Error(`loginUser failed: ${JSON.stringify(res.body)}`)
  const cookies: string[] = Array.isArray(res.headers['set-cookie'])
    ? res.headers['set-cookie']
    : [res.headers['set-cookie']]
  const tokenCookie = cookies.find((c) => c.startsWith('token='))
  if (!tokenCookie) throw new Error('token cookie not found')
  return tokenCookie.split(';')[0]
}
