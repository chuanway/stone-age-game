import path from 'path'
import { config } from 'dotenv'

config({ path: path.resolve(__dirname, '../../.env') })

const serverRoot = path.resolve(__dirname, '../..')

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  dbPath: path.resolve(serverRoot, process.env.DB_PATH || './data/game.db'),
  migrationsPath: path.resolve(serverRoot, process.env.MIGRATIONS_PATH || './src/data/migrations'),
  configPath: process.env.CONFIG_PATH || '../shared/config',
  jwtSecret: process.env.JWT_SECRET || 'default-secret',
  port: parseInt(process.env.SERVER_PORT || '3001', 10),
  localTimezoneOffset: process.env.LOCAL_TIMEZONE_OFFSET || '+00:00',
}
