import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

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
