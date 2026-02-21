import { ipcMain } from 'electron'
import { listIssues, createIssue, updateIssue, deleteIssue } from '../service/issue'

export function registerIssueHandlers(): void {
  ipcMain.handle('issue:list', (_e, args: { projectId: number }) => {
    return listIssues(args.projectId)
  })

  ipcMain.handle(
    'issue:create',
    (
      _e,
      args: {
        projectId: number
        title: string
        description?: string
        owner?: string
        priority?: string
        status?: string
        dueDate?: string
      }
    ) => {
      return createIssue(args)
    }
  )

  ipcMain.handle(
    'issue:update',
    (
      _e,
      args: {
        id: number
        title?: string
        description?: string
        owner?: string
        priority?: string
        status?: string
        dueDate?: string
        resolution?: string
      }
    ) => {
      return updateIssue(args)
    }
  )

  ipcMain.handle('issue:delete', (_e, args: { id: number }) => {
    return deleteIssue(args.id)
  })
}
