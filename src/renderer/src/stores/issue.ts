import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Issue } from '../types/models'
import * as api from '../api/issue'

interface IssueFilter {
  status: string | null
  priority: string | null
}

export const useIssueStore = defineStore('issue', () => {
  const issues = ref<Issue[]>([])
  const loading = ref(false)
  const filter = ref<IssueFilter>({ status: null, priority: null })

  const filteredIssues = computed(() => {
    let result = issues.value
    if (filter.value.status !== null) {
      result = result.filter((i) => i.status === filter.value.status)
    }
    if (filter.value.priority !== null) {
      result = result.filter((i) => i.priority === filter.value.priority)
    }
    return result
  })

  async function fetchIssues(projectId: number): Promise<void> {
    loading.value = true
    try {
      issues.value = await api.listIssues({ projectId })
    } finally {
      loading.value = false
    }
  }

  async function addIssue(data: {
    projectId: number
    title: string
    description?: string
    owner?: string
    priority?: string
    status?: string
    dueDate?: string
  }): Promise<Issue> {
    const created = await api.createIssue(data)
    issues.value.unshift(created)
    return created
  }

  async function editIssue(data: {
    id: number
    title?: string
    description?: string
    owner?: string
    priority?: string
    status?: string
    dueDate?: string
    resolution?: string
  }): Promise<void> {
    const updated = await api.updateIssue(data)
    const idx = issues.value.findIndex((i) => i.id === data.id)
    if (idx !== -1) issues.value[idx] = updated
  }

  async function removeIssue(id: number): Promise<void> {
    await api.deleteIssue({ id })
    issues.value = issues.value.filter((i) => i.id !== id)
  }

  function setFilter(f: Partial<IssueFilter>): void {
    if (f.status !== undefined) filter.value.status = f.status
    if (f.priority !== undefined) filter.value.priority = f.priority
  }

  function clearFilter(): void {
    filter.value = { status: null, priority: null }
  }

  return {
    issues,
    loading,
    filter,
    filteredIssues,
    fetchIssues,
    addIssue,
    editIssue,
    removeIssue,
    setFilter,
    clearFilter
  }
})
