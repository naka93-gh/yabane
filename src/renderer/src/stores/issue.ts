import type { Issue } from '@shared/types/models'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as repository from '../repositories/issue'

interface IssueFilter {
  status: string | null
  priority: string | null
}

export const useIssueStore = defineStore('issue', () => {
  const issues = ref<Issue[]>([])
  const loading = ref(false)
  const filter = ref<IssueFilter>({ status: null, priority: null })

  /** フィルタ後の課題一覧 */
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

  /** 課題一覧を取得する */
  async function fetchIssues(projectId: number): Promise<void> {
    loading.value = true
    try {
      issues.value = await repository.listIssues({ projectId })
    } finally {
      loading.value = false
    }
  }

  /** 課題を追加する（先頭に挿入） */
  async function addIssue(data: {
    projectId: number
    title: string
    description?: string
    owner?: string
    priority?: Issue['priority']
    status?: Issue['status']
    dueDate?: string
  }): Promise<Issue> {
    const created = await repository.createIssue(data)
    issues.value.unshift(created)
    return created
  }

  /** 課題を更新する */
  async function editIssue(data: {
    id: number
    title?: string
    description?: string
    owner?: string
    priority?: Issue['priority']
    status?: Issue['status']
    dueDate?: string
    resolution?: string
  }): Promise<void> {
    const updated = await repository.updateIssue(data)
    const idx = issues.value.findIndex((i) => i.id === data.id)
    if (idx !== -1) issues.value[idx] = updated
  }

  /** 課題を削除する */
  async function removeIssue(id: number): Promise<void> {
    await repository.deleteIssue({ id })
    issues.value = issues.value.filter((i) => i.id !== id)
  }

  /** フィルタ条件を部分的に更新する */
  function setFilter(f: Partial<IssueFilter>): void {
    if (f.status !== undefined) filter.value.status = f.status
    if (f.priority !== undefined) filter.value.priority = f.priority
  }

  /** フィルタ条件を全てリセットする */
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
