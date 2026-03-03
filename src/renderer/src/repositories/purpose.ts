import type { PurposeSaveArgs } from '@shared/types/ipc'
import type { Purpose, PurposeHistory } from '@shared/types/models'

/** プロジェクトの目的を取得する */
export function getPurpose(args: { projectId: number }): Promise<Purpose | null> {
  return window.api.purpose.get(args)
}

/** プロジェクトの目的を保存する */
export function savePurpose(args: PurposeSaveArgs): Promise<Purpose> {
  return window.api.purpose.save(args)
}

/** 目的の変更履歴を取得する */
export function getPurposeHistory(args: { projectId: number }): Promise<PurposeHistory[]> {
  return window.api.purpose.history(args)
}
