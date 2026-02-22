import type { Arrow } from '../types/models'

/** 矢羽一覧を取得する */
export function listArrows(args: { projectId: number }): Promise<Arrow[]> {
  return window.api.arrow.list(args)
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
}): Promise<Arrow> {
  return window.api.arrow.create(args)
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
}): Promise<Arrow> {
  return window.api.arrow.update(args)
}

/** 矢羽を削除する */
export function deleteArrow(args: { id: number }): Promise<Arrow> {
  return window.api.arrow.delete(args)
}

/** 矢羽の並び順を更新する */
export function reorderArrows(args: { ids: number[] }): Promise<void> {
  return window.api.arrow.reorder(args)
}
