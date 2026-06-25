import express from 'express'
import cors from 'cors'
import path from 'path'
import { env } from './config/env'
import { router } from './api/router'
import { runMigrations } from './data/database'

async function main() {
  await runMigrations()

  const app = express()

  app.use(cors())
  app.use(express.json())

  app.use('/api', router)

  const clientDist = path.resolve(__dirname, '../../client/dist')
  app.use(express.static(clientDist))

  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })

  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port} — serving client at http://localhost:${env.port}`)
  })
}

main().catch(console.error)
