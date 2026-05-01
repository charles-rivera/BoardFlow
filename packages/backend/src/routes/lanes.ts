import { Router, Request, Response } from 'express'
import { pool } from '../db'
import { requireAuth, getAuthenticatedUserId } from '../middleware/auth'
import { publishBoardChanged } from '../realtime'
import { getBoard, getLaneById } from '../board'

export const lanesRouter = Router()
lanesRouter.use(requireAuth)

const RENORM_GAP = 0.001

type UpdateLaneResult =
  | { lane: NonNullable<Awaited<ReturnType<typeof getLaneById>>> }
  | { error: { status: number; body: { error: string } } }

function hasError(result: UpdateLaneResult): result is Extract<UpdateLaneResult, { error: { status: number; body: { error: string } } }> {
  return 'error' in result
}

async function updateLaneById(id: string, body: { title?: unknown; position?: unknown }): Promise<UpdateLaneResult> {
  const { title, position } = body
  if (title === undefined && position === undefined) {
    return { error: { status: 400, body: { error: 'At least one of title or position is required' } } }
  }
  if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
    return { error: { status: 400, body: { error: 'Title cannot be empty' } } }
  }
  if (position !== undefined && (typeof position !== 'number' || !isFinite(position))) {
    return { error: { status: 400, body: { error: 'position must be a finite number' } } }
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const setClauses = ['created_at = created_at']
    const values: unknown[] = []
    let idx = 1
    if (title !== undefined) {
      setClauses.push(`title = $${idx++}`)
      values.push(title.trim())
    }
    if (position !== undefined) {
      setClauses.push(`position = $${idx++}`)
      values.push(position)
    }
    values.push(id)
    const { rowCount } = await client.query(
      `UPDATE lanes SET ${setClauses.join(', ')} WHERE id = $${idx} AND deleted_at IS NULL`,
      values
    )
    if (!rowCount) {
      await client.query('ROLLBACK')
      return { error: { status: 404, body: { error: 'Lane not found' } } }
    }
    if (position !== undefined) {
      const { rows: all } = await client.query<{ id: string; position: number }>(
        'SELECT id, position FROM lanes WHERE deleted_at IS NULL ORDER BY position ASC'
      )
      const needsRenorm = all.some((r, i) => i > 0 && r.position - all[i - 1].position < RENORM_GAP)
      if (needsRenorm) {
        for (let i = 0; i < all.length; i++) {
          await client.query('UPDATE lanes SET position = $1 WHERE id = $2', [i + 1, all[i].id])
        }
      }
    }
    const lane = await getLaneById(client, id)
    if (!lane) {
      await client.query('ROLLBACK')
      return { error: { status: 404, body: { error: 'Lane not found' } } }
    }
    await client.query('COMMIT')
    publishBoardChanged()
    return { lane }
  } catch (err) {
    await client.query('ROLLBACK'); throw err
  } finally {
    client.release()
  }
}

lanesRouter.get('/', async (_req: Request, res: Response): Promise<void> => {
  res.json(await getBoard(pool))
})

lanesRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const lane = await getLaneById(pool, req.params.id)
  if (!lane) {
    res.status(404).json({ error: 'Lane not found' }); return
  }
  res.json({ lane })
})

lanesRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req)
  const { title } = req.body
  if (!title || typeof title !== 'string' || !title.trim()) {
    res.status(400).json({ error: 'Title is required' }); return
  }
  const { rows: [{ max }] } = await pool.query<{ max: number | null }>(
    'SELECT MAX(position) AS max FROM lanes WHERE deleted_at IS NULL'
  )
  const { rows: [lane] } = await pool.query(
    'INSERT INTO lanes (user_id, title, position) VALUES ($1, $2, $3) RETURNING id, user_id, title, position, created_at',
    [userId, title.trim(), (max ?? 0) + 1]
  )
  publishBoardChanged()
  res.status(201).json({ lane: { ...lane, cards: [] } })
})

lanesRouter.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  const result: UpdateLaneResult = await updateLaneById(req.params.id, req.body)
  if (hasError(result)) {
    res.status(result.error.status).json(result.error.body); return
  }
  res.json({ lane: result.lane })
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
