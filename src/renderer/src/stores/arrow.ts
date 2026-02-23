import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Arrow } from '@shared/types/models'
import * as api from '../api/arrow'
import { useProjectStore } from './project'
import { calcDateRange } from '../utils/gantt-helper'

export interface ArrowNode {
  arrow: Arrow
  depth: number
}

/** 矢羽リストを親子関係に基づいてフラットなツリー配列に変換する */
function flattenTree(arrows: Arrow[], collapsedIds?: Set<number>): ArrowNode[] {
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
      if (!collapsedIds?.has(arrow.id)) {
        walk(arrow.id, depth + 1)
      }
    }
  }
  walk(null, 0)
  return result
}

export const useArrowStore = defineStore('arrow', () => {
  const arrows = ref<Arrow[]>([])
  const loading = ref(false)
  const collapsedIds = ref(new Set<number>())

  /** 矢羽のツリー構造（フラット配列・全ノード） */
  const tree = computed<ArrowNode[]>(() => flattenTree(arrows.value))

  /** 折りたたみ反映済みのツリー（表示用） */
  const visibleTree = computed<ArrowNode[]>(() => flattenTree(arrows.value, collapsedIds.value))

  /** 折りたたみ状態をトグルする */
  function toggleCollapse(id: number): void {
    const next = new Set(collapsedIds.value)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    collapsedIds.value = next
  }

  /** ガント表示用の日付レンジ（前後7日のマージン付き） */
  const dateRange = computed(() => {
    const project = useProjectStore().currentProject
    const dates = arrows.value.flatMap(
      (a) => [a.start_date, a.end_date].filter(Boolean) as string[]
    )
    return calcDateRange(project ?? null, dates)
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
    status?: Arrow['status']
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
    status?: Arrow['status']
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

  /** 並び順を更新しローカル状態に反映する（兄弟 ID のみ渡す） */
  async function reorder(ids: number[]): Promise<void> {
    await api.reorderArrows({ ids })
    const orderMap = new Map(ids.map((id, i) => [id, i]))
    arrows.value = arrows.value
      .map((a) => (orderMap.has(a.id) ? { ...a, sort_order: orderMap.get(a.id)! } : a))
      .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
  }

  return {
    arrows,
    loading,
    tree,
    visibleTree,
    collapsedIds,
    dateRange,
    fetchArrows,
    addArrow,
    editArrow,
    removeArrow,
    reorder,
    toggleCollapse
  }
})
