import { Router, Request, Response } from 'express'
import { pool } from '../db'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth'

export const cardsRouter = Router()
cardsRouter.use(requireAuth)

const RENORM_GAP = 0.001

cardsRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  const { userId } = req as AuthenticatedRequest
  const { lane_id, title, description } = req.body
  if (!title || typeof title !== 'string' || !title.trim()) {
    res.status(400).json({ error: 'Title is required' }); return
  }
  if (!lane_id) { res.status(400).json({ error: 'lane_id is required' }); return }
  const { rowCount: laneExists } = await pool.query(
    'SELECT id FROM lanes WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
    [lane_id, userId]
  )
  if (!laneExists) { res.status(404).json({ error: 'Lane not found' }); return }
  const { rows: [{ max }] } = await pool.query<{ max: number | null }>(
    'SELECT MAX(position) AS max FROM cards WHERE lane_id = $1 AND deleted_at IS NULL',
    [lane_id]
  )
  const { rows: [card] } = await pool.query(
    'INSERT INTO cards (lane_id, user_id, title, description, position) VALUES ($1, $2, $3, $4, $5) RETURNING id, lane_id, title, description, position, created_at, updated_at',
    [lane_id, userId, title.trim(), (description ?? '').toString().trim(), (max ?? 0) + 1]
  )
  res.status(201).json({ card })
})

cardsRouter.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  const { userId } = req as AuthenticatedRequest
  const { title, description, lane_id, position } = req.body
  const setClauses = ['updated_at = NOW()']
  const values: unknown[] = []
  let idx = 1
  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ error: 'Title cannot be empty' }); return
    }
    setClauses.push(`title = $${idx++}`); values.push(title.trim())
  }
  if (description !== undefined) { setClauses.push(`description = $${idx++}`); values.push(String(description).trim()) }
  if (lane_id !== undefined) { setClauses.push(`lane_id = $${idx++}`); values.push(lane_id) }
  if (position !== undefined) {
    if (typeof position !== 'number' || !isFinite(position)) {
      res.status(400).json({ error: 'position must be a finite number' }); return
    }
    setClauses.push(`position = $${idx++}`); values.push(position)
  }
  values.push(req.params.id, userId)
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    if (lane_id !== undefined) {
      const { rowCount } = await client.query(
        'SELECT id FROM lanes WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
        [lane_id, userId]
      )
      if (!rowCount) {
        await client.query('ROLLBACK')
        res.status(404).json({ error: 'Lane not found' }); return
      }
    }
    const { rows, rowCount } = await client.query(
      `UPDATE cards SET ${setClauses.join(', ')} WHERE id = $${idx} AND user_id = $${idx + 1} AND deleted_at IS NULL RETURNING id, lane_id, title, description, position, created_at, updated_at`,
      values
    )
    if (!rowCount) {
      await client.query('ROLLBACK')
      res.status(404).json({ error: 'Card not found' }); return
    }
    if (position !== undefined) {
      const targetLaneId = lane_id ?? rows[0].lane_id
      const { rows: allCards } = await client.query<{ id: string; position: number }>(
        'SELECT id, position FROM cards WHERE lane_id = $1 AND deleted_at IS NULL ORDER BY position ASC',
        [targetLaneId]
      )
      const needsRenorm = allCards.some((r, i) => i > 0 && r.position - allCards[i - 1].position < RENORM_GAP)
      if (needsRenorm) {
        for (let i = 0; i < allCards.length; i++) {
          await client.query('UPDATE cards SET position = $1 WHERE id = $2', [i + 1, allCards[i].id])
        }
      }
    }
    await client.query('COMMIT')
    res.json({ card: rows[0] })
  } catch (err) {
    await client.query('ROLLBACK'); throw err
  } finally {
    client.release()
  }
})

cardsRouter.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const { userId } = req as AuthenticatedRequest
  const { rowCount } = await pool.query(
    'UPDATE cards SET deleted_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
    [req.params.id, userId]
  )
  if (!rowCount) { res.status(404).json({ error: 'Card not found' }); return }
  res.json({ ok: true })
})
