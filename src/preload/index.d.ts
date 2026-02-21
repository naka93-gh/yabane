import { ElectronAPI } from '@electron-toolkit/preload'
import type { Project, Purpose, Milestone } from '../renderer/src/types/models'

interface ProjectAPI {
  list(args?: { status?: 'active' | 'archived' }): Promise<Project[]>
  get(args: { id: number }): Promise<Project | null>
  create(args: { name: string; description?: string }): Promise<Project>
  update(args: { id: number; name?: string; description?: string }): Promise<Project>
  archive(args: { id: number }): Promise<Project>
  unarchive(args: { id: number }): Promise<Project>
}

interface PurposeAPI {
  get(args: { projectId: number }): Promise<Purpose | null>
  save(args: {
    projectId: number
    background?: string
    objective?: string
    scope?: string
    out_of_scope?: string
    assumption?: string
  }): Promise<Purpose>
}

interface MilestoneAPI {
  list(args: { projectId: number }): Promise<Milestone[]>
  create(args: {
    projectId: number
    name: string
    description?: string
    dueDate?: string
    color?: string
  }): Promise<Milestone>
  update(args: {
    id: number
    name?: string
    description?: string
    dueDate?: string
    color?: string
  }): Promise<Milestone>
  delete(args: { id: number }): Promise<Milestone>
  reorder(args: { ids: number[] }): Promise<void>
}

interface Api {
  project: ProjectAPI
  purpose: PurposeAPI
  milestone: MilestoneAPI
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
