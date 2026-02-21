import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Project } from '../types/models'
import * as api from '../api/project'

export const useProjectStore = defineStore('project', () => {
  const projects = ref<Project[]>([])
  const currentProject = ref<Project | null>(null)
  const dialogVisible = ref(false)

  async function fetchProjects(status: 'active' | 'archived' = 'active'): Promise<void> {
    projects.value = await api.listProjects({ status })
  }

  async function selectProject(id: number): Promise<void> {
    const project = await api.getProject({ id })
    if (project) {
      currentProject.value = project
    }
  }

  async function createProject(name: string, description?: string): Promise<Project> {
    const project = await api.createProject({ name, description })
    await fetchProjects()
    return project
  }

  async function updateProject(
    id: number,
    data: { name?: string; description?: string }
  ): Promise<void> {
    await api.updateProject({ id, ...data })
    await fetchProjects()
    if (currentProject.value?.id === id) {
      await selectProject(id)
    }
  }

  async function archiveProject(id: number): Promise<void> {
    await api.archiveProject({ id })
    if (currentProject.value?.id === id) {
      currentProject.value = null
    }
    await fetchProjects()
  }

  async function unarchiveProject(id: number): Promise<void> {
    await api.unarchiveProject({ id })
  }

  return {
    projects,
    currentProject,
    dialogVisible,
    fetchProjects,
    selectProject,
    createProject,
    updateProject,
    archiveProject,
    unarchiveProject
  }
})
