import type { IssueTagCreateArgs, IssueTagSyncArgs, IssueTagUpdateArgs } from '@shared/types/ipc'
import type { IssueTag } from '@shared/types/models'

/** 課題タグ一覧を取得する */
export function listIssueTags(args: { projectId: number }): Promise<IssueTag[]> {
  return window.api.issueTag.list(args)
}

/** 課題タグを作成する */
export function createIssueTag(args: IssueTagCreateArgs): Promise<IssueTag> {
  return window.api.issueTag.create(args)
}

/** 課題タグを更新する */
export function updateIssueTag(args: IssueTagUpdateArgs): Promise<IssueTag> {
  return window.api.issueTag.update(args)
}

/** 課題タグを削除する */
export function deleteIssueTag(args: { id: number }): Promise<IssueTag> {
  return window.api.issueTag.delete(args)
}

/** 課題タグマッピング一覧を取得する */
export function listIssueTagMap(args: {
  projectId: number
}): Promise<{ issue_id: number; tag_id: number }[]> {
  return window.api.issueTag.listMap(args)
}

/** 課題タグマッピングを同期する */
export function syncIssueTagMap(args: IssueTagSyncArgs): Promise<void> {
  return window.api.issueTag.syncMap(args)
}
