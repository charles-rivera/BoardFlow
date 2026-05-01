import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthenticatedRequest extends Request {
  userId: string
}

export function getUserIdFromRequest(req: Request): string | null {
  const token: string | undefined = req.cookies?.token
  if (!token) {
    return null
  }
  try {
    const secret = process.env.JWT_SECRET
    if (!secret) throw new Error('JWT_SECRET not set')
    const payload = jwt.verify(token, secret) as { userId: string }
    return payload.userId
  } catch {
    return null
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const userId = getUserIdFromRequest(req)
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  ;(req as AuthenticatedRequest).userId = userId
  next()
}

export function getAuthenticatedUserId(req: Request): string {
  const userId = (req as Partial<AuthenticatedRequest>).userId
  if (!userId) {
    throw new Error('Authenticated user id missing from request')
  }
  return userId
}
