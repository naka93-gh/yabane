import type { IssueCommentCreateArgs } from '@shared/types/ipc'
import type { IssueComment } from '@shared/types/models'

/** 課題コメント一覧を取得する */
export function listIssueComments(args: { issueId: number }): Promise<IssueComment[]> {
  return window.api.issueComment.list(args)
}

/** 課題コメントを作成する */
export function createIssueComment(args: IssueCommentCreateArgs): Promise<IssueComment> {
  return window.api.issueComment.create(args)
}

/** 課題コメントを削除する */
export function deleteIssueComment(args: { id: number }): Promise<IssueComment> {
  return window.api.issueComment.delete(args)
}
