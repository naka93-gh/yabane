import { ipcMain } from 'electron'
import { getDatabase } from '../database'

export function registerIssueHandlers(): void {
  const db = getDatabase()

  ipcMain.handle('issue:list', (_e, args: { projectId: number }) => {
    return db
      .prepare('SELECT * FROM issue WHERE project_id = ? ORDER BY created_at DESC')
      .all(args.projectId)
  })

  ipcMain.handle(
    'issue:create',
    (
      _e,
      args: {
        projectId: number
        title: string
        description?: string
        owner?: string
        priority?: string
        status?: string
        dueDate?: string
      }
    ) => {
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
  )

  ipcMain.handle(
    'issue:update',
    (
      _e,
      args: {
        id: number
        title?: string
        description?: string
        owner?: string
        priority?: string
        status?: string
        dueDate?: string
        resolution?: string
      }
    ) => {
      const issue = db.prepare('SELECT * FROM issue WHERE id = ?').get(args.id) as
        | Record<string, unknown>
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
  )

  ipcMain.handle('issue:delete', (_e, args: { id: number }) => {
    return db.prepare('DELETE FROM issue WHERE id = ? RETURNING *').get(args.id)
  })
}
