import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'
import type {
  ArrowCreateArgs,
  ArrowUpdateArgs,
  CsvSaveArgs,
  ExportSaveArgs,
  IssueCommentCreateArgs,
  IssueCreateArgs,
  IssueTagCreateArgs,
  IssueTagSyncArgs,
  IssueTagUpdateArgs,
  IssueUpdateArgs,
  MemberCreateArgs,
  MemberUpdateArgs,
  MilestoneCreateArgs,
  MilestoneUpdateArgs,
  ProjectCreateArgs,
  ProjectListArgs,
  ProjectUpdateArgs,
  PurposeSaveArgs,
  WbsCreateArgs,
  WbsUpdateArgs
} from '../shared/types/ipc'

/** renderer に公開する IPC ブリッジ */
const api = {
  project: {
    list: (args?: ProjectListArgs) => ipcRenderer.invoke('project:list', args ?? {}),
    get: (args: { id: number }) => ipcRenderer.invoke('project:get', args),
    create: (args: ProjectCreateArgs) => ipcRenderer.invoke('project:create', args),
    update: (args: ProjectUpdateArgs) => ipcRenderer.invoke('project:update', args),
    archive: (args: { id: number }) => ipcRenderer.invoke('project:archive', args),
    unarchive: (args: { id: number }) => ipcRenderer.invoke('project:unarchive', args),
    summary: (args: { projectId: number }) => ipcRenderer.invoke('project:summary', args)
  },
  purpose: {
    get: (args: { projectId: number }) => ipcRenderer.invoke('purpose:get', args),
    save: (args: PurposeSaveArgs) => ipcRenderer.invoke('purpose:save', args),
    history: (args: { projectId: number }) => ipcRenderer.invoke('purpose:history', args)
  },
  milestone: {
    list: (args: { projectId: number }) => ipcRenderer.invoke('milestone:list', args),
    create: (args: MilestoneCreateArgs) => ipcRenderer.invoke('milestone:create', args),
    update: (args: MilestoneUpdateArgs) => ipcRenderer.invoke('milestone:update', args),
    delete: (args: { id: number }) => ipcRenderer.invoke('milestone:delete', args),
    reorder: (args: { ids: number[] }) => ipcRenderer.invoke('milestone:reorder', args)
  },
  arrow: {
    list: (args: { projectId: number }) => ipcRenderer.invoke('arrow:list', args),
    create: (args: ArrowCreateArgs) => ipcRenderer.invoke('arrow:create', args),
    update: (args: ArrowUpdateArgs) => ipcRenderer.invoke('arrow:update', args),
    delete: (args: { id: number }) => ipcRenderer.invoke('arrow:delete', args),
    reorder: (args: { ids: number[] }) => ipcRenderer.invoke('arrow:reorder', args)
  },
  wbs: {
    list: (args: { projectId: number }) => ipcRenderer.invoke('wbs:list', args),
    create: (args: WbsCreateArgs) => ipcRenderer.invoke('wbs:create', args),
    update: (args: WbsUpdateArgs) => ipcRenderer.invoke('wbs:update', args),
    delete: (args: { id: number }) => ipcRenderer.invoke('wbs:delete', args),
    reorder: (args: { ids: number[] }) => ipcRenderer.invoke('wbs:reorder', args)
  },
  issue: {
    list: (args: { projectId: number }) => ipcRenderer.invoke('issue:list', args),
    create: (args: IssueCreateArgs) => ipcRenderer.invoke('issue:create', args),
    update: (args: IssueUpdateArgs) => ipcRenderer.invoke('issue:update', args),
    delete: (args: { id: number }) => ipcRenderer.invoke('issue:delete', args)
  },
  issueComment: {
    list: (args: { issueId: number }) => ipcRenderer.invoke('issue-comment:list', args),
    create: (args: IssueCommentCreateArgs) => ipcRenderer.invoke('issue-comment:create', args),
    delete: (args: { id: number }) => ipcRenderer.invoke('issue-comment:delete', args)
  },
  issueTag: {
    list: (args: { projectId: number }) => ipcRenderer.invoke('issue-tag:list', args),
    create: (args: IssueTagCreateArgs) => ipcRenderer.invoke('issue-tag:create', args),
    update: (args: IssueTagUpdateArgs) => ipcRenderer.invoke('issue-tag:update', args),
    delete: (args: { id: number }) => ipcRenderer.invoke('issue-tag:delete', args),
    listMap: (args: { projectId: number }) => ipcRenderer.invoke('issue-tag:listMap', args),
    syncMap: (args: IssueTagSyncArgs) => ipcRenderer.invoke('issue-tag:syncMap', args)
  },
  member: {
    list: (args: { projectId: number; archived?: number }) =>
      ipcRenderer.invoke('member:list', args),
    create: (args: MemberCreateArgs) => ipcRenderer.invoke('member:create', args),
    update: (args: MemberUpdateArgs) => ipcRenderer.invoke('member:update', args),
    delete: (args: { id: number }) => ipcRenderer.invoke('member:delete', args),
    archive: (args: { id: number }) => ipcRenderer.invoke('member:archive', args),
    unarchive: (args: { id: number }) => ipcRenderer.invoke('member:unarchive', args),
    reorder: (args: { ids: number[] }) => ipcRenderer.invoke('member:reorder', args)
  },
  export: {
    saveExcel: (args: ExportSaveArgs) => ipcRenderer.invoke('export:saveExcel', args),
    saveCsv: (args: CsvSaveArgs) => ipcRenderer.invoke('export:saveCsv', args)
  },
  import: {
    openCsv: () => ipcRenderer.invoke('import:openCsv')
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error (define in dts)
  window.electron = electronAPI
  // @ts-expect-error (define in dts)
  window.api = api
}
