import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

/** renderer に公開する IPC ブリッジ */
const api = {
  project: {
    list: (args?: { status?: 'active' | 'archived' }) =>
      ipcRenderer.invoke('project:list', args ?? {}),
    get: (args: { id: number }) => ipcRenderer.invoke('project:get', args),
    create: (args: { name: string; description?: string }) =>
      ipcRenderer.invoke('project:create', args),
    update: (args: { id: number; name?: string; description?: string }) =>
      ipcRenderer.invoke('project:update', args),
    archive: (args: { id: number }) => ipcRenderer.invoke('project:archive', args),
    unarchive: (args: { id: number }) => ipcRenderer.invoke('project:unarchive', args)
  },
  purpose: {
    get: (args: { projectId: number }) => ipcRenderer.invoke('purpose:get', args),
    save: (args: {
      projectId: number
      background?: string
      objective?: string
      scope?: string
      out_of_scope?: string
      assumption?: string
    }) => ipcRenderer.invoke('purpose:save', args)
  },
  milestone: {
    list: (args: { projectId: number }) => ipcRenderer.invoke('milestone:list', args),
    create: (args: {
      projectId: number
      name: string
      description?: string
      dueDate?: string
      color?: string
    }) => ipcRenderer.invoke('milestone:create', args),
    update: (args: {
      id: number
      name?: string
      description?: string
      dueDate?: string
      color?: string
    }) => ipcRenderer.invoke('milestone:update', args),
    delete: (args: { id: number }) => ipcRenderer.invoke('milestone:delete', args),
    reorder: (args: { ids: number[] }) => ipcRenderer.invoke('milestone:reorder', args)
  },
  arrow: {
    list: (args: { projectId: number }) => ipcRenderer.invoke('arrow:list', args),
    create: (args: {
      projectId: number
      parentId?: number
      name: string
      startDate?: string
      endDate?: string
      owner?: string
      status?: string
    }) => ipcRenderer.invoke('arrow:create', args),
    update: (args: {
      id: number
      name?: string
      startDate?: string
      endDate?: string
      owner?: string
      status?: string
      parentId?: number | null
    }) => ipcRenderer.invoke('arrow:update', args),
    delete: (args: { id: number }) => ipcRenderer.invoke('arrow:delete', args),
    reorder: (args: { ids: number[] }) => ipcRenderer.invoke('arrow:reorder', args)
  },
  wbs: {
    list: (args: { projectId: number }) => ipcRenderer.invoke('wbs:list', args),
    create: (args: {
      arrowId: number
      name: string
      startDate?: string
      endDate?: string
      owner?: string
      status?: string
      progress?: number
      estimatedHours?: number
    }) => ipcRenderer.invoke('wbs:create', args),
    update: (args: {
      id: number
      arrowId?: number
      name?: string
      startDate?: string
      endDate?: string
      owner?: string
      status?: string
      progress?: number
      estimatedHours?: number
      actualHours?: number
    }) => ipcRenderer.invoke('wbs:update', args),
    delete: (args: { id: number }) => ipcRenderer.invoke('wbs:delete', args),
    reorder: (args: { ids: number[] }) => ipcRenderer.invoke('wbs:reorder', args)
  },
  issue: {
    list: (args: { projectId: number }) => ipcRenderer.invoke('issue:list', args),
    create: (args: {
      projectId: number
      title: string
      description?: string
      owner?: string
      priority?: string
      status?: string
      dueDate?: string
    }) => ipcRenderer.invoke('issue:create', args),
    update: (args: {
      id: number
      title?: string
      description?: string
      owner?: string
      priority?: string
      status?: string
      dueDate?: string
      resolution?: string
    }) => ipcRenderer.invoke('issue:update', args),
    delete: (args: { id: number }) => ipcRenderer.invoke('issue:delete', args)
  },
  export: {
    saveExcel: (args: { buffer: number[]; defaultName: string }) =>
      ipcRenderer.invoke('export:saveExcel', args)
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
