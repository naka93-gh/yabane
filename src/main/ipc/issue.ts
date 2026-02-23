import { ipcMain } from 'electron'
import { listIssues, createIssue, updateIssue, deleteIssue } from '../service/issue'
import type { IssueCreateArgs, IssueUpdateArgs } from '../../shared/types/ipc'

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
