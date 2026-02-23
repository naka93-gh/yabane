import type { Purpose } from '@shared/types/models'
import type { PurposeSaveArgs } from '@shared/types/ipc'

/** プロジェクトの目的を取得する */
export function getPurpose(args: { projectId: number }): Promise<Purpose | null> {
  return window.api.purpose.get(args)
}

/** プロジェクトの目的を保存する */
export function savePurpose(args: PurposeSaveArgs): Promise<Purpose> {
  return window.api.purpose.save(args)
}
