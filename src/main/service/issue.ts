import { getDatabase } from '../database'

/** 課題一覧を取得する */
export function listIssues(projectId: number): unknown[] {
  const db = getDatabase()
  return db
    .prepare('SELECT * FROM issue WHERE project_id = ? ORDER BY created_at DESC')
    .all(projectId)
}

/** 課題を作成する */
export function createIssue(args: {
  projectId: number
  title: string
  description?: string
  owner?: string
  priority?: string
  status?: string
  dueDate?: string
}): unknown {
  const db = getDatabase()
  return db
    .prepare(
      `INSERT INTO issue (project_id, title, description, owner, priority, status, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`
    )
    .get(
      args.projectId,
      args.title,
      args.description ?? null,
      args.owner ?? null,
      args.priority ?? 'medium',
      args.status ?? 'open',
      args.dueDate ?? null
    )
}

/** 課題を更新する */
export function updateIssue(args: {
  id: number
  title?: string
  description?: string
  owner?: string
  priority?: string
  status?: string
  dueDate?: string
  resolution?: string
}): unknown {
  const db = getDatabase()

  const issue = db.prepare('SELECT * FROM issue WHERE id = ?').get(args.id) as
    | {
        title: string
        description: string | null
        owner: string | null
        priority: string
        status: string
        due_date: string | null
        resolution: string | null
      }
    | undefined
  if (!issue) return null

  const title = args.title ?? issue.title
  const description = args.description !== undefined ? args.description : issue.description
  const owner = args.owner !== undefined ? args.owner : issue.owner
  const priority = args.priority ?? issue.priority
  const status = args.status ?? issue.status
  const dueDate = args.dueDate !== undefined ? args.dueDate : issue.due_date
  const resolution = args.resolution !== undefined ? args.resolution : issue.resolution

  return db
    .prepare(
      `UPDATE issue SET title = ?, description = ?, owner = ?, priority = ?, status = ?,
       due_date = ?, resolution = ?, updated_at = datetime('now')
       WHERE id = ? RETURNING *`
    )
    .get(title, description, owner, priority, status, dueDate, resolution, args.id)
}

/** 課題を削除する */
export function deleteIssue(id: number): unknown {
  const db = getDatabase()
  return db.prepare('DELETE FROM issue WHERE id = ? RETURNING *').get(id)
}
