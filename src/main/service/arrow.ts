import { getDatabase } from '../database'
import type { Arrow } from '../../shared/types/models'
import type { ArrowCreateArgs, ArrowUpdateArgs } from '../../shared/types/ipc'
import { reorderRows, nextSortOrder } from './common'

/** 矢羽一覧を取得する */
export function listArrows(projectId: number): Arrow[] {
  const db = getDatabase()
  return db
    .prepare('SELECT * FROM arrow WHERE project_id = ? ORDER BY sort_order, id')
    .all(projectId) as Arrow[]
}

/** 矢羽を作成する */
export function createArrow(args: ArrowCreateArgs): Arrow {
  const db = getDatabase()

  const where = args.parentId
    ? 'project_id = ? AND parent_id = ?'
    : 'project_id = ? AND parent_id IS NULL'
  const params = args.parentId ? [args.projectId, args.parentId] : [args.projectId]
  const sortOrder = nextSortOrder('arrow', where, params)

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
      sortOrder
    ) as Arrow
}

/** 矢羽を更新する */
export function updateArrow(args: ArrowUpdateArgs): Arrow | null {
  const db = getDatabase()

  const arrow = db.prepare('SELECT * FROM arrow WHERE id = ?').get(args.id) as Arrow | undefined
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
    .get(name, startDate, endDate, owner, status, parentId, args.id) as Arrow
}

/** 矢羽を削除する */
export function deleteArrow(id: number): Arrow | undefined {
  const db = getDatabase()
  return db.prepare('DELETE FROM arrow WHERE id = ? RETURNING *').get(id) as Arrow | undefined
}

/** 矢羽の並び順を更新する */
export function reorderArrows(ids: number[]): void {
  reorderRows('arrow', ids)
}
