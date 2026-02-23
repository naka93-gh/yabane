import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
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
  MemberCreateArgs,
  MemberUpdateArgs,
  ExportSaveArgs,
  CsvSaveArgs
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
    save: (args: PurposeSaveArgs) => ipcRenderer.invoke('purpose:save', args)
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
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
