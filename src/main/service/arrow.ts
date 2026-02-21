import { getDatabase } from '../database'

/** 矢羽一覧を取得する */
export function listArrows(projectId: number): unknown[] {
  const db = getDatabase()
  return db
    .prepare('SELECT * FROM arrow WHERE project_id = ? ORDER BY sort_order, id')
    .all(projectId)
}

/** 矢羽を作成する */
export function createArrow(args: {
  projectId: number
  parentId?: number
  name: string
  startDate?: string
  endDate?: string
  owner?: string
  status?: string
}): unknown {
  const db = getDatabase()

  // 同じ親の中での最大 sort_order を取得
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

/** 矢羽を更新する */
export function updateArrow(args: {
  id: number
  name?: string
  startDate?: string
  endDate?: string
  owner?: string
  status?: string
  parentId?: number | null
}): unknown {
  const db = getDatabase()

  const arrow = db.prepare('SELECT * FROM arrow WHERE id = ?').get(args.id) as
    | {
        name: string
        start_date: string | null
        end_date: string | null
        owner: string | null
        status: string
        parent_id: number | null
      }
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

/** 矢羽を削除する */
export function deleteArrow(id: number): unknown {
  const db = getDatabase()
  return db.prepare('DELETE FROM arrow WHERE id = ? RETURNING *').get(id)
}

/** 矢羽の並び順を更新する */
export function reorderArrows(ids: number[]): void {
  const db = getDatabase()
  const update = db.prepare('UPDATE arrow SET sort_order = ? WHERE id = ?')
  db.transaction(() => {
    ids.forEach((id, index) => {
      update.run(index, id)
    })
  })()
}
