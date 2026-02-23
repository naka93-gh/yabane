import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Project } from '@shared/types/models'
import * as api from '../api/project'
import { useMemberStore } from './member'

export const useProjectStore = defineStore('project', () => {
  const projects = ref<Project[]>([])
  const currentProject = ref<Project | null>(null)
  /** プロジェクト一覧を取得してストアに反映する */
  async function fetchProjects(status: 'active' | 'archived' = 'active'): Promise<void> {
    projects.value = await api.listProjects({ status })
  }

  /** プロジェクトを選択して currentProject に設定する */
  async function selectProject(id: number): Promise<void> {
    const project = await api.getProject({ id })
    if (project) {
      currentProject.value = project
      // メンバー一覧をバックグラウンドで取得
      useMemberStore().fetchMembers(id)
    }
  }

  /** プロジェクトを作成し一覧を再取得する */
  async function createProject(
    name: string,
    description?: string,
    startDate?: string,
    endDate?: string
  ): Promise<Project> {
    const project = await api.createProject({
      name,
      description,
      start_date: startDate,
      end_date: endDate
    })
    await fetchProjects()
    return project
  }

  /** プロジェクトを更新し一覧を再取得する */
  async function updateProject(
    id: number,
    data: {
      name?: string
      description?: string
      start_date?: string | null
      end_date?: string | null
    }
  ): Promise<void> {
    await api.updateProject({ id, ...data })
    await fetchProjects()
    if (currentProject.value?.id === id) {
      await selectProject(id)
    }
  }

  /** プロジェクトをアーカイブする */
  async function archiveProject(id: number): Promise<void> {
    await api.archiveProject({ id })
    if (currentProject.value?.id === id) {
      currentProject.value = null
    }
    await fetchProjects()
  }

  /** プロジェクトのアーカイブを解除する */
  async function unarchiveProject(id: number): Promise<void> {
    await api.unarchiveProject({ id })
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
