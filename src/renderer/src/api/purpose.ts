import type { Purpose } from '../types/models'

/** プロジェクトの目的を取得する */
export function getPurpose(args: { projectId: number }): Promise<Purpose | null> {
  return window.api.purpose.get(args)
}

/** プロジェクトの目的を保存する */
export function savePurpose(args: {
  projectId: number
  background?: string
  objective?: string
  scope?: string
  out_of_scope?: string
  assumption?: string
}): Promise<Purpose> {
  return window.api.purpose.save(args)
}
