import type { WbsItem } from '../types/models'

export function listWbsItems(args: { projectId: number }): Promise<WbsItem[]> {
  return window.api.wbs.list(args)
}

export function createWbsItem(args: {
  arrowId: number
  name: string
  startDate?: string
  endDate?: string
  owner?: string
  status?: string
  progress?: number
  estimatedHours?: number
}): Promise<WbsItem> {
  return window.api.wbs.create(args)
}

export function updateWbsItem(args: {
  id: number
  arrowId?: number
  name?: string
  startDate?: string
  endDate?: string
  owner?: string
  status?: string
  progress?: number
  estimatedHours?: number
  actualHours?: number
}): Promise<WbsItem> {
  return window.api.wbs.update(args)
}

export function deleteWbsItem(args: { id: number }): Promise<WbsItem> {
  return window.api.wbs.delete(args)
}

export function reorderWbsItems(args: { ids: number[] }): Promise<void> {
  return window.api.wbs.reorder(args)
}
