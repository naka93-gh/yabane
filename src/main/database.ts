import { join } from 'node:path'
import Database from 'better-sqlite3'
import { app } from 'electron'
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
  const projectCols = db.pragma('table_info(project)') as { name: string }[]
  const projectNames = new Set(projectCols.map((c) => c.name))

  if (!projectNames.has('start_date')) {
    db.exec('ALTER TABLE project ADD COLUMN start_date TEXT')
  }
  if (!projectNames.has('end_date')) {
    db.exec('ALTER TABLE project ADD COLUMN end_date TEXT')
  }

  const memberCols = db.pragma('table_info(member)') as { name: string }[]
  const memberNames = new Set(memberCols.map((c) => c.name))

  if (!memberNames.has('archived')) {
    db.exec('ALTER TABLE member ADD COLUMN archived INTEGER NOT NULL DEFAULT 0')
  }

  const milestoneCols = db.pragma('table_info(milestone)') as { name: string }[]
  const milestoneNames = new Set(milestoneCols.map((c) => c.name))

  if (!milestoneNames.has('completed')) {
    db.exec('ALTER TABLE milestone ADD COLUMN completed INTEGER NOT NULL DEFAULT 0')
  }

  const issueCols = db.pragma('table_info(issue)') as { name: string }[]
  const issueNames = new Set(issueCols.map((c) => c.name))

  if (!issueNames.has('resolved_at')) {
    db.exec('ALTER TABLE issue ADD COLUMN resolved_at TEXT')
  }
  if (!issueNames.has('issue_number')) {
    db.exec('ALTER TABLE issue ADD COLUMN issue_number INTEGER NOT NULL DEFAULT 0')
    // 既存レコードにプロジェクト内連番を振る
    const rows = db.prepare('SELECT id, project_id FROM issue ORDER BY project_id, id').all() as {
      id: number
      project_id: number
    }[]
    const counters = new Map<number, number>()
    const stmt = db.prepare('UPDATE issue SET issue_number = ? WHERE id = ?')
    for (const row of rows) {
      const n = (counters.get(row.project_id) ?? 0) + 1
      counters.set(row.project_id, n)
      stmt.run(n, row.id)
    }
  }
}

/** アプリ終了時に呼ぶ */
export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}
