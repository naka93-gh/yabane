import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Project } from '../types/models'

export const useProjectStore = defineStore('project', () => {
  const projects = ref<Project[]>([])
  const currentProject = ref<Project | null>(null)
  const dialogVisible = ref(false)

  async function fetchProjects(status: 'active' | 'archived' = 'active'): Promise<void> {
    projects.value = await window.api.project.list({ status })
  }

  async function selectProject(id: number): Promise<void> {
    const project = await window.api.project.get({ id })
    if (project) {
      currentProject.value = project
    }
  }

  async function createProject(name: string, description?: string): Promise<Project> {
    const project = await window.api.project.create({ name, description })
    await fetchProjects()
    return project
  }

  async function updateProject(
    id: number,
    data: { name?: string; description?: string }
  ): Promise<void> {
    await window.api.project.update({ id, ...data })
    await fetchProjects()
    if (currentProject.value?.id === id) {
      await selectProject(id)
    }
  }

  async function archiveProject(id: number): Promise<void> {
    await window.api.project.archive({ id })
    if (currentProject.value?.id === id) {
      currentProject.value = null
    }
    await fetchProjects()
  }

  async function unarchiveProject(id: number): Promise<void> {
    await window.api.project.unarchive({ id })
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
