import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import type { IncomingMessage } from 'http'
import { app } from '../index'
import { clearDb, createUser, loginUser } from './helpers'

describe('Realtime events', () => {
  let cookie: string

  beforeEach(async () => {
    await clearDb()
    await createUser()
    cookie = await loginUser()
  })

  it('requires authentication', async () => {
    const res = await request(app).get('/api/events')
    expect(res.status).toBe(401)
  })

  it('opens an SSE stream for authenticated users', async () => {
    const res = await request(app)
      .get('/api/events')
      .set('Cookie', cookie)
      .buffer(true)
      .parse((stream, callback) => {
        let body = ''
        const responseStream = stream as unknown as IncomingMessage
        responseStream.on('data', (chunk) => {
          body += chunk.toString()
          if (body.includes('event: connected')) {
            callback(null, body)
            responseStream.destroy()
          }
        })
      })

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('text/event-stream')
    expect(String(res.body)).toContain('event: connected')
  })
})
