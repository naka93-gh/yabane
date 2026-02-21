import { getDatabase } from '../database'

/** プロジェクト単位で WBS を取得する（arrow を JOIN） */
export function listWbsItems(projectId: number): unknown[] {
  const db = getDatabase()
  return db
    .prepare(
      `SELECT w.* FROM wbs_item w
       JOIN arrow a ON w.arrow_id = a.id
       WHERE a.project_id = ?
       ORDER BY w.arrow_id, w.sort_order, w.id`
    )
    .all(projectId)
}

/** WBS を作成する */
export function createWbsItem(args: {
  arrowId: number
  name: string
  startDate?: string
  endDate?: string
  owner?: string
  status?: string
  progress?: number
  estimatedHours?: number
}): unknown {
  const db = getDatabase()

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

/** WBS を更新する */
export function updateWbsItem(args: {
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
}): unknown {
  const db = getDatabase()

  const item = db.prepare('SELECT * FROM wbs_item WHERE id = ?').get(args.id) as
    | {
        arrow_id: number
        name: string
        start_date: string | null
        end_date: string | null
        owner: string | null
        status: string
        progress: number
        estimated_hours: number | null
        actual_hours: number | null
      }
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

/** WBS を削除する */
export function deleteWbsItem(id: number): unknown {
  const db = getDatabase()
  return db.prepare('DELETE FROM wbs_item WHERE id = ? RETURNING *').get(id)
}

/** WBS の並び順を更新する */
export function reorderWbsItems(ids: number[]): void {
  const db = getDatabase()
  const update = db.prepare('UPDATE wbs_item SET sort_order = ? WHERE id = ?')
  db.transaction(() => {
    ids.forEach((id, index) => {
      update.run(index, id)
    })
  })()
}
