import type { Milestone } from '../types/models'

/** マイルストーン一覧を取得する */
export function listMilestones(args: { projectId: number }): Promise<Milestone[]> {
  return window.api.milestone.list(args)
}

/** マイルストーンを作成する */
export function createMilestone(args: {
  projectId: number
  name: string
  description?: string
  dueDate?: string
  color?: string
}): Promise<Milestone> {
  return window.api.milestone.create(args)
}

/** マイルストーンを更新する */
export function updateMilestone(args: {
  id: number
  name?: string
  description?: string
  dueDate?: string
  color?: string
}): Promise<Milestone> {
  return window.api.milestone.update(args)
}

/** マイルストーンを削除する */
export function deleteMilestone(args: { id: number }): Promise<Milestone> {
  return window.api.milestone.delete(args)
}

/** マイルストーンの並び順を更新する */
export function reorderMilestones(args: { ids: number[] }): Promise<void> {
  return window.api.milestone.reorder(args)
}
