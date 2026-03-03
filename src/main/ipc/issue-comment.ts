import { ipcMain } from 'electron'
import type { IssueCommentCreateArgs } from '../../shared/types/ipc'
import { createIssueComment, deleteIssueComment, listIssueComments } from '../service/issue-comment'

/** 課題コメント関連の IPC ハンドラを登録する */
export function registerIssueCommentHandlers(): void {
  ipcMain.handle('issue-comment:list', (_e, args: { issueId: number }) => {
    return listIssueComments(args.issueId)
  })

  ipcMain.handle('issue-comment:create', (_e, args: IssueCommentCreateArgs) => {
    return createIssueComment(args)
  })

  ipcMain.handle('issue-comment:delete', (_e, args: { id: number }) => {
    return deleteIssueComment(args.id)
  })
}
