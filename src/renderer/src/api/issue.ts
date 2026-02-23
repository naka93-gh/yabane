import type { Issue } from '@shared/types/models'
import type { IssueCreateArgs, IssueUpdateArgs } from '@shared/types/ipc'

/** 課題一覧を取得する */
export function listIssues(args: { projectId: number }): Promise<Issue[]> {
  return window.api.issue.list(args)
}

/** 課題を作成する */
export function createIssue(args: IssueCreateArgs): Promise<Issue> {
  return window.api.issue.create(args)
}

/** 課題を更新する */
export function updateIssue(args: IssueUpdateArgs): Promise<Issue> {
  return window.api.issue.update(args)
}

/** 課題を削除する */
export function deleteIssue(args: { id: number }): Promise<Issue> {
  return window.api.issue.delete(args)
}
