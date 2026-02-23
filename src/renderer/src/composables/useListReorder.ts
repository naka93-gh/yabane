import { ref, type Ref } from 'vue'

export interface UseListReorderOptions<T> {
  /** アイテムから ID を取得する */
  getId: (item: T) => number
  /** 並び替え後の ID リストを永続化する */
  onReorder: (ids: number[]) => Promise<void>
  /** 同一グループ判定（省略時は常に true） */
  isSameGroup?: (a: T, b: T) => boolean
  /** グループ内の全アイテムを返す（省略時は items 全体を使う） */
  getGroupItems?: (item: T, items: T[]) => T[]
}

interface UseListReorderReturn<T> {
  dragIndex: Ref<number | null>
  dropIndex: Ref<number | null>
  onDragStart: (item: T, index: number, e: DragEvent) => void
  onDragOver: (target: T, index: number, e: DragEvent) => void
  onDragLeave: () => void
  onDragEnd: () => void
  onDrop: (target: T, items: T[]) => Promise<void>
}

/** リストのドラッグ＆ドロップ並び替え composable */
export function useListReorder<T>(options: UseListReorderOptions<T>): UseListReorderReturn<T> {
  const dragIndex = ref<number | null>(null)
  const dropIndex = ref<number | null>(null)
  const dragItem = ref<T | null>(null) as { value: T | null }

  function onDragStart(item: T, index: number, e: DragEvent): void {
    dragItem.value = item
    dragIndex.value = index
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
    }
  }

  function onDragOver(target: T, index: number, e: DragEvent): void {
    if (dragItem.value === null) return
    if (options.isSameGroup && !options.isSameGroup(dragItem.value, target)) return
    if (options.getId(target) === options.getId(dragItem.value)) return
    e.preventDefault()
    dropIndex.value = index
  }

  function onDragLeave(): void {
    dropIndex.value = null
  }

  function onDragEnd(): void {
    dragIndex.value = null
    dropIndex.value = null
    dragItem.value = null
  }

  async function onDrop(target: T, items: T[]): Promise<void> {
    const source = dragItem.value
    if (!source || options.getId(source) === options.getId(target)) {
      onDragEnd()
      return
    }
    if (options.isSameGroup && !options.isSameGroup(source, target)) {
      onDragEnd()
      return
    }

    const groupItems = options.getGroupItems ? options.getGroupItems(source, items) : items
    const ids = groupItems.map(options.getId)
    const fromIdx = ids.indexOf(options.getId(source))
    const toIdx = ids.indexOf(options.getId(target))
    if (fromIdx === -1 || toIdx === -1) {
      onDragEnd()
      return
    }
    ids.splice(fromIdx, 1)
    ids.splice(toIdx, 0, options.getId(source))
    onDragEnd()
    await options.onReorder(ids)
  }

  return {
    dragIndex,
    dropIndex,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDragEnd,
    onDrop
  }
}
