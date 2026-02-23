<script setup lang="ts">
import { computed } from 'vue'
import {
  buildAllDates,
  buildMonthHeaders,
  buildJunHeaders,
  buildGridLines,
  buildMilestoneLines,
  calcTodayLeft,
  calcBarStyle,
  type GridLine
} from '../../utils/gantt-helper'
import { useArrowStore } from '../../stores/arrow'
import { useMilestoneStore } from '../../stores/milestone'
import type { Arrow } from '@shared/types/models'

const store = useArrowStore()
const milestoneStore = useMilestoneStore()

defineProps<{
  showTodayLine: boolean
  showMilestones: boolean
}>()

const ROW_HEIGHT = 40
const HEADER_HEIGHT = 56
const DAY_WIDTH = 5

const allDates = computed(() => buildAllDates(store.dateRange.start, store.dateRange.end))
const ganttTotalWidth = computed(() => allDates.value.length * DAY_WIDTH)
const monthHeaders = computed(() => buildMonthHeaders(allDates.value, DAY_WIDTH))
const junHeaders = computed(() => buildJunHeaders(allDates.value, DAY_WIDTH))
const gridLines = computed<GridLine[]>(() => buildGridLines(allDates.value, DAY_WIDTH))
const milestoneLines = computed(() =>
  buildMilestoneLines(
    milestoneStore.milestones,
    store.dateRange.start,
    store.dateRange.end,
    DAY_WIDTH
  )
)
const todayLeft = computed(() =>
  calcTodayLeft(store.dateRange.start, store.dateRange.end, DAY_WIDTH)
)

const statusLabel: Record<Arrow['status'], string> = {
  not_started: '未着手',
  in_progress: '進行中',
  done: '完了'
}

function barStyle(arrow: Arrow): Record<string, string> | null {
  if (!arrow.start_date || !arrow.end_date) return null
  return calcBarStyle(
    arrow.start_date,
    arrow.end_date,
    store.dateRange.start,
    DAY_WIDTH,
    arrow.status
  )
}

function barTooltip(arrow: Arrow): string {
  const parts = [arrow.name]
  if (arrow.start_date && arrow.end_date) {
    parts.push(`${arrow.start_date} 〜 ${arrow.end_date}`)
  }
  parts.push(statusLabel[arrow.status])
  return parts.join('\n')
}
</script>

<template>
  <div class="gantt-right">
    <div class="gantt-right-scroll">
      <div class="gantt-right-inner" :style="{ width: `${ganttTotalWidth}px` }">
        <!-- ヘッダー行（月 + 旬） -->
        <div class="gantt-header" :style="{ height: `${HEADER_HEIGHT}px` }">
          <div
            v-for="(mh, i) in monthHeaders"
            :key="`m-${i}`"
            class="month-cell"
            :style="{ left: `${mh.left}px`, width: `${mh.width}px` }"
          >
            {{ mh.label }}
          </div>
          <div
            v-for="(jh, i) in junHeaders"
            :key="`j-${i}`"
            class="jun-cell"
            :style="{ left: `${jh.left}px`, width: `${jh.width}px` }"
          >
            {{ jh.label }}
          </div>
        </div>
        <!-- バー行 -->
        <div class="gantt-body">
          <div
            v-for="node in store.visibleTree"
            :key="node.arrow.id"
            class="gantt-row"
            :style="{ height: `${ROW_HEIGHT}px` }"
          >
            <!-- グリッド線（月境界 + 三等分） -->
            <div
              v-for="(gl, i) in gridLines"
              :key="i"
              class="grid-line"
              :class="`grid-line--${gl.type}`"
              :style="{ left: `${gl.left}px` }"
            />
            <!-- バー -->
            <div
              v-if="barStyle(node.arrow)"
              class="gantt-bar"
              :style="barStyle(node.arrow)!"
              :title="barTooltip(node.arrow)"
            />
          </div>
          <!-- マイルストーン縦線 -->
          <div
            v-for="ml in milestoneLines"
            v-show="showMilestones"
            :key="`ms-${ml.id}`"
            class="milestone-line"
            :style="{ left: `${ml.left}px`, borderColor: ml.color }"
          >
            <span class="milestone-line-label" :style="{ background: ml.color }">
              {{ ml.name }}
            </span>
          </div>
          <!-- 今日線 -->
          <div
            v-if="showTodayLine && todayLeft !== null"
            class="today-line"
            :style="{ left: `${todayLeft}px` }"
          >
            <span class="today-line-label">今日</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gantt-right {
  flex: 1;
  min-width: 0;
  overflow-x: auto;
}

.gantt-right-scroll {
  min-width: 100%;
}

.gantt-right-inner {
  min-width: 100%;
}

/* ヘッダー（月 + 旬） */
.gantt-header {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--p-content-hover-background);
  border-bottom: 1px solid var(--p-content-border-color);
  position: relative;
}

.month-cell {
  position: absolute;
  top: 0;
  height: 50%;
  display: flex;
  align-items: center;
  padding-left: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--p-text-muted-color);
  border-right: 1px solid var(--p-content-border-color);
  border-bottom: 1px solid var(--p-content-border-color);
  box-sizing: border-box;
}

.jun-cell {
  position: absolute;
  top: 50%;
  height: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  color: var(--p-text-muted-color);
  border-right: 1px solid var(--p-content-border-color);
  box-sizing: border-box;
}

/* バー領域 */
.gantt-body {
  position: relative;
}

.gantt-row {
  position: relative;
  border-bottom: 1px solid var(--p-content-border-color);
}

.grid-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
}

.grid-line--month {
  background: var(--p-content-border-color);
}

.grid-line--third {
  background: var(--p-content-border-color);
  opacity: 0.4;
}

.gantt-bar {
  position: absolute;
  top: 8px;
  height: 24px;
  border-radius: 4px;
  z-index: 1;
}

.milestone-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 0;
  border-left: 2px dashed;
  pointer-events: none;
  z-index: 2;
}

.milestone-line-label {
  position: absolute;
  top: 0;
  left: -1px;
  transform: translateX(-50%);
  font-size: 0.65rem;
  font-weight: 600;
  color: #fff;
  padding: 1px 6px;
  border-radius: 0 0 4px 4px;
  white-space: nowrap;
  pointer-events: auto;
}

.today-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 0;
  border-left: 2px dashed var(--p-red-400);
  pointer-events: none;
  z-index: 2;
}

.today-line-label {
  position: absolute;
  top: 0;
  left: -1px;
  transform: translateX(-50%);
  font-size: 0.65rem;
  font-weight: 600;
  color: #fff;
  background: var(--p-red-400);
  padding: 1px 6px;
  border-radius: 0 0 4px 4px;
  white-space: nowrap;
  pointer-events: auto;
}
</style>
