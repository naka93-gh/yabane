import { ipcMain } from 'electron'
import { getDatabase } from '../database'

export function registerMilestoneHandlers(): void {
  const db = getDatabase()

  ipcMain.handle('milestone:list', (_e, args: { projectId: number }) => {
    return db
      .prepare('SELECT * FROM milestone WHERE project_id = ? ORDER BY sort_order, id')
      .all(args.projectId)
  })

  ipcMain.handle(
    'milestone:create',
    (
      _e,
      args: {
        projectId: number
        name: string
        description?: string
        dueDate?: string
        color?: string
      }
    ) => {
      const maxOrder = db
        .prepare('SELECT COALESCE(MAX(sort_order), -1) as max_order FROM milestone WHERE project_id = ?')
        .get(args.projectId) as { max_order: number }

      return db
        .prepare(
          'INSERT INTO milestone (project_id, name, description, due_date, color, sort_order) VALUES (?, ?, ?, ?, ?, ?) RETURNING *'
        )
        .get(
          args.projectId,
          args.name,
          args.description ?? null,
          args.dueDate ?? null,
          args.color ?? '#6366f1',
          maxOrder.max_order + 1
        )
    }
  )

  ipcMain.handle(
    'milestone:update',
    (
      _e,
      args: {
        id: number
        name?: string
        description?: string
        dueDate?: string
        color?: string
      }
    ) => {
      const milestone = db.prepare('SELECT * FROM milestone WHERE id = ?').get(args.id) as
        | Record<string, unknown>
        | undefined
      if (!milestone) return null

      const name = args.name ?? milestone.name
      const description = args.description !== undefined ? args.description : milestone.description
      const dueDate = args.dueDate !== undefined ? args.dueDate : milestone.due_date
      const color = args.color ?? milestone.color

      return db
        .prepare(
          'UPDATE milestone SET name = ?, description = ?, due_date = ?, color = ? WHERE id = ? RETURNING *'
        )
        .get(name, description, dueDate, color, args.id)
    }
  )

  ipcMain.handle('milestone:delete', (_e, args: { id: number }) => {
    return db.prepare('DELETE FROM milestone WHERE id = ? RETURNING *').get(args.id)
  })

  ipcMain.handle('milestone:reorder', (_e, args: { ids: number[] }) => {
    const update = db.prepare('UPDATE milestone SET sort_order = ? WHERE id = ?')
    db.transaction(() => {
      args.ids.forEach((id, index) => {
        update.run(index, id)
      })
    })()
  })
}
