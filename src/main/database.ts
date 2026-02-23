import { app } from 'electron'
import { join } from 'path'
import Database from 'better-sqlite3'
import { SCHEMA_SQL } from './schema'

let db: Database.Database | null = null

/** DB 接続を取得（初回は初期化を行う） */
export function getDatabase(): Database.Database {
  if (db) return db

  const dbPath = join(app.getPath('userData'), 'yabane.db')
  db = new Database(dbPath)

  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(SCHEMA_SQL)
  migrate(db)

  return db
}

/** 既存 DB 向けマイグレーション */
function migrate(db: Database.Database): void {
  const columns = db.pragma('table_info(project)') as { name: string }[]
  const names = new Set(columns.map((c) => c.name))

  if (!names.has('start_date')) {
    db.exec('ALTER TABLE project ADD COLUMN start_date TEXT')
  }
  if (!names.has('end_date')) {
    db.exec('ALTER TABLE project ADD COLUMN end_date TEXT')
  }
}

/** アプリ終了時に呼ぶ */
export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}
