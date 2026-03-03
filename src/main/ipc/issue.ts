import { ipcMain } from 'electron'
import type { IssueCreateArgs, IssueUpdateArgs } from '../../shared/types/ipc'
import { createIssue, deleteIssue, listIssues, updateIssue } from '../service/issue'

/** 課題関連の IPC ハンドラを登録する */
export function registerIssueHandlers(): void {
  ipcMain.handle('issue:list', (_e, args: { projectId: number }) => {
    return listIssues(args.projectId)
  })

  ipcMain.handle('issue:create', (_e, args: IssueCreateArgs) => {
    return createIssue(args)
  })

  ipcMain.handle('issue:update', (_e, args: IssueUpdateArgs) => {
    return updateIssue(args)
  })

  ipcMain.handle('issue:delete', (_e, args: { id: number }) => {
    return deleteIssue(args.id)
  })
}
