import type { Arrow } from '../types/models'

export function listArrows(args: { projectId: number }): Promise<Arrow[]> {
  return window.api.arrow.list(args)
}

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

export function deleteArrow(args: { id: number }): Promise<Arrow> {
  return window.api.arrow.delete(args)
}

export function reorderArrows(args: { ids: number[] }): Promise<void> {
  return window.api.arrow.reorder(args)
}
