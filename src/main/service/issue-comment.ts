import type { IssueCommentCreateArgs } from '../../shared/types/ipc'
import type { IssueComment } from '../../shared/types/models'
import { getDatabase } from '../database'

/** 課題コメント一覧を取得する */
export function listIssueComments(issueId: number): IssueComment[] {
  const db = getDatabase()
  return db
    .prepare('SELECT * FROM issue_comment WHERE issue_id = ? ORDER BY created_at DESC')
    .all(issueId) as IssueComment[]
}

/** 課題コメントを作成する */
export function createIssueComment(args: IssueCommentCreateArgs): IssueComment {
  const db = getDatabase()
  return db
    .prepare('INSERT INTO issue_comment (issue_id, body) VALUES (?, ?) RETURNING *')
    .get(args.issueId, args.body) as IssueComment
}

/** 課題コメントを削除する */
export function deleteIssueComment(id: number): IssueComment | undefined {
  const db = getDatabase()
  return db.prepare('DELETE FROM issue_comment WHERE id = ? RETURNING *').get(id) as
    | IssueComment
    | undefined
}
