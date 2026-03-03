import type {
  IssueTagCreateArgs,
  IssueTagSyncArgs,
  IssueTagUpdateArgs
} from '../../shared/types/ipc'
import type { IssueTag } from '../../shared/types/models'
import { getDatabase } from '../database'

/** プロジェクト配下のタグ一覧を取得する */
export function listIssueTags(projectId: number): IssueTag[] {
  const db = getDatabase()
  return db
    .prepare('SELECT * FROM issue_tag WHERE project_id = ? ORDER BY sort_order, name')
    .all(projectId) as IssueTag[]
}

/** タグを作成する */
export function createIssueTag(args: IssueTagCreateArgs): IssueTag {
  const db = getDatabase()
  const color = args.color ?? '#6366f1'
  return db
    .prepare('INSERT INTO issue_tag (project_id, name, color) VALUES (?, ?, ?) RETURNING *')
    .get(args.projectId, args.name, color) as IssueTag
}

/** タグを更新する */
export function updateIssueTag(args: IssueTagUpdateArgs): IssueTag {
  const db = getDatabase()
  const current = db.prepare('SELECT * FROM issue_tag WHERE id = ?').get(args.id) as
    | IssueTag
    | undefined
  if (!current) throw new Error(`IssueTag not found: ${args.id}`)

  const name = args.name ?? current.name
  const color = args.color ?? current.color
  return db
    .prepare('UPDATE issue_tag SET name = ?, color = ? WHERE id = ? RETURNING *')
    .get(name, color, args.id) as IssueTag
}

/** タグを削除する（CASCADE で issue_tag_map も消える） */
export function deleteIssueTag(id: number): IssueTag | undefined {
  const db = getDatabase()
  return db.prepare('DELETE FROM issue_tag WHERE id = ? RETURNING *').get(id) as
    | IssueTag
    | undefined
}

/** プロジェクト配下の全課題タグマッピングを取得する */
export function listIssueTagMap(projectId: number): { issue_id: number; tag_id: number }[] {
  const db = getDatabase()
  return db
    .prepare(
      `SELECT m.issue_id, m.tag_id
       FROM issue_tag_map m
       JOIN issue i ON i.id = m.issue_id
       WHERE i.project_id = ?`
    )
    .all(projectId) as { issue_id: number; tag_id: number }[]
}

/** 課題のタグマッピングを同期する */
export function syncIssueTagMap(args: IssueTagSyncArgs): void {
  const db = getDatabase()
  const run = db.transaction(() => {
    db.prepare('DELETE FROM issue_tag_map WHERE issue_id = ?').run(args.issueId)
    const insert = db.prepare('INSERT INTO issue_tag_map (issue_id, tag_id) VALUES (?, ?)')
    for (const tagId of args.tagIds) {
      insert.run(args.issueId, tagId)
    }
  })
  run()
}
