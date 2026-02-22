import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Milestone } from '@shared/types/models'
import * as api from '../api/milestone'

export const useMilestoneStore = defineStore('milestone', () => {
  const milestones = ref<Milestone[]>([])
  const loading = ref(false)

  /** マイルストーン一覧を取得する */
  async function fetchMilestones(projectId: number): Promise<void> {
    loading.value = true
    try {
      milestones.value = await api.listMilestones({ projectId })
    } finally {
      loading.value = false
    }
  }

  /** マイルストーンを追加する */
  async function addMilestone(data: {
    projectId: number
    name: string
    description?: string
    dueDate?: string
    color?: string
  }): Promise<Milestone> {
    const created = await api.createMilestone(data)
    milestones.value.push(created)
    return created
  }

  /** マイルストーンを更新する */
  async function editMilestone(data: {
    id: number
    name?: string
    description?: string
    dueDate?: string
    color?: string
  }): Promise<void> {
    const updated = await api.updateMilestone(data)
    const idx = milestones.value.findIndex((m) => m.id === data.id)
    if (idx !== -1) milestones.value[idx] = updated
  }

  /** マイルストーンを削除する */
  async function removeMilestone(id: number): Promise<void> {
    await api.deleteMilestone({ id })
    milestones.value = milestones.value.filter((m) => m.id !== id)
  }

  /** 並び順を更新しローカル状態に反映する */
  async function reorder(ids: number[]): Promise<void> {
    await api.reorderMilestones({ ids })
    const map = new Map(milestones.value.map((m) => [m.id, m]))
    milestones.value = ids.map((id, i) => {
      const m = map.get(id)!
      return { ...m, sort_order: i }
    })
  }

  return {
    milestones,
    loading,
    fetchMilestones,
    addMilestone,
    editMilestone,
    removeMilestone,
    reorder
  }
})
