import { ElectronAPI } from '@electron-toolkit/preload'
import type { Project, Purpose, Milestone, Arrow, WbsItem, Issue } from '../shared/types/models'

interface ProjectAPI {
  list(args?: { status?: Project['status'] }): Promise<Project[]>
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

interface ArrowAPI {
  list(args: { projectId: number }): Promise<Arrow[]>
  create(args: {
    projectId: number
    parentId?: number
    name: string
    startDate?: string
    endDate?: string
    owner?: string
    status?: Arrow['status']
  }): Promise<Arrow>
  update(args: {
    id: number
    name?: string
    startDate?: string
    endDate?: string
    owner?: string
    status?: Arrow['status']
    parentId?: number | null
  }): Promise<Arrow>
  delete(args: { id: number }): Promise<Arrow>
  reorder(args: { ids: number[] }): Promise<void>
}

interface WbsItemAPI {
  list(args: { projectId: number }): Promise<WbsItem[]>
  create(args: {
    arrowId: number
    name: string
    startDate?: string
    endDate?: string
    owner?: string
    status?: WbsItem['status']
    progress?: number
    estimatedHours?: number
  }): Promise<WbsItem>
  update(args: {
    id: number
    arrowId?: number
    name?: string
    startDate?: string
    endDate?: string
    owner?: string
    status?: WbsItem['status']
    progress?: number
    estimatedHours?: number
    actualHours?: number
  }): Promise<WbsItem>
  delete(args: { id: number }): Promise<WbsItem>
  reorder(args: { ids: number[] }): Promise<void>
}

interface IssueAPI {
  list(args: { projectId: number }): Promise<Issue[]>
  create(args: {
    projectId: number
    title: string
    description?: string
    owner?: string
    priority?: Issue['priority']
    status?: Issue['status']
    dueDate?: string
  }): Promise<Issue>
  update(args: {
    id: number
    title?: string
    description?: string
    owner?: string
    priority?: Issue['priority']
    status?: Issue['status']
    dueDate?: string
    resolution?: string
  }): Promise<Issue>
  delete(args: { id: number }): Promise<Issue>
}

interface ExportAPI {
  saveExcel(args: {
    buffer: number[]
    defaultName: string
  }): Promise<{ canceled: boolean; filePath?: string }>
}

interface Api {
  project: ProjectAPI
  purpose: PurposeAPI
  milestone: MilestoneAPI
  arrow: ArrowAPI
  wbs: WbsItemAPI
  issue: IssueAPI
  export: ExportAPI
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
