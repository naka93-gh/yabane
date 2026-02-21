import { ipcMain } from 'electron'
import { getDatabase } from '../database'

export function registerProjectHandlers(): void {
  const db = getDatabase()

  ipcMain.handle('project:list', (_e, args: { status?: 'active' | 'archived' }) => {
    const status = args?.status ?? 'active'
    return db.prepare('SELECT * FROM project WHERE status = ? ORDER BY updated_at DESC').all(status)
  })

  ipcMain.handle('project:get', (_e, args: { id: number }) => {
    return db.prepare('SELECT * FROM project WHERE id = ?').get(args.id) ?? null
  })

  ipcMain.handle('project:create', (_e, args: { name: string; description?: string }) => {
    const stmt = db.prepare(
      'INSERT INTO project (name, description) VALUES (?, ?) RETURNING *'
    )
    return stmt.get(args.name, args.description ?? null)
  })

  ipcMain.handle(
    'project:update',
    (_e, args: { id: number; name?: string; description?: string }) => {
      const project = db.prepare('SELECT * FROM project WHERE id = ?').get(args.id) as
        | Record<string, unknown>
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
  )

  ipcMain.handle('project:archive', (_e, args: { id: number }) => {
    return db
      .prepare(
        "UPDATE project SET status = 'archived', updated_at = datetime('now') WHERE id = ? RETURNING *"
      )
      .get(args.id)
  })

  ipcMain.handle('project:unarchive', (_e, args: { id: number }) => {
    return db
      .prepare(
        "UPDATE project SET status = 'active', updated_at = datetime('now') WHERE id = ? RETURNING *"
      )
      .get(args.id)
  })
}
