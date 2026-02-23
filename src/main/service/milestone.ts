import { getDatabase } from '../database'
import type { Milestone } from '../../shared/types/models'
import type { MilestoneCreateArgs, MilestoneUpdateArgs } from '../../shared/types/ipc'
import { reorderRows, nextSortOrder } from './common'

/** マイルストーン一覧を取得する */
export function listMilestones(projectId: number): Milestone[] {
  const db = getDatabase()
  return db
    .prepare('SELECT * FROM milestone WHERE project_id = ? ORDER BY sort_order, id')
    .all(projectId) as Milestone[]
}

/** マイルストーンを作成する */
export function createMilestone(args: MilestoneCreateArgs): Milestone {
  const db = getDatabase()
  const sortOrder = nextSortOrder('milestone', 'project_id = ?', [args.projectId])

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
      sortOrder
    ) as Milestone
}

/** マイルストーンを更新する */
export function updateMilestone(args: MilestoneUpdateArgs): Milestone | null {
  const db = getDatabase()

  const milestone = db.prepare('SELECT * FROM milestone WHERE id = ?').get(args.id) as
    | Milestone
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
    .get(name, description, dueDate, color, args.id) as Milestone
}

/** マイルストーンを削除する */
export function deleteMilestone(id: number): Milestone | undefined {
  const db = getDatabase()
  return db.prepare('DELETE FROM milestone WHERE id = ? RETURNING *').get(id) as
    | Milestone
    | undefined
}

/** マイルストーンの並び順を更新する */
export function reorderMilestones(ids: number[]): void {
  reorderRows('milestone', ids)
}
