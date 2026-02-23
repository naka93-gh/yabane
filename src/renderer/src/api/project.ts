import type { Project } from '@shared/types/models'
import type {
  ProjectListArgs,
  ProjectCreateArgs,
  ProjectUpdateArgs,
  ProjectSummary
} from '@shared/types/ipc'

/** プロジェクト一覧を取得する */
export function listProjects(args?: ProjectListArgs): Promise<Project[]> {
  return window.api.project.list(args)
}

/** プロジェクトを1件取得する */
export function getProject(args: { id: number }): Promise<Project | null> {
  return window.api.project.get(args)
}

/** プロジェクトを作成する */
export function createProject(args: ProjectCreateArgs): Promise<Project> {
  return window.api.project.create(args)
}

/** プロジェクトを更新する */
export function updateProject(args: ProjectUpdateArgs): Promise<Project> {
  return window.api.project.update(args)
}

/** プロジェクトをアーカイブする */
export function archiveProject(args: { id: number }): Promise<Project> {
  return window.api.project.archive(args)
}

/** プロジェクトのアーカイブを解除する */
export function unarchiveProject(args: { id: number }): Promise<Project> {
  return window.api.project.unarchive(args)
}

/** プロジェクトの統計サマリを取得する */
export function getProjectSummary(args: { projectId: number }): Promise<ProjectSummary> {
  return window.api.project.summary(args)
}
