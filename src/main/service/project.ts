import { getDatabase } from '../database'
import type { Project } from '../../shared/types/models'
import type { ProjectUpdateArgs, ProjectSummary } from '../../shared/types/ipc'

/** プロジェクト一覧を取得する */
export function listProjects(status?: Project['status']): Project[] {
  const db = getDatabase()
  const s = status ?? 'active'
  return db
    .prepare('SELECT * FROM project WHERE status = ? ORDER BY updated_at DESC')
    .all(s) as Project[]
}

/** プロジェクトを1件取得する */
export function getProject(id: number): Project | null {
  const db = getDatabase()
  return (db.prepare('SELECT * FROM project WHERE id = ?').get(id) as Project | undefined) ?? null
}

/** プロジェクトを作成する */
export function createProject(name: string, description?: string): Project {
  const db = getDatabase()
  return db
    .prepare('INSERT INTO project (name, description) VALUES (?, ?) RETURNING *')
    .get(name, description ?? null) as Project
}

/** プロジェクトを更新する */
export function updateProject(args: ProjectUpdateArgs): Project | null {
  const db = getDatabase()
  const project = db.prepare('SELECT * FROM project WHERE id = ?').get(args.id) as
    | Project
    | undefined
  if (!project) return null

  const name = args.name ?? project.name
  const description = args.description !== undefined ? args.description : project.description
  const startDate = args.start_date !== undefined ? args.start_date : project.start_date
  const endDate = args.end_date !== undefined ? args.end_date : project.end_date

  return db
    .prepare(
      "UPDATE project SET name = ?, description = ?, start_date = ?, end_date = ?, updated_at = datetime('now') WHERE id = ? RETURNING *"
    )
    .get(name, description, startDate, endDate, args.id) as Project
}

/** プロジェクトをアーカイブする */
export function archiveProject(id: number): Project | undefined {
  const db = getDatabase()
  return db
    .prepare(
      "UPDATE project SET status = 'archived', updated_at = datetime('now') WHERE id = ? RETURNING *"
    )
    .get(id) as Project | undefined
}

/** プロジェクトの統計サマリを取得する */
export function getProjectSummary(projectId: number): ProjectSummary {
  const db = getDatabase()
  const row = db
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM arrow WHERE project_id = ?) AS arrowCount,
        (SELECT COUNT(*) FROM wbs_item WHERE arrow_id IN (SELECT id FROM arrow WHERE project_id = ?)) AS wbsItemCount,
        (SELECT COUNT(*) FROM issue WHERE project_id = ?) AS issueCount,
        (SELECT COUNT(*) FROM issue WHERE project_id = ? AND status = 'open') AS openIssueCount,
        (SELECT COUNT(*) FROM milestone WHERE project_id = ?) AS milestoneCount,
        (SELECT COUNT(*) FROM member WHERE project_id = ?) AS memberCount`
    )
    .get(projectId, projectId, projectId, projectId, projectId, projectId) as ProjectSummary
  return row
}

/** プロジェクトのアーカイブを解除する */
export function unarchiveProject(id: number): Project | undefined {
  const db = getDatabase()
  return db
    .prepare(
      "UPDATE project SET status = 'active', updated_at = datetime('now') WHERE id = ? RETURNING *"
    )
    .get(id) as Project | undefined
}
