import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../index'
import { clearDb, createUser, loginUser } from './helpers'

describe('Lanes', () => {
  let cookie: string
  let cookie2: string

  beforeEach(async () => {
    await clearDb()
    await createUser('alice@example.com')
    await createUser('bob@example.com')
    cookie = await loginUser('alice@example.com')
    cookie2 = await loginUser('bob@example.com')
  })

  describe('POST /api/lanes', () => {
    it('creates a lane with position 1 and returns 201', async () => {
      const res = await request(app)
        .post('/api/lanes').set('Cookie', cookie).send({ title: 'To Do' })
      expect(res.status).toBe(201)
      expect(res.body.lane.title).toBe('To Do')
      expect(res.body.lane.position).toBe(1)
      expect(res.body.lane.cards).toEqual([])
    })

    it('assigns sequential positions to subsequent lanes', async () => {
      await request(app).post('/api/lanes').set('Cookie', cookie).send({ title: 'Lane 1' })
      const res = await request(app).post('/api/lanes').set('Cookie', cookie).send({ title: 'Lane 2' })
      expect(res.body.lane.position).toBe(2)
    })

    it('returns 400 for empty title', async () => {
      const res = await request(app)
        .post('/api/lanes').set('Cookie', cookie).send({ title: '' })
      expect(res.status).toBe(400)
    })

    it('returns 401 without auth', async () => {
      const res = await request(app).post('/api/lanes').send({ title: 'Test' })
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/lanes', () => {
    it('returns only the authenticated user lanes with nested cards', async () => {
      await request(app).post('/api/lanes').set('Cookie', cookie).send({ title: 'Alice Lane' })
      await request(app).post('/api/lanes').set('Cookie', cookie2).send({ title: 'Bob Lane' })
      const res = await request(app).get('/api/lanes').set('Cookie', cookie)
      expect(res.status).toBe(200)
      expect(res.body.lanes).toHaveLength(1)
      expect(res.body.lanes[0].title).toBe('Alice Lane')
      expect(res.body.lanes[0].cards).toEqual([])
    })
  })

  describe('PATCH /api/lanes/:id', () => {
    it('renames a lane', async () => {
      const { body: { lane } } = await request(app)
        .post('/api/lanes').set('Cookie', cookie).send({ title: 'Old' })
      const res = await request(app)
        .patch(`/api/lanes/${lane.id}`).set('Cookie', cookie).send({ title: 'New' })
      expect(res.status).toBe(200)
      expect(res.body.lane.title).toBe('New')
    })

    it('returns 404 when trying to rename another user lane', async () => {
      const { body: { lane } } = await request(app)
        .post('/api/lanes').set('Cookie', cookie2).send({ title: "Bob's Lane" })
      const res = await request(app)
        .patch(`/api/lanes/${lane.id}`).set('Cookie', cookie).send({ title: 'Hijacked' })
      expect(res.status).toBe(404)
    })
  })

  describe('PATCH /api/lanes/:id/reorder', () => {
    it('updates lane position', async () => {
      const { body: { lane } } = await request(app)
        .post('/api/lanes').set('Cookie', cookie).send({ title: 'Lane' })
      const res = await request(app)
        .patch(`/api/lanes/${lane.id}/reorder`).set('Cookie', cookie).send({ position: 1.5 })
      expect(res.status).toBe(200)
      expect(res.body.ok).toBe(true)
    })

    it('renormalizes positions when gap falls below 0.001', async () => {
      const { body: { lane: l1 } } = await request(app)
        .post('/api/lanes').set('Cookie', cookie).send({ title: 'A' })
      await request(app).post('/api/lanes').set('Cookie', cookie).send({ title: 'B' })
      await request(app)
        .patch(`/api/lanes/${l1.id}/reorder`).set('Cookie', cookie).send({ position: 2.0000001 })
      const { body: { lanes } } = await request(app).get('/api/lanes').set('Cookie', cookie)
      for (let i = 1; i < lanes.length; i++) {
        expect(lanes[i].position - lanes[i - 1].position).toBeGreaterThanOrEqual(0.001)
      }
    })
  })

  describe('DELETE /api/lanes/:id', () => {
    it('soft-deletes the lane', async () => {
      const { body: { lane } } = await request(app)
        .post('/api/lanes').set('Cookie', cookie).send({ title: 'To Do' })
      const res = await request(app).delete(`/api/lanes/${lane.id}`).set('Cookie', cookie)
      expect(res.status).toBe(200)
      const { body } = await request(app).get('/api/lanes').set('Cookie', cookie)
      expect(body.lanes).toHaveLength(0)
    })

    it('soft-deletes all cards in the lane', async () => {
      const { body: { lane } } = await request(app)
        .post('/api/lanes').set('Cookie', cookie).send({ title: 'To Do' })
      await request(app).post('/api/cards').set('Cookie', cookie).send({ lane_id: lane.id, title: 'Card 1' })
      await request(app).post('/api/cards').set('Cookie', cookie).send({ lane_id: lane.id, title: 'Card 2' })
      await request(app).delete(`/api/lanes/${lane.id}`).set('Cookie', cookie)
      const { pool } = await import('../db')
      const { rows } = await pool.query(
        'SELECT id FROM cards WHERE lane_id = $1 AND deleted_at IS NOT NULL',
        [lane.id]
      )
      expect(rows).toHaveLength(2)
    })

    it('returns 404 when deleting another user lane', async () => {
      const { body: { lane } } = await request(app)
        .post('/api/lanes').set('Cookie', cookie2).send({ title: "Bob" })
      const res = await request(app).delete(`/api/lanes/${lane.id}`).set('Cookie', cookie)
      expect(res.status).toBe(404)
    })
  })
})
