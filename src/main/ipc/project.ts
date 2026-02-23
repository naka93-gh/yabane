import { ipcMain } from 'electron'
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  archiveProject,
  unarchiveProject,
  getProjectSummary
} from '../service/project'
import type { ProjectListArgs, ProjectCreateArgs, ProjectUpdateArgs } from '../../shared/types/ipc'

/** プロジェクト関連の IPC ハンドラを登録する */
export function registerProjectHandlers(): void {
  ipcMain.handle('project:list', (_e, args: ProjectListArgs) => {
    return listProjects(args?.status)
  })

  ipcMain.handle('project:get', (_e, args: { id: number }) => {
    return getProject(args.id)
  })

  ipcMain.handle('project:create', (_e, args: ProjectCreateArgs) => {
    return createProject(args.name, args.description)
  })

  ipcMain.handle('project:update', (_e, args: ProjectUpdateArgs) => {
    return updateProject(args)
  })

  ipcMain.handle('project:archive', (_e, args: { id: number }) => {
    return archiveProject(args.id)
  })

  ipcMain.handle('project:unarchive', (_e, args: { id: number }) => {
    return unarchiveProject(args.id)
  })

  ipcMain.handle('project:summary', (_e, args: { projectId: number }) => {
    return getProjectSummary(args.projectId)
  })
}
