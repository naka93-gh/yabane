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

  return db
}

/** アプリ終了時に呼ぶ */
export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}
