import { getDatabase } from '../database'
import type { WbsItem } from '../../shared/types/models'
import type { WbsCreateArgs, WbsUpdateArgs } from '../../shared/types/ipc'
import { reorderRows, nextSortOrder } from './common'

/** プロジェクト単位で WBS を取得する（arrow を JOIN） */
export function listWbsItems(projectId: number): WbsItem[] {
  const db = getDatabase()
  return db
    .prepare(
      `SELECT w.* FROM wbs_item w
       JOIN arrow a ON w.arrow_id = a.id
       WHERE a.project_id = ?
       ORDER BY w.arrow_id, w.sort_order, w.id`
    )
    .all(projectId) as WbsItem[]
}

/** WBS を作成する */
export function createWbsItem(args: WbsCreateArgs): WbsItem {
  const db = getDatabase()
  const sortOrder = nextSortOrder('wbs_item', 'arrow_id = ?', [args.arrowId])

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
      sortOrder
    ) as WbsItem
}

/** WBS を更新する */
export function updateWbsItem(args: WbsUpdateArgs): WbsItem | null {
  const db = getDatabase()

  const item = db.prepare('SELECT * FROM wbs_item WHERE id = ?').get(args.id) as WbsItem | undefined
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
    .get(
      arrowId,
      name,
      startDate,
      endDate,
      owner,
      status,
      progress,
      estimatedHours,
      actualHours,
      args.id
    ) as WbsItem
}

/** WBS を削除する */
export function deleteWbsItem(id: number): WbsItem | undefined {
  const db = getDatabase()
  return db.prepare('DELETE FROM wbs_item WHERE id = ? RETURNING *').get(id) as WbsItem | undefined
}

/** WBS の並び順を更新する */
export function reorderWbsItems(ids: number[]): void {
  reorderRows('wbs_item', ids)
}
