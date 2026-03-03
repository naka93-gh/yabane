import { ipcMain } from 'electron'
import type {
  IssueTagCreateArgs,
  IssueTagSyncArgs,
  IssueTagUpdateArgs
} from '../../shared/types/ipc'
import {
  createIssueTag,
  deleteIssueTag,
  listIssueTagMap,
  listIssueTags,
  syncIssueTagMap,
  updateIssueTag
} from '../service/issue-tag'

/** 課題タグ関連の IPC ハンドラを登録する */
export function registerIssueTagHandlers(): void {
  ipcMain.handle('issue-tag:list', (_e, args: { projectId: number }) => {
    return listIssueTags(args.projectId)
  })

  ipcMain.handle('issue-tag:create', (_e, args: IssueTagCreateArgs) => {
    return createIssueTag(args)
  })

  ipcMain.handle('issue-tag:update', (_e, args: IssueTagUpdateArgs) => {
    return updateIssueTag(args)
  })

  ipcMain.handle('issue-tag:delete', (_e, args: { id: number }) => {
    return deleteIssueTag(args.id)
  })

  ipcMain.handle('issue-tag:listMap', (_e, args: { projectId: number }) => {
    return listIssueTagMap(args.projectId)
  })

  ipcMain.handle('issue-tag:syncMap', (_e, args: IssueTagSyncArgs) => {
    return syncIssueTagMap(args)
  })
}
