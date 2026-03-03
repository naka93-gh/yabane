import type { Purpose } from '@shared/types/models'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as repository from '../repositories/purpose'

export const usePurposeStore = defineStore('purpose', () => {
  const purpose = ref<Purpose | null>(null)
  const loading = ref(false)

  /** 目的を取得してストアに反映する */
  async function fetchPurpose(projectId: number): Promise<void> {
    loading.value = true
    try {
      purpose.value = await repository.getPurpose({ projectId })
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
    purpose.value = await repository.savePurpose(data)
  }

  return {
    purpose,
    loading,
    fetchPurpose,
    savePurpose
  }
})
