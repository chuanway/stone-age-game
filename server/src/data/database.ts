import initSqlJs, { Database as SqlJsDatabase } from 'sql.js'
import fs from 'fs'
import path from 'path'
import { env } from '../config/env'

let db: SqlJsDatabase | null = null
let Sql: Awaited<ReturnType<typeof initSqlJs>> | null = null
let initPromise: Promise<void> | null = null
let lastLoadMtime: number = 0

export async function initDb(): Promise<void> {
  if (db) return
  if (initPromise) return initPromise

  initPromise = (async () => {
    Sql = await initSqlJs()
    const dir = path.dirname(env.dbPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    if (fs.existsSync(env.dbPath)) {
      const buffer = fs.readFileSync(env.dbPath)
      db = new Sql.Database(buffer)
      lastLoadMtime = fs.statSync(env.dbPath).mtimeMs
    } else {
      db = new Sql.Database()
    }

    db.run('PRAGMA foreign_keys = ON')
  })()

  return initPromise
}

export function getDb(): SqlJsDatabase {
  if (!db) throw new Error('Database not initialized. Call initDb() first.')
  if (Sql && fs.existsSync(env.dbPath) && fs.statSync(env.dbPath).mtimeMs > lastLoadMtime) {
    reloadDb()
  }
  return db
}

export function reloadDb(): void {
  if (!Sql) return
  if (fs.existsSync(env.dbPath)) {
    const buffer = fs.readFileSync(env.dbPath)
    db = new Sql.Database(buffer)
    db.run('PRAGMA foreign_keys = ON')
    lastLoadMtime = fs.statSync(env.dbPath).mtimeMs
  }
}

export function saveDb(): void {
  if (!db) return
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(env.dbPath, buffer)
  lastLoadMtime = fs.statSync(env.dbPath).mtimeMs
}

/* ── Helper wrappers to emulate better-sqlite3 API ── */

export function dbAll(sql: string, params?: any[]): Record<string, any>[] {
  const d = getDb()
  if (params && params.length > 0) {
    const stmt = d.prepare(sql)
    stmt.bind(params)
    const rows: Record<string, any>[] = []
    const cols = stmt.getColumnNames()
    while (stmt.step()) {
      const vals = stmt.get()
      const row: Record<string, any> = {}
      for (let i = 0; i < cols.length; i++) {
        row[cols[i]] = vals[i]
      }
      rows.push(row)
    }
    stmt.free()
    return rows
  }

  const results = d.exec(sql)
  if (results.length === 0) return []
  const cols = results[0].columns
  return results[0].values.map(vals => {
    const row: Record<string, any> = {}
    for (let i = 0; i < cols.length; i++) {
      row[cols[i]] = vals[i]
    }
    return row
  })
}

export function dbGet(sql: string, params?: any[]): Record<string, any> | undefined {
  const rows = dbAll(sql, params)
  return rows.length > 0 ? rows[0] : undefined
}

export function dbRun(sql: string, params?: any[]): { lastInsertRowid: number; changes: number } {
  const d = getDb()
  d.run(sql, params || [])
  const idResult = dbGet('SELECT last_insert_rowid() as id')
  const changesResult = dbGet('SELECT changes() as changes')
  saveDb()
  return {
    lastInsertRowid: idResult ? (idResult['id'] as number) : 0,
    changes: changesResult ? (changesResult['changes'] as number) : 0,
  }
}

export function dbTransaction(fn: () => void): void {
  const d = getDb()
  d.run('BEGIN')
  try {
    fn()
    d.run('COMMIT')
  } catch (e) {
    d.run('ROLLBACK')
    throw e
  }
}

/* ── Migrations ── */

export async function runMigrations(): Promise<void> {
  await initDb()
  const d = getDb()

  d.run(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  const migrationsDir = path.resolve(env.migrationsPath)
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()

  const applied = new Set(
    dbAll("SELECT name FROM _migrations").map(r => r.name as string)
  )

  for (const file of files) {
    if (applied.has(file)) continue
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
    d.run(sql)
    dbRun("INSERT INTO _migrations (name) VALUES (?)", [file])
    console.log(`Applied migration: ${file}`)
  }

  saveDb()
}

export function closeDb(): void {
  if (db) {
    saveDb()
    db.close()
    db = null
  }
}
