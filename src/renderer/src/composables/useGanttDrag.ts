import { ref, computed, onUnmounted, type Ref, type ComputedRef } from 'vue'
import { formatDate } from '../utils/date-helper'
import { calcBarStyle } from '../utils/gantt-helper'
import { useArrowStore } from '../stores/arrow'
import type { Arrow } from '@shared/types/models'

type DragMode = 'move' | 'resize-start' | 'resize-end'

interface DragState {
  arrowId: number
  mode: DragMode
  originX: number
  originStartDate: string
  originEndDate: string
  status: Arrow['status']
}

interface GanttDragReturn {
  dragging: Ref<DragState | null>
  previewDates: ComputedRef<{ startDate: string; endDate: string } | null>
  barStyleOverride: (arrowId: number) => Record<string, string> | null
  onBarMouseDown: (arrow: Arrow, mode: DragMode, event: MouseEvent) => void
}

/** ガントバーのドラッグ移動・リサイズを管理する composable */
export function useGanttDrag(dayWidth: number): GanttDragReturn {
  const store = useArrowStore()
  const dragging = ref<DragState | null>(null)
  const deltaDays = ref(0)

  /** ドラッグ中の仮日付を算出する */
  const previewDates = computed<{ startDate: string; endDate: string } | null>(() => {
    if (!dragging.value) return null
    const { mode, originStartDate, originEndDate } = dragging.value
    const origStart = new Date(originStartDate)
    const origEnd = new Date(originEndDate)
    const d = deltaDays.value

    let newStart: Date
    let newEnd: Date

    if (mode === 'move') {
      newStart = addDays(origStart, d)
      newEnd = addDays(origEnd, d)
    } else if (mode === 'resize-start') {
      newStart = addDays(origStart, d)
      newEnd = new Date(origEnd)
      if (newStart > newEnd) newStart = new Date(newEnd)
    } else {
      newStart = new Date(origStart)
      newEnd = addDays(origEnd, d)
      if (newEnd < newStart) newEnd = new Date(newStart)
    }

    return { startDate: formatDate(newStart), endDate: formatDate(newEnd) }
  })

  /** ドラッグ中のバーのスタイルを返す。対象外なら null */
  function barStyleOverride(arrowId: number): Record<string, string> | null {
    if (!dragging.value || dragging.value.arrowId !== arrowId || !previewDates.value) return null
    return calcBarStyle(
      previewDates.value.startDate,
      previewDates.value.endDate,
      store.dateRange.start,
      dayWidth,
      dragging.value.status
    )
  }

  function onBarMouseDown(arrow: Arrow, mode: DragMode, event: MouseEvent): void {
    if (!arrow.start_date || !arrow.end_date) return
    event.preventDefault()
    dragging.value = {
      arrowId: arrow.id,
      mode,
      originX: event.clientX,
      originStartDate: arrow.start_date,
      originEndDate: arrow.end_date,
      status: arrow.status
    }
    deltaDays.value = 0
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  function onMouseMove(event: MouseEvent): void {
    if (!dragging.value) return
    const diffPx = event.clientX - dragging.value.originX
    deltaDays.value = Math.round(diffPx / dayWidth)
  }

  async function onMouseUp(): Promise<void> {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    if (!dragging.value || !previewDates.value) {
      dragging.value = null
      return
    }
    const { arrowId } = dragging.value
    const { startDate, endDate } = previewDates.value

    // 変更がなければスキップ
    if (startDate === dragging.value.originStartDate && endDate === dragging.value.originEndDate) {
      dragging.value = null
      return
    }

    dragging.value = null
    deltaDays.value = 0
    await store.editArrow({ id: arrowId, startDate, endDate })
  }

  onUnmounted(() => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  })

  return { dragging, previewDates, barStyleOverride, onBarMouseDown }
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}
