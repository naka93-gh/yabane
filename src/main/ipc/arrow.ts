import { ipcMain } from 'electron'
import { getDatabase } from '../database'

export function registerArrowHandlers(): void {
  const db = getDatabase()

  ipcMain.handle('arrow:list', (_e, args: { projectId: number }) => {
    return db
      .prepare('SELECT * FROM arrow WHERE project_id = ? ORDER BY sort_order, id')
      .all(args.projectId)
  })

  ipcMain.handle(
    'arrow:create',
    (
      _e,
      args: {
        projectId: number
        parentId?: number
        name: string
        startDate?: string
        endDate?: string
        owner?: string
        status?: string
      }
    ) => {
      const maxOrder = db
        .prepare(
          args.parentId
            ? 'SELECT COALESCE(MAX(sort_order), -1) as max_order FROM arrow WHERE project_id = ? AND parent_id = ?'
            : 'SELECT COALESCE(MAX(sort_order), -1) as max_order FROM arrow WHERE project_id = ? AND parent_id IS NULL'
        )
        .get(...(args.parentId ? [args.projectId, args.parentId] : [args.projectId])) as {
        max_order: number
      }

      return db
        .prepare(
          'INSERT INTO arrow (project_id, parent_id, name, start_date, end_date, owner, status, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *'
        )
        .get(
          args.projectId,
          args.parentId ?? null,
          args.name,
          args.startDate ?? null,
          args.endDate ?? null,
          args.owner ?? null,
          args.status ?? 'not_started',
          maxOrder.max_order + 1
        )
    }
  )

  ipcMain.handle(
    'arrow:update',
    (
      _e,
      args: {
        id: number
        name?: string
        startDate?: string
        endDate?: string
        owner?: string
        status?: string
        parentId?: number | null
      }
    ) => {
      const arrow = db.prepare('SELECT * FROM arrow WHERE id = ?').get(args.id) as
        | Record<string, unknown>
        | undefined
      if (!arrow) return null

      const name = args.name ?? arrow.name
      const startDate = args.startDate !== undefined ? args.startDate : arrow.start_date
      const endDate = args.endDate !== undefined ? args.endDate : arrow.end_date
      const owner = args.owner !== undefined ? args.owner : arrow.owner
      const status = args.status ?? arrow.status
      const parentId = args.parentId !== undefined ? args.parentId : arrow.parent_id

      return db
        .prepare(
          'UPDATE arrow SET name = ?, start_date = ?, end_date = ?, owner = ?, status = ?, parent_id = ? WHERE id = ? RETURNING *'
        )
        .get(name, startDate, endDate, owner, status, parentId, args.id)
    }
  )

  ipcMain.handle('arrow:delete', (_e, args: { id: number }) => {
    return db.prepare('DELETE FROM arrow WHERE id = ? RETURNING *').get(args.id)
  })

  ipcMain.handle('arrow:reorder', (_e, args: { ids: number[] }) => {
    const update = db.prepare('UPDATE arrow SET sort_order = ? WHERE id = ?')
    db.transaction(() => {
      args.ids.forEach((id, index) => {
        update.run(index, id)
      })
    })()
  })
}
