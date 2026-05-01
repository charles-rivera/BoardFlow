import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool } from '../db'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth'

export const authRouter = Router()

const COOKIE_NAME = 'token'
const cookieOpts = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

function signToken(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '7d' })
}

authRouter.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body
  if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
    res.status(400).json({ error: 'Email and password are required' }); return
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' }); return
  }
  const hash = await bcrypt.hash(password, 12)
  try {
    const { rows } = await pool.query<{ id: string; email: string }>(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email.toLowerCase().trim(), hash]
    )
    res.cookie(COOKIE_NAME, signToken(rows[0].id), cookieOpts)
    res.status(201).json({ user: rows[0] })
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '23505') {
      res.status(409).json({ error: 'Email already registered' }); return
    }
    throw err
  }
})

authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' }); return
  }
  const { rows } = await pool.query<{ id: string; email: string; password_hash: string }>(
    'SELECT id, email, password_hash FROM users WHERE email = $1',
    [email.toLowerCase().trim()]
  )
  if (!rows[0] || !(await bcrypt.compare(password, rows[0].password_hash))) {
    res.status(401).json({ error: 'Invalid credentials' }); return
  }
  res.cookie(COOKIE_NAME, signToken(rows[0].id), cookieOpts)
  res.json({ user: { id: rows[0].id, email: rows[0].email } })
})

authRouter.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: 'strict' })
  res.json({ ok: true })
})

authRouter.get('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { userId } = req as AuthenticatedRequest
  const { rows } = await pool.query<{ id: string; email: string }>(
    'SELECT id, email FROM users WHERE id = $1',
    [userId]
  )
  if (!rows[0]) { res.status(401).json({ error: 'Unauthorized' }); return }
  res.json({ user: rows[0] })
})
