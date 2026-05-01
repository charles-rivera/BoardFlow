import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { pool } from '../db'
import { getBoard } from '../board'

export const boardRouter = Router()
boardRouter.use(requireAuth)

boardRouter.get('/', async (_req: Request, res: Response): Promise<void> => {
  res.json(await getBoard(pool))
})

