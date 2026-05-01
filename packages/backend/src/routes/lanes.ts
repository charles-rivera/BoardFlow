import { Router, Request, Response } from 'express'
import { pool } from '../db'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth'
import { publishBoardChanged } from '../realtime'

export const lanesRouter = Router()
lanesRouter.use(requireAuth)

const RENORM_GAP = 0.001

lanesRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const { rows: lanes } = await pool.query(
    'SELECT id, title, position, created_at FROM lanes WHERE deleted_at IS NULL ORDER BY position ASC'
  )
  const { rows: cards } = await pool.query(
    'SELECT id, lane_id, title, description, position, created_at, updated_at FROM cards WHERE deleted_at IS NULL ORDER BY position ASC'
  )
  const cardsByLane = new Map<string, typeof cards>()
  for (const c of cards) {
    const list = cardsByLane.get(c.lane_id) ?? []
    list.push(c)
    cardsByLane.set(c.lane_id, list)
  }
  res.json({ lanes: lanes.map(l => ({ ...l, cards: cardsByLane.get(l.id) ?? [] })) })
})

lanesRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  const { userId } = req as AuthenticatedRequest
  const { title } = req.body
  if (!title || typeof title !== 'string' || !title.trim()) {
    res.status(400).json({ error: 'Title is required' }); return
  }
  const { rows: [{ max }] } = await pool.query<{ max: number | null }>(
    'SELECT MAX(position) AS max FROM lanes WHERE deleted_at IS NULL'
  )
  const { rows: [lane] } = await pool.query(
    'INSERT INTO lanes (user_id, title, position) VALUES ($1, $2, $3) RETURNING id, title, position, created_at',
    [userId, title.trim(), (max ?? 0) + 1]
  )
  publishBoardChanged()
  res.status(201).json({ lane: { ...lane, cards: [] } })
})

lanesRouter.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  const { title } = req.body
  if (!title || typeof title !== 'string' || !title.trim()) {
    res.status(400).json({ error: 'Title is required' }); return
  }
  const { rows, rowCount } = await pool.query(
    'UPDATE lanes SET title = $1 WHERE id = $2 AND deleted_at IS NULL RETURNING id, title, position, created_at',
    [title.trim(), req.params.id]
  )
  if (!rowCount) { res.status(404).json({ error: 'Lane not found' }); return }
  publishBoardChanged()
  res.json({ lane: rows[0] })
})

lanesRouter.patch('/:id/reorder', async (req: Request, res: Response): Promise<void> => {
  const { position } = req.body
  if (typeof position !== 'number' || !isFinite(position)) {
    res.status(400).json({ error: 'position must be a finite number' }); return
  }
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rowCount } = await client.query(
      'UPDATE lanes SET position = $1 WHERE id = $2 AND deleted_at IS NULL',
      [position, req.params.id]
    )
    if (!rowCount) {
      await client.query('ROLLBACK')
      res.status(404).json({ error: 'Lane not found' }); return
    }
    const { rows: all } = await client.query<{ id: string; position: number }>(
      'SELECT id, position FROM lanes WHERE deleted_at IS NULL ORDER BY position ASC'
    )
    const needsRenorm = all.some((r, i) => i > 0 && r.position - all[i - 1].position < RENORM_GAP)
    if (needsRenorm) {
      for (let i = 0; i < all.length; i++) {
        await client.query('UPDATE lanes SET position = $1 WHERE id = $2', [i + 1, all[i].id])
      }
    }
    await client.query('COMMIT')
    publishBoardChanged()
    res.json({ ok: true })
  } catch (err) {
    await client.query('ROLLBACK'); throw err
  } finally {
    client.release()
  }
})

lanesRouter.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rowCount } = await client.query(
      'UPDATE lanes SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id',
      [req.params.id]
    )
    if (!rowCount) {
      await client.query('ROLLBACK')
      res.status(404).json({ error: 'Lane not found' }); return
    }
    await client.query(
      'UPDATE cards SET deleted_at = NOW() WHERE lane_id = $1 AND deleted_at IS NULL',
      [req.params.id]
    )
    await client.query('COMMIT')
    publishBoardChanged()
    res.json({ ok: true })
  } catch (err) {
    await client.query('ROLLBACK'); throw err
  } finally {
    client.release()
  }
})
