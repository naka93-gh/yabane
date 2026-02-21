import { ElectronAPI } from '@electron-toolkit/preload'
import type { Project } from '../renderer/src/types/models'

interface ProjectAPI {
  list(args?: { status?: 'active' | 'archived' }): Promise<Project[]>
  get(args: { id: number }): Promise<Project | null>
  create(args: { name: string; description?: string }): Promise<Project>
  update(args: { id: number; name?: string; description?: string }): Promise<Project>
  archive(args: { id: number }): Promise<Project>
  unarchive(args: { id: number }): Promise<Project>
}

interface Api {
  project: ProjectAPI
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
