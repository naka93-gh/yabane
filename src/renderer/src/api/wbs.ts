import type { WbsItem } from '@shared/types/models'
import type { WbsCreateArgs, WbsUpdateArgs } from '@shared/types/ipc'

/** WBS 一覧を取得する */
export function listWbsItems(args: { projectId: number }): Promise<WbsItem[]> {
  return window.api.wbs.list(args)
}

/** WBS を作成する */
export function createWbsItem(args: WbsCreateArgs): Promise<WbsItem> {
  return window.api.wbs.create(args)
}

/** WBS を更新する */
export function updateWbsItem(args: WbsUpdateArgs): Promise<WbsItem> {
  return window.api.wbs.update(args)
}

/** WBS を削除する */
export function deleteWbsItem(args: { id: number }): Promise<WbsItem> {
  return window.api.wbs.delete(args)
}

/** WBS の並び順を更新する */
export function reorderWbsItems(args: { ids: number[] }): Promise<void> {
  return window.api.wbs.reorder(args)
}
