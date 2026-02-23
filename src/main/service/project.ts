import { getDatabase } from '../database'
import type { Project } from '../../shared/types/models'
import type { ProjectCreateArgs, ProjectUpdateArgs, ProjectSummary } from '../../shared/types/ipc'

/** プロジェクト一覧を取得する */
export function listProjects(status?: Project['status']): Project[] {
  const db = getDatabase()
  if (status) {
    return db
      .prepare('SELECT * FROM project WHERE status = ? ORDER BY updated_at DESC')
      .all(status) as Project[]
  }
  return db
    .prepare("SELECT * FROM project WHERE status != 'archived' ORDER BY updated_at DESC")
    .all() as Project[]
}

/** プロジェクトを1件取得する */
export function getProject(id: number): Project | null {
  const db = getDatabase()
  return (db.prepare('SELECT * FROM project WHERE id = ?').get(id) as Project | undefined) ?? null
}

/** プロジェクトを作成する */
export function createProject(args: ProjectCreateArgs): Project {
  const db = getDatabase()
  return db
    .prepare(
      'INSERT INTO project (name, description, start_date, end_date) VALUES (?, ?, ?, ?) RETURNING *'
    )
    .get(
      args.name,
      args.description ?? null,
      args.start_date ?? null,
      args.end_date ?? null
    ) as Project
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
  const status = args.status ?? project.status

  return db
    .prepare(
      "UPDATE project SET name = ?, description = ?, start_date = ?, end_date = ?, status = ?, updated_at = datetime('now') WHERE id = ? RETURNING *"
    )
    .get(name, description, startDate, endDate, status, args.id) as Project
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
      "UPDATE project SET status = 'planning', updated_at = datetime('now') WHERE id = ? RETURNING *"
    )
    .get(id) as Project | undefined
}
