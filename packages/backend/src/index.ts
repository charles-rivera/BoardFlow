import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { authRouter } from './routes/auth'
import { lanesRouter } from './routes/lanes'
import { cardsRouter } from './routes/cards'
import { eventsRouter } from './routes/events'

export const app = express()

app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', authRouter)
app.use('/api/events', eventsRouter)
app.use('/api/lanes', lanesRouter)
app.use('/api/cards', cardsRouter)

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})
