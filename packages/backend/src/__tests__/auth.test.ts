import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../index'
import { clearDb, createUser, loginUser } from './helpers'

describe('Auth', () => {
  beforeEach(async () => { await clearDb() })

  describe('POST /api/auth/register', () => {
    it('creates a user and returns 201', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'alice@example.com', password: 'password123' })
      expect(res.status).toBe(201)
      expect(res.body.user.email).toBe('alice@example.com')
      expect(res.body.user.id).toMatch(/^[0-9a-f-]{36}$/)
    })

    it('sets httpOnly cookie on register', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'alice@example.com', password: 'password123' })
      const cookies: string[] = Array.isArray(res.headers['set-cookie'])
        ? res.headers['set-cookie']
        : [res.headers['set-cookie']]
      const tokenCookie = cookies.find((c) => c.startsWith('token='))
      expect(tokenCookie).toBeDefined()
      expect(tokenCookie).toMatch(/HttpOnly/i)
    })

    it('returns 409 on duplicate email', async () => {
      await createUser('alice@example.com')
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'alice@example.com', password: 'other123' })
      expect(res.status).toBe(409)
      expect(res.body.error).toBe('Email already registered')
    })

    it('returns 409 regardless of email casing', async () => {
      await createUser('alice@example.com')
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'ALICE@EXAMPLE.COM', password: 'password123' })
      expect(res.status).toBe(409)
    })

    it('returns 400 when email missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ password: 'password123' })
      expect(res.status).toBe(400)
    })

    it('returns 400 when password too short', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'alice@example.com', password: 'short' })
      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/auth/login', () => {
    it('sets httpOnly cookie on success', async () => {
      await createUser()
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'alice@example.com', password: 'password123' })
      expect(res.status).toBe(200)
      const cookies: string[] = Array.isArray(res.headers['set-cookie'])
        ? res.headers['set-cookie']
        : [res.headers['set-cookie']]
      const tokenCookie = cookies.find((c) => c.startsWith('token='))
      expect(tokenCookie).toMatch(/HttpOnly/i)
    })

    it('returns 401 on wrong password', async () => {
      await createUser()
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'alice@example.com', password: 'wrongpass' })
      expect(res.status).toBe(401)
      expect(res.body.error).toBe('Invalid credentials')
    })

    it('returns 401 for unknown email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'password123' })
      expect(res.status).toBe(401)
    })

    it('is case-insensitive for email', async () => {
      await createUser()
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ALICE@EXAMPLE.COM', password: 'password123' })
      expect(res.status).toBe(200)
    })
  })

  describe('POST /api/auth/logout', () => {
    it('clears the token cookie', async () => {
      await createUser()
      const cookie = await loginUser()
      const res = await request(app).post('/api/auth/logout').set('Cookie', cookie)
      expect(res.status).toBe(200)
      const cookies: string[] = Array.isArray(res.headers['set-cookie'])
        ? res.headers['set-cookie']
        : [res.headers['set-cookie']]
      const tokenCookie = cookies.find((c) => c.startsWith('token='))
      expect(tokenCookie).toMatch(/token=;|Max-Age=0/i)
    })
  })

  describe('GET /api/auth/me', () => {
    it('returns user when authenticated', async () => {
      await createUser()
      const cookie = await loginUser()
      const res = await request(app).get('/api/auth/me').set('Cookie', cookie)
      expect(res.status).toBe(200)
      expect(res.body.user.email).toBe('alice@example.com')
    })

    it('returns null without cookie', async () => {
      const res = await request(app).get('/api/auth/me')
      expect(res.status).toBe(200)
      expect(res.body.user).toBeNull()
    })

    it('returns null with tampered token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', 'token=this.is.not.valid')
      expect(res.status).toBe(200)
      expect(res.body.user).toBeNull()
    })
  })
})
