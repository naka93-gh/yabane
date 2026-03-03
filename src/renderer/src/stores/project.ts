import type { ProjectCreateArgs, ProjectUpdateArgs } from '@shared/types/ipc'
import type { Project } from '@shared/types/models'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as repository from '../repositories/project'
import { useMemberStore } from './member'

export const useProjectStore = defineStore('project', () => {
  const projects = ref<Project[]>([])
  const currentProject = ref<Project | null>(null)
  /** プロジェクト一覧を取得してストアに反映する */
  async function fetchProjects(status?: Project['status']): Promise<void> {
    projects.value = await repository.listProjects(status ? { status } : undefined)
  }

  /** プロジェクトを選択して currentProject に設定する */
  async function selectProject(id: number): Promise<void> {
    const project = await repository.getProject({ id })
    if (project) {
      currentProject.value = project
      // TODO: Store 間連携が複雑化した場合、Service 層への切り出しを検討
      useMemberStore().fetchMembers(id)
    }
  }

  /** プロジェクトを作成し一覧を再取得する */
  async function createProject(args: ProjectCreateArgs): Promise<Project> {
    const project = await repository.createProject(args)
    await fetchProjects()
    return project
  }

  /** プロジェクトを更新し一覧を再取得する */
  async function updateProject(id: number, data: Omit<ProjectUpdateArgs, 'id'>): Promise<void> {
    await repository.updateProject({ id, ...data })
    await fetchProjects()
    if (currentProject.value?.id === id) {
      await selectProject(id)
    }
  }

  /** プロジェクトをアーカイブする */
  async function archiveProject(id: number): Promise<void> {
    await repository.archiveProject({ id })
    if (currentProject.value?.id === id) {
      currentProject.value = null
    }
    await fetchProjects()
  }

  /** プロジェクトのアーカイブを解除する */
  async function unarchiveProject(id: number): Promise<void> {
    await repository.unarchiveProject({ id })
  }

  return {
    projects,
    currentProject,
    fetchProjects,
    selectProject,
    createProject,
    updateProject,
    archiveProject,
    unarchiveProject
  }
})
