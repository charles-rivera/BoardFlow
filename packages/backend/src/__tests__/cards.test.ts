import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../index'
import { pool } from '../db'
import { clearDb, createUser, loginUser } from './helpers'

describe('Cards', () => {
  let cookie: string
  let cookie2: string
  let laneId: string
  let lane2Id: string

  beforeEach(async () => {
    await clearDb()
    await createUser()
    await createUser('bob@example.com')
    cookie = await loginUser()
    cookie2 = await loginUser('bob@example.com')
    const r1 = await request(app).post('/api/lanes').set('Cookie', cookie).send({ title: 'To Do' })
    laneId = r1.body.lane.id
    const r2 = await request(app).post('/api/lanes').set('Cookie', cookie).send({ title: 'Done' })
    lane2Id = r2.body.lane.id
  })

  describe('POST /api/cards', () => {
    it('creates a card with encrypted database content and position 1', async () => {
      const res = await request(app)
        .post('/api/cards').set('Cookie', cookie).send({ lane_id: laneId, title: 'My Card', description: 'Secret body' })
      expect(res.status).toBe(201)
      expect(res.body.card.title).toBe('My Card')
      expect(res.body.card.position).toBe(1)
      expect(res.body.card.lane_id).toBe(laneId)
      expect(res.body.card.description).toBe('Secret body')

      const { rows } = await pool.query<{ title: string; description: string }>(
        'SELECT title, description FROM cards WHERE id = $1',
        [res.body.card.id]
      )
      expect(rows[0].title).not.toBe('My Card')
      expect(rows[0].description).not.toBe('Secret body')
      expect(rows[0].title).toMatch(/^v1\./)
      expect(rows[0].description).toMatch(/^v1\./)
    })

    it('assigns sequential positions within a lane', async () => {
      await request(app).post('/api/cards').set('Cookie', cookie).send({ lane_id: laneId, title: 'Card 1' })
      const res = await request(app).post('/api/cards').set('Cookie', cookie).send({ lane_id: laneId, title: 'Card 2' })
      expect(res.body.card.position).toBe(2)
    })

    it('returns 400 for empty title', async () => {
      const res = await request(app)
        .post('/api/cards').set('Cookie', cookie).send({ lane_id: laneId, title: '' })
      expect(res.status).toBe(400)
    })

    it('stores SQL injection attempt safely (parameterized queries)', async () => {
      const evil = "'; DROP TABLE cards; --"
      const res = await request(app)
        .post('/api/cards').set('Cookie', cookie).send({ lane_id: laneId, title: evil })
      expect(res.status).toBe(201)
      expect(res.body.card.title).toBe(evil)
      const { body } = await request(app).get('/api/lanes').set('Cookie', cookie)
      expect(body.lanes[0].cards).toHaveLength(1)
    })
  })

  describe('GET /api/cards', () => {
    it('lists all cards in the board', async () => {
      await request(app).post('/api/cards').set('Cookie', cookie).send({ lane_id: laneId, title: 'Card 1' })
      await request(app).post('/api/cards').set('Cookie', cookie).send({ lane_id: lane2Id, title: 'Card 2' })

      const res = await request(app).get('/api/cards').set('Cookie', cookie2)

      expect(res.status).toBe(200)
      expect(res.body.cards).toHaveLength(2)
    })
  })

  describe('GET /api/cards/:id', () => {
    it('returns a single card', async () => {
      const { body: { card } } = await request(app)
        .post('/api/cards').set('Cookie', cookie).send({ lane_id: laneId, title: 'Lookup' })

      const res = await request(app).get(`/api/cards/${card.id}`).set('Cookie', cookie2)

      expect(res.status).toBe(200)
      expect(res.body.card.id).toBe(card.id)
      expect(res.body.card.title).toBe('Lookup')
    })
  })

  describe('PATCH /api/cards/:id', () => {
    it('moves a card to a different lane', async () => {
      const { body: { card } } = await request(app)
        .post('/api/cards').set('Cookie', cookie).send({ lane_id: laneId, title: 'Move me' })
      const res = await request(app)
        .patch(`/api/cards/${card.id}`).set('Cookie', cookie).send({ lane_id: lane2Id, position: 1 })
      expect(res.status).toBe(200)
      expect(res.body.card.lane_id).toBe(lane2Id)
    })

    it('stores a midpoint position (1.5 between cards at 1 and 2)', async () => {
      const { body: { card: c1 } } = await request(app)
        .post('/api/cards').set('Cookie', cookie).send({ lane_id: laneId, title: 'A' })
      const { body: { card: c2 } } = await request(app)
        .post('/api/cards').set('Cookie', cookie).send({ lane_id: laneId, title: 'C' })
      const { body: { card: c3 } } = await request(app)
        .post('/api/cards').set('Cookie', cookie).send({ lane_id: laneId, title: 'B' })
      const midpoint = (c1.position + c2.position) / 2
      expect(midpoint).toBe(1.5)
      const res = await request(app)
        .patch(`/api/cards/${c3.id}`).set('Cookie', cookie).send({ position: midpoint })
      expect(res.status).toBe(200)
      expect(res.body.card.position).toBe(1.5)
    })

    it('updates title only without moving', async () => {
      const { body: { card } } = await request(app)
        .post('/api/cards').set('Cookie', cookie).send({ lane_id: laneId, title: 'Original' })
      const res = await request(app)
        .patch(`/api/cards/${card.id}`).set('Cookie', cookie).send({ title: 'Updated' })
      expect(res.status).toBe(200)
      expect(res.body.card.title).toBe('Updated')
      expect(res.body.card.lane_id).toBe(laneId)
    })

    it('allows another user to edit a shared card', async () => {
      const { body: { card } } = await request(app)
        .post('/api/cards').set('Cookie', cookie).send({ lane_id: laneId, title: 'Shared' })
      const res = await request(app)
        .patch(`/api/cards/${card.id}`).set('Cookie', cookie2).send({ title: 'Edited by Bob' })
      expect(res.status).toBe(200)
      expect(res.body.card.title).toBe('Edited by Bob')
    })

    it('returns 400 when no updatable fields are provided', async () => {
      const { body: { card } } = await request(app)
        .post('/api/cards').set('Cookie', cookie).send({ lane_id: laneId, title: 'Shared' })

      const res = await request(app)
        .patch(`/api/cards/${card.id}`).set('Cookie', cookie).send({})

      expect(res.status).toBe(400)
    })
  })

  describe('DELETE /api/cards/:id', () => {
    it('soft-deletes a card', async () => {
      const { body: { card } } = await request(app)
        .post('/api/cards').set('Cookie', cookie).send({ lane_id: laneId, title: 'Delete me' })
      const res = await request(app).delete(`/api/cards/${card.id}`).set('Cookie', cookie)
      expect(res.status).toBe(200)
      const { body } = await request(app).get('/api/lanes').set('Cookie', cookie)
      expect(body.lanes[0].cards).toHaveLength(0)
    })

    it('returns 404 on double-delete', async () => {
      const { body: { card } } = await request(app)
        .post('/api/cards').set('Cookie', cookie).send({ lane_id: laneId, title: 'Card' })
      await request(app).delete(`/api/cards/${card.id}`).set('Cookie', cookie)
      const res = await request(app).delete(`/api/cards/${card.id}`).set('Cookie', cookie)
      expect(res.status).toBe(404)
    })

    it('shows shared cards to a second user', async () => {
      await request(app).post('/api/cards').set('Cookie', cookie).send({ lane_id: laneId, title: 'Visible to all' })
      const res = await request(app).get('/api/lanes').set('Cookie', cookie2)
      expect(res.status).toBe(200)
      expect(res.body.lanes[0].cards[0].title).toBe('Visible to all')
    })
  })
})
