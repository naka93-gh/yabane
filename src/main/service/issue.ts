import type { IssueCreateArgs, IssueUpdateArgs } from '../../shared/types/ipc'
import type { Issue } from '../../shared/types/models'
import { getDatabase } from '../database'

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
  const row = db
    .prepare('SELECT COALESCE(MAX(issue_number), 0) AS max_num FROM issue WHERE project_id = ?')
    .get(args.projectId) as { max_num: number }
  const issueNumber = row.max_num + 1

  return db
    .prepare(
      `INSERT INTO issue (project_id, issue_number, title, description, owner, priority, status, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
    )
    .get(
      args.projectId,
      issueNumber,
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

  let resolvedAt: string | null
  if (args.resolvedAt !== undefined) {
    resolvedAt = args.resolvedAt
  } else {
    const isClosed = status === 'resolved' || status === 'closed'
    const wasClosed = issue.status === 'resolved' || issue.status === 'closed'
    resolvedAt = issue.resolved_at
    if (isClosed && !wasClosed) {
      resolvedAt = new Date().toISOString().slice(0, 10)
    } else if (!isClosed && wasClosed) {
      resolvedAt = null
    }
  }

  return db
    .prepare(
      `UPDATE issue SET title = ?, description = ?, owner = ?, priority = ?, status = ?,
       due_date = ?, resolution = ?, resolved_at = ?, updated_at = datetime('now')
       WHERE id = ? RETURNING *`
    )
    .get(
      title,
      description,
      owner,
      priority,
      status,
      dueDate,
      resolution,
      resolvedAt,
      args.id
    ) as Issue
}

/** 課題を削除する */
export function deleteIssue(id: number): Issue | undefined {
  const db = getDatabase()
  return db.prepare('DELETE FROM issue WHERE id = ? RETURNING *').get(id) as Issue | undefined
}
