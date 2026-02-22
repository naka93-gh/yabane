import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Purpose } from '../types/models'
import * as api from '../api/purpose'

export const usePurposeStore = defineStore('purpose', () => {
  const purpose = ref<Purpose | null>(null)
  const loading = ref(false)

  /** 目的を取得してストアに反映する */
  async function fetchPurpose(projectId: number): Promise<void> {
    loading.value = true
    try {
      purpose.value = await api.getPurpose({ projectId })
    } finally {
      loading.value = false
    }
  }

  /** 目的を保存してストアに反映する */
  async function savePurpose(data: {
    projectId: number
    background?: string
    objective?: string
    scope?: string
    out_of_scope?: string
    assumption?: string
  }): Promise<void> {
    purpose.value = await api.savePurpose(data)
  }

  return {
    purpose,
    loading,
    fetchPurpose,
    savePurpose
  }
})
