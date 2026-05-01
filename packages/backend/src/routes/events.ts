import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { registerRealtimeClient } from '../realtime'

export const eventsRouter = Router()
eventsRouter.use(requireAuth)

eventsRouter.get('/', (req: Request, res: Response): void => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders?.()

  const send = (event: string) => {
    res.write(`event: ${event}\n`)
    res.write(`data: ${JSON.stringify({ ok: true })}\n\n`)
  }

  send('connected')
  const heartbeat = setInterval(() => {
    res.write(': keepalive\n\n')
  }, 25000)

  const unregister = registerRealtimeClient(send)
  req.on('close', () => {
    clearInterval(heartbeat)
    unregister()
    res.end()
  })
})
