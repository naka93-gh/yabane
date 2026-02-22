import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Arrow, WbsItem } from '@shared/types/models'
import * as api from '../api/wbs'
import { useArrowStore } from './arrow'

export interface WbsTreeRow {
  type: 'parent' | 'child' | 'task'
  parentArrow: Arrow | null
  childArrow: Arrow | null
  task: WbsItem | null
  key: string
  startDate: string | null
  endDate: string | null
  status: string
  owner: string | null
  name: string
  showParentName: boolean
  showChildName: boolean
}

interface WbsFilter {
  arrowId: number | null
  status: string | null
  owner: string | null
}

export const useWbsStore = defineStore('wbs', () => {
  const items = ref<WbsItem[]>([])
  const loading = ref(false)
  const filter = ref<WbsFilter>({ arrowId: null, status: null, owner: null })

  const arrowStore = useArrowStore()

  /** 子矢羽の一覧（parent_id != null） */
  const childArrows = computed(() => arrowStore.arrows.filter((a) => a.parent_id !== null))

  /** 担当者の一覧（重複排除） */
  const owners = computed(() => {
    const set = new Set<string>()
    for (const item of items.value) {
      if (item.owner) set.add(item.owner)
    }
    return Array.from(set).sort()
  })

  /** フィルタ後のタスク */
  const filteredItems = computed(() => {
    let result = items.value
    if (filter.value.arrowId !== null) {
      result = result.filter((i) => i.arrow_id === filter.value.arrowId)
    }
    if (filter.value.status !== null) {
      result = result.filter((i) => i.status === filter.value.status)
    }
    if (filter.value.owner !== null) {
      result = result.filter((i) => i.owner === filter.value.owner)
    }
    return result
  })

  /** 3階層ツリー行を構築 */
  const tree = computed<WbsTreeRow[]>(() => {
    const arrows = arrowStore.arrows
    const taskItems = filteredItems.value

    // 親矢羽（parent_id == null）
    const parents = arrows
      .filter((a) => a.parent_id === null)
      .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)

    // 子矢羽マップ: parentId -> children
    const childrenMap = new Map<number, Arrow[]>()
    for (const a of arrows) {
      if (a.parent_id !== null) {
        if (!childrenMap.has(a.parent_id)) childrenMap.set(a.parent_id, [])
        childrenMap.get(a.parent_id)!.push(a)
      }
    }
    for (const children of childrenMap.values()) {
      children.sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
    }

    // タスクマップ: arrowId -> tasks
    const taskMap = new Map<number, WbsItem[]>()
    for (const t of taskItems) {
      if (!taskMap.has(t.arrow_id)) taskMap.set(t.arrow_id, [])
      taskMap.get(t.arrow_id)!.push(t)
    }
    for (const tasks of taskMap.values()) {
      tasks.sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
    }

    // フィルタ適用時: タスクが存在する arrowId を収集
    const hasFilter =
      filter.value.arrowId !== null || filter.value.status !== null || filter.value.owner !== null
    const activeArrowIds = hasFilter ? new Set(taskItems.map((t) => t.arrow_id)) : null

    const rows: WbsTreeRow[] = []

    for (const parent of parents) {
      const children = childrenMap.get(parent.id) ?? []

      // フィルタ時: 子矢羽にタスクがなければ親ごとスキップ
      if (activeArrowIds) {
        const hasActiveChild = children.some((c) => activeArrowIds.has(c.id))
        if (!hasActiveChild) continue
      }

      let isFirstParentRow = true

      for (const child of children) {
        // フィルタ時: タスクがない子矢羽をスキップ
        if (activeArrowIds && !activeArrowIds.has(child.id)) continue

        const tasks = taskMap.get(child.id) ?? []
        let isFirstChildRow = true

        if (tasks.length === 0) {
          // タスクなしでも子矢羽行は表示（追加ボタン用）
          rows.push({
            type: 'child',
            parentArrow: parent,
            childArrow: child,
            task: null,
            key: `child-${child.id}`,
            startDate: child.start_date,
            endDate: child.end_date,
            status: child.status,
            owner: child.owner,
            name: child.name,
            showParentName: isFirstParentRow,
            showChildName: true
          })
          isFirstParentRow = false
        } else {
          for (const task of tasks) {
            rows.push({
              type: 'task',
              parentArrow: parent,
              childArrow: child,
              task,
              key: `task-${task.id}`,
              startDate: task.start_date,
              endDate: task.end_date,
              status: task.status,
              owner: task.owner,
              name: task.name,
              showParentName: isFirstParentRow,
              showChildName: isFirstChildRow
            })
            isFirstParentRow = false
            isFirstChildRow = false
          }
        }
      }

      // 子矢羽がない親矢羽も表示
      if (
        children.length === 0 ||
        (activeArrowIds && !rows.some((r) => r.parentArrow?.id === parent.id))
      ) {
        if (!activeArrowIds) {
          rows.push({
            type: 'parent',
            parentArrow: parent,
            childArrow: null,
            task: null,
            key: `parent-${parent.id}`,
            startDate: parent.start_date,
            endDate: parent.end_date,
            status: parent.status,
            owner: parent.owner,
            name: parent.name,
            showParentName: true,
            showChildName: false
          })
        }
      }
    }

    return rows
  })

  /** 日付レンジ計算 */
  const dateRange = computed<{ start: Date; end: Date }>(() => {
    let min: number | null = null
    let max: number | null = null
    for (const item of items.value) {
      if (item.start_date) {
        const t = new Date(item.start_date).getTime()
        if (min === null || t < min) min = t
      }
      if (item.end_date) {
        const t = new Date(item.end_date).getTime()
        if (max === null || t > max) max = t
      }
    }
    // 矢羽の日付も考慮
    for (const a of arrowStore.arrows) {
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
    return { start: new Date(now - 30 * DAY), end: new Date(now + 60 * DAY) }
  })

  /** WBS 一覧を取得する */
  async function fetchItems(projectId: number): Promise<void> {
    loading.value = true
    try {
      items.value = await api.listWbsItems({ projectId })
    } finally {
      loading.value = false
    }
  }

  /** WBS タスクを追加する */
  async function addItem(data: {
    arrowId: number
    name: string
    startDate?: string
    endDate?: string
    owner?: string
    status?: WbsItem['status']
    progress?: number
    estimatedHours?: number
  }): Promise<WbsItem> {
    const created = await api.createWbsItem(data)
    items.value.push(created)
    return created
  }

  /** WBS タスクを更新する */
  async function editItem(data: {
    id: number
    arrowId?: number
    name?: string
    startDate?: string
    endDate?: string
    owner?: string
    status?: WbsItem['status']
    progress?: number
    estimatedHours?: number
    actualHours?: number
  }): Promise<void> {
    const updated = await api.updateWbsItem(data)
    const idx = items.value.findIndex((i) => i.id === data.id)
    if (idx !== -1) items.value[idx] = updated
  }

  /** WBS タスクを削除する */
  async function removeItem(id: number): Promise<void> {
    await api.deleteWbsItem({ id })
    items.value = items.value.filter((i) => i.id !== id)
  }

  /** 矢羽削除時に該当タスクを除去 */
  function removeByArrowId(arrowId: number): void {
    items.value = items.value.filter((i) => i.arrow_id !== arrowId)
  }

  /** フィルタ条件を部分的に更新する */
  function setFilter(f: Partial<WbsFilter>): void {
    if (f.arrowId !== undefined) filter.value.arrowId = f.arrowId
    if (f.status !== undefined) filter.value.status = f.status
    if (f.owner !== undefined) filter.value.owner = f.owner
  }

  /** フィルタ条件を全てリセットする */
  function clearFilter(): void {
    filter.value = { arrowId: null, status: null, owner: null }
  }

  return {
    items,
    loading,
    filter,
    childArrows,
    owners,
    filteredItems,
    tree,
    dateRange,
    fetchItems,
    addItem,
    editItem,
    removeItem,
    removeByArrowId,
    setFilter,
    clearFilter
  }
})
