import { ElectronAPI } from '@electron-toolkit/preload'
import type {
  Project,
  Purpose,
  PurposeHistory,
  Milestone,
  Arrow,
  WbsItem,
  Issue,
  IssueComment,
  IssueTag,
  Member
} from '../shared/types/models'
import type {
  ProjectListArgs,
  ProjectCreateArgs,
  ProjectUpdateArgs,
  ProjectSummary,
  PurposeSaveArgs,
  MilestoneCreateArgs,
  MilestoneUpdateArgs,
  ArrowCreateArgs,
  ArrowUpdateArgs,
  WbsCreateArgs,
  WbsUpdateArgs,
  IssueCreateArgs,
  IssueUpdateArgs,
  IssueCommentCreateArgs,
  IssueTagCreateArgs,
  IssueTagSyncArgs,
  IssueTagUpdateArgs,
  MemberCreateArgs,
  MemberUpdateArgs,
  ExportSaveArgs,
  CsvSaveArgs,
  CsvOpenResult
} from '../shared/types/ipc'

interface ProjectAPI {
  list(args?: ProjectListArgs): Promise<Project[]>
  get(args: { id: number }): Promise<Project | null>
  create(args: ProjectCreateArgs): Promise<Project>
  update(args: ProjectUpdateArgs): Promise<Project>
  archive(args: { id: number }): Promise<Project>
  unarchive(args: { id: number }): Promise<Project>
  summary(args: { projectId: number }): Promise<ProjectSummary>
}

interface PurposeAPI {
  get(args: { projectId: number }): Promise<Purpose | null>
  save(args: PurposeSaveArgs): Promise<Purpose>
  history(args: { projectId: number }): Promise<PurposeHistory[]>
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

interface IssueCommentAPI {
  list(args: { issueId: number }): Promise<IssueComment[]>
  create(args: IssueCommentCreateArgs): Promise<IssueComment>
  delete(args: { id: number }): Promise<IssueComment>
}

interface IssueTagAPI {
  list(args: { projectId: number }): Promise<IssueTag[]>
  create(args: IssueTagCreateArgs): Promise<IssueTag>
  update(args: IssueTagUpdateArgs): Promise<IssueTag>
  delete(args: { id: number }): Promise<IssueTag>
  listMap(args: { projectId: number }): Promise<{ issue_id: number; tag_id: number }[]>
  syncMap(args: IssueTagSyncArgs): Promise<void>
}

interface MemberAPI {
  list(args: { projectId: number; archived?: number }): Promise<Member[]>
  create(args: MemberCreateArgs): Promise<Member>
  update(args: MemberUpdateArgs): Promise<Member>
  delete(args: { id: number }): Promise<Member>
  archive(args: { id: number }): Promise<Member>
  unarchive(args: { id: number }): Promise<Member>
  reorder(args: { ids: number[] }): Promise<void>
}

interface ExportAPI {
  saveExcel(args: ExportSaveArgs): Promise<{ canceled: boolean; filePath?: string }>
  saveCsv(args: CsvSaveArgs): Promise<{ canceled: boolean; filePath?: string }>
}

interface ImportAPI {
  openCsv(): Promise<CsvOpenResult>
}

interface Api {
  project: ProjectAPI
  purpose: PurposeAPI
  milestone: MilestoneAPI
  arrow: ArrowAPI
  wbs: WbsItemAPI
  issue: IssueAPI
  issueComment: IssueCommentAPI
  issueTag: IssueTagAPI
  member: MemberAPI
  export: ExportAPI
  import: ImportAPI
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
