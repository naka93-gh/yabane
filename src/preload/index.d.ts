import { ElectronAPI } from '@electron-toolkit/preload'
import type { Project, Purpose } from '../renderer/src/types/models'

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

interface Api {
  project: ProjectAPI
  purpose: PurposeAPI
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
