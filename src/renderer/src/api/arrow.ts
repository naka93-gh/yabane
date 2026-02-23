import type { Arrow } from '@shared/types/models'
import type { ArrowCreateArgs, ArrowUpdateArgs } from '@shared/types/ipc'

/** 矢羽一覧を取得する */
export function listArrows(args: { projectId: number }): Promise<Arrow[]> {
  return window.api.arrow.list(args)
}

/** 矢羽を作成する */
export function createArrow(args: ArrowCreateArgs): Promise<Arrow> {
  return window.api.arrow.create(args)
}

/** 矢羽を更新する */
export function updateArrow(args: ArrowUpdateArgs): Promise<Arrow> {
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
