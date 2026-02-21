import type { Purpose } from '../types/models'

export function getPurpose(args: { projectId: number }): Promise<Purpose | null> {
  return window.api.purpose.get(args)
}

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
