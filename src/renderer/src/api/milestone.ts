import type { Milestone } from '../types/models'

export function listMilestones(args: { projectId: number }): Promise<Milestone[]> {
  return window.api.milestone.list(args)
}

export function createMilestone(args: {
  projectId: number
  name: string
  description?: string
  dueDate?: string
  color?: string
}): Promise<Milestone> {
  return window.api.milestone.create(args)
}

export function updateMilestone(args: {
  id: number
  name?: string
  description?: string
  dueDate?: string
  color?: string
}): Promise<Milestone> {
  return window.api.milestone.update(args)
}

export function deleteMilestone(args: { id: number }): Promise<Milestone> {
  return window.api.milestone.delete(args)
}

export function reorderMilestones(args: { ids: number[] }): Promise<void> {
  return window.api.milestone.reorder(args)
}
