import { ElectronAPI } from '@electron-toolkit/preload'
import type { Project, Purpose, Milestone, Arrow, WbsItem, Issue } from '../shared/types/models'
import type {
  ProjectListArgs,
  ProjectCreateArgs,
  ProjectUpdateArgs,
  PurposeSaveArgs,
  MilestoneCreateArgs,
  MilestoneUpdateArgs,
  ArrowCreateArgs,
  ArrowUpdateArgs,
  WbsCreateArgs,
  WbsUpdateArgs,
  IssueCreateArgs,
  IssueUpdateArgs,
  ExportSaveArgs
} from '../shared/types/ipc'

interface ProjectAPI {
  list(args?: ProjectListArgs): Promise<Project[]>
  get(args: { id: number }): Promise<Project | null>
  create(args: ProjectCreateArgs): Promise<Project>
  update(args: ProjectUpdateArgs): Promise<Project>
  archive(args: { id: number }): Promise<Project>
  unarchive(args: { id: number }): Promise<Project>
}

interface PurposeAPI {
  get(args: { projectId: number }): Promise<Purpose | null>
  save(args: PurposeSaveArgs): Promise<Purpose>
}

interface MilestoneAPI {
  list(args: { projectId: number }): Promise<Milestone[]>
  create(args: MilestoneCreateArgs): Promise<Milestone>
  update(args: MilestoneUpdateArgs): Promise<Milestone>
  delete(args: { id: number }): Promise<Milestone>
  reorder(args: { ids: number[] }): Promise<void>
}

interface ArrowAPI {
  list(args: { projectId: number }): Promise<Arrow[]>
  create(args: ArrowCreateArgs): Promise<Arrow>
  update(args: ArrowUpdateArgs): Promise<Arrow>
  delete(args: { id: number }): Promise<Arrow>
  reorder(args: { ids: number[] }): Promise<void>
}

interface WbsItemAPI {
  list(args: { projectId: number }): Promise<WbsItem[]>
  create(args: WbsCreateArgs): Promise<WbsItem>
  update(args: WbsUpdateArgs): Promise<WbsItem>
  delete(args: { id: number }): Promise<WbsItem>
  reorder(args: { ids: number[] }): Promise<void>
}

interface IssueAPI {
  list(args: { projectId: number }): Promise<Issue[]>
  create(args: IssueCreateArgs): Promise<Issue>
  update(args: IssueUpdateArgs): Promise<Issue>
  delete(args: { id: number }): Promise<Issue>
}

interface ExportAPI {
  saveExcel(args: ExportSaveArgs): Promise<{ canceled: boolean; filePath?: string }>
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
