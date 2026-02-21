import { getDatabase } from '../database'

/** プロジェクト一覧を取得する */
export function listProjects(status?: 'active' | 'archived'): unknown[] {
  const db = getDatabase()
  const s = status ?? 'active'
  return db.prepare('SELECT * FROM project WHERE status = ? ORDER BY updated_at DESC').all(s)
}

/** プロジェクトを1件取得する */
export function getProject(id: number): unknown {
  const db = getDatabase()
  return db.prepare('SELECT * FROM project WHERE id = ?').get(id) ?? null
}

/** プロジェクトを作成する */
export function createProject(name: string, description?: string): unknown {
  const db = getDatabase()
  return db
    .prepare('INSERT INTO project (name, description) VALUES (?, ?) RETURNING *')
    .get(name, description ?? null)
}

/** プロジェクトを更新する */
export function updateProject(args: {
  id: number
  name?: string
  description?: string
}): unknown {
  const db = getDatabase()
  const project = db.prepare('SELECT * FROM project WHERE id = ?').get(args.id) as
    | { name: string; description: string | null }
    | undefined
  if (!project) return null

  const name = args.name ?? project.name
  const description = args.description !== undefined ? args.description : project.description

  return db
    .prepare(
      "UPDATE project SET name = ?, description = ?, updated_at = datetime('now') WHERE id = ? RETURNING *"
    )
    .get(name, description, args.id)
}

/** プロジェクトをアーカイブする */
export function archiveProject(id: number): unknown {
  const db = getDatabase()
  return db
    .prepare(
      "UPDATE project SET status = 'archived', updated_at = datetime('now') WHERE id = ? RETURNING *"
    )
    .get(id)
}

/** プロジェクトのアーカイブを解除する */
export function unarchiveProject(id: number): unknown {
  const db = getDatabase()
  return db
    .prepare(
      "UPDATE project SET status = 'active', updated_at = datetime('now') WHERE id = ? RETURNING *"
    )
    .get(id)
}
