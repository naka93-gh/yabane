import { ipcMain } from 'electron'
import { getDatabase } from '../database'

export function registerWbsHandlers(): void {
  const db = getDatabase()

  // プロジェクト単位で取得（arrow を JOIN）
  ipcMain.handle('wbs:list', (_e, args: { projectId: number }) => {
    return db
      .prepare(
        `SELECT w.* FROM wbs_item w
         JOIN arrow a ON w.arrow_id = a.id
         WHERE a.project_id = ?
         ORDER BY w.arrow_id, w.sort_order, w.id`
      )
      .all(args.projectId)
  })

  ipcMain.handle(
    'wbs:create',
    (
      _e,
      args: {
        arrowId: number
        name: string
        startDate?: string
        endDate?: string
        owner?: string
        status?: string
        progress?: number
        estimatedHours?: number
      }
    ) => {
      const maxOrder = db
        .prepare('SELECT COALESCE(MAX(sort_order), -1) as max_order FROM wbs_item WHERE arrow_id = ?')
        .get(args.arrowId) as { max_order: number }

      return db
        .prepare(
          `INSERT INTO wbs_item (arrow_id, name, start_date, end_date, owner, status, progress, estimated_hours, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
        )
        .get(
          args.arrowId,
          args.name,
          args.startDate ?? null,
          args.endDate ?? null,
          args.owner ?? null,
          args.status ?? 'not_started',
          args.progress ?? 0,
          args.estimatedHours ?? null,
          maxOrder.max_order + 1
        )
    }
  )

  ipcMain.handle(
    'wbs:update',
    (
      _e,
      args: {
        id: number
        arrowId?: number
        name?: string
        startDate?: string
        endDate?: string
        owner?: string
        status?: string
        progress?: number
        estimatedHours?: number
        actualHours?: number
      }
    ) => {
      const item = db.prepare('SELECT * FROM wbs_item WHERE id = ?').get(args.id) as
        | Record<string, unknown>
        | undefined
      if (!item) return null

      const arrowId = args.arrowId ?? item.arrow_id
      const name = args.name ?? item.name
      const startDate = args.startDate !== undefined ? args.startDate : item.start_date
      const endDate = args.endDate !== undefined ? args.endDate : item.end_date
      const owner = args.owner !== undefined ? args.owner : item.owner
      const status = args.status ?? item.status
      const progress = args.progress ?? item.progress
      const estimatedHours =
        args.estimatedHours !== undefined ? args.estimatedHours : item.estimated_hours
      const actualHours = args.actualHours !== undefined ? args.actualHours : item.actual_hours

      return db
        .prepare(
          `UPDATE wbs_item SET arrow_id = ?, name = ?, start_date = ?, end_date = ?, owner = ?,
           status = ?, progress = ?, estimated_hours = ?, actual_hours = ?
           WHERE id = ? RETURNING *`
        )
        .get(arrowId, name, startDate, endDate, owner, status, progress, estimatedHours, actualHours, args.id)
    }
  )

  ipcMain.handle('wbs:delete', (_e, args: { id: number }) => {
    return db.prepare('DELETE FROM wbs_item WHERE id = ? RETURNING *').get(args.id)
  })

  ipcMain.handle('wbs:reorder', (_e, args: { ids: number[] }) => {
    const update = db.prepare('UPDATE wbs_item SET sort_order = ? WHERE id = ?')
    db.transaction(() => {
      args.ids.forEach((id, index) => {
        update.run(index, id)
      })
    })()
  })
}
