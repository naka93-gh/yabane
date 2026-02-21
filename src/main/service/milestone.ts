import { getDatabase } from '../database'

/** マイルストーン一覧を取得する */
export function listMilestones(projectId: number): unknown[] {
  const db = getDatabase()
  return db
    .prepare('SELECT * FROM milestone WHERE project_id = ? ORDER BY sort_order, id')
    .all(projectId)
}

/** マイルストーンを作成する */
export function createMilestone(args: {
  projectId: number
  name: string
  description?: string
  dueDate?: string
  color?: string
}): unknown {
  const db = getDatabase()

  const maxOrder = db
    .prepare(
      'SELECT COALESCE(MAX(sort_order), -1) as max_order FROM milestone WHERE project_id = ?'
    )
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

/** マイルストーンを更新する */
export function updateMilestone(args: {
  id: number
  name?: string
  description?: string
  dueDate?: string
  color?: string
}): unknown {
  const db = getDatabase()

  const milestone = db.prepare('SELECT * FROM milestone WHERE id = ?').get(args.id) as
    | { name: string; description: string | null; due_date: string | null; color: string }
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

/** マイルストーンを削除する */
export function deleteMilestone(id: number): unknown {
  const db = getDatabase()
  return db.prepare('DELETE FROM milestone WHERE id = ? RETURNING *').get(id)
}

/** マイルストーンの並び順を更新する */
export function reorderMilestones(ids: number[]): void {
  const db = getDatabase()
  const update = db.prepare('UPDATE milestone SET sort_order = ? WHERE id = ?')
  db.transaction(() => {
    ids.forEach((id, index) => {
      update.run(index, id)
    })
  })()
}
