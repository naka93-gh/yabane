import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Arrow } from '../types/models'
import * as api from '../api/arrow'

export interface ArrowNode {
  arrow: Arrow
  depth: number
}

/** 矢羽リストを親子関係に基づいてフラットなツリー配列に変換する */
function flattenTree(arrows: Arrow[]): ArrowNode[] {
  const childrenMap = new Map<number | null, Arrow[]>()
  for (const a of arrows) {
    const key = a.parent_id
    if (!childrenMap.has(key)) childrenMap.set(key, [])
    childrenMap.get(key)!.push(a)
  }

  const result: ArrowNode[] = []
  function walk(parentId: number | null, depth: number): void {
    const children = childrenMap.get(parentId) ?? []
    for (const arrow of children) {
      result.push({ arrow, depth })
      walk(arrow.id, depth + 1)
    }
  }
  walk(null, 0)
  return result
}

export const useArrowStore = defineStore('arrow', () => {
  const arrows = ref<Arrow[]>([])
  const loading = ref(false)

  /** 矢羽のツリー構造（フラット配列） */
  const tree = computed<ArrowNode[]>(() => flattenTree(arrows.value))

  /** ガント表示用の日付レンジ（前後7日のマージン付き） */
  const dateRange = computed<{ start: Date; end: Date }>(() => {
    let min: number | null = null
    let max: number | null = null
    for (const a of arrows.value) {
      if (a.start_date) {
        const t = new Date(a.start_date).getTime()
        if (min === null || t < min) min = t
      }
      if (a.end_date) {
        const t = new Date(a.end_date).getTime()
        if (max === null || t > max) max = t
      }
    }
    const DAY = 86_400_000
    if (min !== null && max !== null) {
      return { start: new Date(min - 7 * DAY), end: new Date(max + 7 * DAY) }
    }
    const now = Date.now()
    return { start: new Date(now - 30 * DAY), end: new Date(now + 30 * DAY) }
  })

  /** 矢羽一覧を取得する */
  async function fetchArrows(projectId: number): Promise<void> {
    loading.value = true
    try {
      arrows.value = await api.listArrows({ projectId })
    } finally {
      loading.value = false
    }
  }

  /** 矢羽を追加する */
  async function addArrow(data: {
    projectId: number
    parentId?: number
    name: string
    startDate?: string
    endDate?: string
    owner?: string
    status?: string
  }): Promise<Arrow> {
    const created = await api.createArrow(data)
    arrows.value.push(created)
    return created
  }

  /** 矢羽を更新する */
  async function editArrow(data: {
    id: number
    name?: string
    startDate?: string
    endDate?: string
    owner?: string
    status?: string
    parentId?: number | null
  }): Promise<void> {
    const updated = await api.updateArrow(data)
    const idx = arrows.value.findIndex((a) => a.id === data.id)
    if (idx !== -1) arrows.value[idx] = updated
  }

  /** 矢羽を削除する（子孫もローカル状態から除去） */
  async function removeArrow(id: number): Promise<void> {
    await api.deleteArrow({ id })
    // CASCADE で子も削除されるためフィルタ
    const removedIds = collectDescendantIds(id)
    arrows.value = arrows.value.filter((a) => !removedIds.has(a.id))
  }

  /** 指定 ID の子孫 ID を全て収集する */
  function collectDescendantIds(rootId: number): Set<number> {
    const ids = new Set<number>([rootId])
    let added = true
    while (added) {
      added = false
      for (const a of arrows.value) {
        if (a.parent_id !== null && ids.has(a.parent_id) && !ids.has(a.id)) {
          ids.add(a.id)
          added = true
        }
      }
    }
    return ids
  }

  /** 並び順を更新しローカル状態に反映する */
  async function reorder(ids: number[]): Promise<void> {
    await api.reorderArrows({ ids })
    const map = new Map(arrows.value.map((a) => [a.id, a]))
    arrows.value = ids.map((id, i) => {
      const a = map.get(id)!
      return { ...a, sort_order: i }
    })
  }

  return {
    arrows,
    loading,
    tree,
    dateRange,
    fetchArrows,
    addArrow,
    editArrow,
    removeArrow,
    reorder
  }
})
