import { getDatabase } from '../database'
import type { Issue } from '../../shared/types/models'
import type { IssueCreateArgs, IssueUpdateArgs } from '../../shared/types/ipc'

/** 課題一覧を取得する */
export function listIssues(projectId: number): Issue[] {
  const db = getDatabase()
  return db
    .prepare('SELECT * FROM issue WHERE project_id = ? ORDER BY created_at DESC')
    .all(projectId) as Issue[]
}

/** 課題を作成する */
export function createIssue(args: IssueCreateArgs): Issue {
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
    ) as Issue
}

/** 課題を更新する */
export function updateIssue(args: IssueUpdateArgs): Issue | null {
  const db = getDatabase()

  const issue = db.prepare('SELECT * FROM issue WHERE id = ?').get(args.id) as Issue | undefined
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
    .get(title, description, owner, priority, status, dueDate, resolution, args.id) as Issue
}

/** 課題を削除する */
export function deleteIssue(id: number): Issue | undefined {
  const db = getDatabase()
  return db.prepare('DELETE FROM issue WHERE id = ? RETURNING *').get(id) as Issue | undefined
}
