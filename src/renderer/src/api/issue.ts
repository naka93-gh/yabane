import type { Issue } from '../types/models'

export function listIssues(args: { projectId: number }): Promise<Issue[]> {
  return window.api.issue.list(args)
}

export function createIssue(args: {
  projectId: number
  title: string
  description?: string
  owner?: string
  priority?: string
  status?: string
  dueDate?: string
}): Promise<Issue> {
  return window.api.issue.create(args)
}

export function updateIssue(args: {
  id: number
  title?: string
  description?: string
  owner?: string
  priority?: string
  status?: string
  dueDate?: string
  resolution?: string
}): Promise<Issue> {
  return window.api.issue.update(args)
}

export function deleteIssue(args: { id: number }): Promise<Issue> {
  return window.api.issue.delete(args)
}
