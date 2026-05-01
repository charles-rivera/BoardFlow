import { app } from './index'
import { runMigrations } from './db'

const PORT = process.env.PORT ?? 4000

async function main(): Promise<void> {
  await runMigrations()
  app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`))
}

main().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
