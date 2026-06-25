import initSqlJs, { Database as SqlJsDatabase } from 'sql.js'
import path from 'path'
import fs from 'fs'

const migrationsDir = path.resolve(__dirname, '../../src/data/migrations')
const allFiles = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort()

export interface TestDbHandle {
  dbRun(sql: string, params?: any[]): { lastInsertRowid: number; changes: number }
  dbGet(sql: string, params?: any[]): Record<string, any> | undefined
  dbAll(sql: string, params?: any[]): Record<string, any>[]
  dbTransaction(fn: () => void): void
  applyMigrations(files: string[]): void
  applyAllMigrations(): void
  applyMigrationsUpTo(fileName: string): void
  applyMissingMigrations(): void
  allMigrationFiles: string[]
  destroy(): void
}

export async function createTestDb(): Promise<TestDbHandle> {
  const SQL = await initSqlJs()
  const db = new SQL.Database()
  db.run('PRAGMA foreign_keys = ON')

  function dbRun(sql: string, params?: any[]) {
    db.run(sql, params || [])
    const idResult = dbGet('SELECT last_insert_rowid() as id')
    const changesResult = dbGet('SELECT changes() as changes')
    return {
      lastInsertRowid: idResult ? (idResult['id'] as number) : 0,
      changes: changesResult ? (changesResult['changes'] as number) : 0,
    }
  }

  function dbAll(sql: string, params?: any[]) {
    if (params && params.length > 0) {
      const stmt = db.prepare(sql)
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
    const results = db.exec(sql)
    if (results.length === 0) return []
    const cols = results[0].columns
    return results[0].values.map((vals: any[]) => {
      const row: Record<string, any> = {}
      for (let i = 0; i < cols.length; i++) {
        row[cols[i]] = vals[i]
      }
      return row
    })
  }

  function dbGet(sql: string, params?: any[]) {
    const rows = dbAll(sql, params)
    return rows.length > 0 ? rows[0] : undefined
  }

  function dbTransaction(fn: () => void) {
    db.run('BEGIN')
    try {
      fn()
      db.run('COMMIT')
    } catch (e) {
      db.run('ROLLBACK')
      throw e
    }
  }

  function ensureMigrationsTable() {
    db.run(`CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`)
  }

  function applyMigrations(files: string[]) {
    ensureMigrationsTable()
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
      db.run(sql)
      dbRun("INSERT OR IGNORE INTO _migrations (name) VALUES (?)", [file])
    }
  }

  function applyAllMigrations() {
    applyMigrations(allFiles)
  }

  function applyMigrationsUpTo(fileName: string) {
    const idx = allFiles.indexOf(fileName)
    if (idx === -1) throw new Error(`Migration "${fileName}" not found`)
    applyMigrations(allFiles.slice(0, idx + 1))
  }

  function applyMissingMigrations() {
    let applied: Set<string>
    try {
      const rows = dbAll("SELECT name FROM _migrations ORDER BY name")
      applied = new Set(rows.map(r => r.name as string))
    } catch {
      applied = new Set()
    }
    const remaining = allFiles.filter(f => !applied.has(f))
    if (remaining.length === 0) return
    applyMigrations(remaining)
  }

  function destroy() {
    db.close()
  }

  return {
    dbRun, dbGet, dbAll, dbTransaction,
    applyMigrations, applyAllMigrations, applyMigrationsUpTo, applyMissingMigrations,
    allMigrationFiles: allFiles,
    destroy,
  }
}
