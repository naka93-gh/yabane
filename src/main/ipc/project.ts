import { ipcMain } from 'electron'
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  archiveProject,
  unarchiveProject
} from '../service/project'

/** プロジェクト関連の IPC ハンドラを登録する */
export function registerProjectHandlers(): void {
  ipcMain.handle('project:list', (_e, args: { status?: 'active' | 'archived' }) => {
    return listProjects(args?.status)
  })

  ipcMain.handle('project:get', (_e, args: { id: number }) => {
    return getProject(args.id)
  })

  ipcMain.handle('project:create', (_e, args: { name: string; description?: string }) => {
    return createProject(args.name, args.description)
  })

  ipcMain.handle(
    'project:update',
    (_e, args: { id: number; name?: string; description?: string }) => {
      return updateProject(args)
    }
  )

  ipcMain.handle('project:archive', (_e, args: { id: number }) => {
    return archiveProject(args.id)
  })

  ipcMain.handle('project:unarchive', (_e, args: { id: number }) => {
    return unarchiveProject(args.id)
  })
}
