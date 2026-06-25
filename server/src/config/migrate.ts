import { runMigrations } from '../data/database'

async function main() {
  console.log('Running migrations...')
  await runMigrations()
  console.log('All migrations applied')
  process.exit(0)
}

main().catch(console.error)
