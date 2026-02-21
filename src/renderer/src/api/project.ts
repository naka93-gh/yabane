import type { Project } from '../types/models'

export function listProjects(args?: { status?: 'active' | 'archived' }): Promise<Project[]> {
  return window.api.project.list(args)
}

export function getProject(args: { id: number }): Promise<Project | null> {
  return window.api.project.get(args)
}

export function createProject(args: { name: string; description?: string }): Promise<Project> {
  return window.api.project.create(args)
}

export function updateProject(args: {
  id: number
  name?: string
  description?: string
}): Promise<Project> {
  return window.api.project.update(args)
}

export function archiveProject(args: { id: number }): Promise<Project> {
  return window.api.project.archive(args)
}

export function unarchiveProject(args: { id: number }): Promise<Project> {
  return window.api.project.unarchive(args)
}
