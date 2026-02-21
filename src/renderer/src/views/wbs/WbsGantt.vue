<script setup lang="ts">
import { computed } from 'vue'
import type { WbsTreeRow } from '../../stores/wbs'

const props = defineProps<{
  rows: WbsTreeRow[]
  dateRange: { start: Date; end: Date }
}>()

const ROW_HEIGHT = 36
const DAY_WIDTH = 24

function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

const allDates = computed<Date[]>(() => {
  const { start, end } = props.dateRange
  const days = diffDays(start, end)
  const result: Date[] = []
  for (let i = 0; i <= days; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    result.push(d)
  }
  return result
})

const ganttTotalWidth = computed(() => allDates.value.length * DAY_WIDTH)

/** 月ラベル */
const monthHeaders = computed<{ label: string; left: number; width: number }[]>(() => {
  const dates = allDates.value
  if (dates.length === 0) return []
  const groups: { label: string; startIdx: number; count: number }[] = []
  let current = ''
  for (let i = 0; i < dates.length; i++) {
    const d = dates[i]
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (key !== current) {
      current = key
      groups.push({ label: `${d.getMonth() + 1}月`, startIdx: i, count: 1 })
    } else {
      groups[groups.length - 1].count++
    }
  }
  return groups.map((g) => ({
    label: g.label,
    left: g.startIdx * DAY_WIDTH,
    width: g.count * DAY_WIDTH
  }))
})

/** 日番号ヘッダー */
const dayHeaders = computed<{ label: string; left: number; isWeekend: boolean }[]>(() => {
  return allDates.value.map((d, i) => ({
    label: String(d.getDate()),
    left: i * DAY_WIDTH,
    isWeekend: d.getDay() === 0 || d.getDay() === 6
  }))
})

/** 週末列のハイライト */
const weekendColumns = computed<{ left: number }[]>(() => {
  return allDates.value
    .map((d, i) => ({ left: i * DAY_WIDTH, isWeekend: d.getDay() === 0 || d.getDay() === 6 }))
    .filter((c) => c.isWeekend)
})

/** 月境界グリッド線 */
const monthBoundaries = computed<number[]>(() => {
  const lines: number[] = []
  for (let i = 0; i < allDates.value.length; i++) {
    if (allDates.value[i].getDate() === 1) {
      lines.push(i * DAY_WIDTH)
    }
  }
  return lines
})

/** ステータスに応じた色 */
const BAR_COLORS: Record<string, string> = {
  not_started: 'var(--p-text-muted-color)',
  in_progress: 'var(--p-primary-color)',
  done: 'var(--p-green-500)'
}

function barStyle(row: WbsTreeRow): Record<string, string> | null {
  if (!row.startDate || !row.endDate) return null
  const start = new Date(row.startDate)
  const end = new Date(row.endDate)
  const rangeStart = props.dateRange.start
  const leftDays = diffDays(rangeStart, start)
  const spanDays = diffDays(start, end) + 1
  return {
    left: `${leftDays * DAY_WIDTH}px`,
    width: `${spanDays * DAY_WIDTH}px`,
    background: BAR_COLORS[row.status] ?? BAR_COLORS.not_started
  }
}
</script>

<template>
  <div class="gantt-right">
    <div class="gantt-right-scroll">
      <div class="gantt-right-inner" :style="{ width: `${ganttTotalWidth}px` }">
        <!-- ヘッダー: 月 -->
        <div class="gantt-month-row" :style="{ height: `${ROW_HEIGHT}px` }">
          <div
            v-for="(mh, i) in monthHeaders"
            :key="i"
            class="month-cell"
            :style="{ left: `${mh.left}px`, width: `${mh.width}px`, height: `${ROW_HEIGHT}px` }"
          >
            {{ mh.label }}
          </div>
        </div>
        <!-- ヘッダー: 日 -->
        <div class="gantt-day-row" :style="{ height: `${ROW_HEIGHT}px` }">
          <div
            v-for="(dh, i) in dayHeaders"
            :key="i"
            class="day-cell"
            :class="{ 'day-cell--weekend': dh.isWeekend }"
            :style="{ left: `${dh.left}px`, width: `${DAY_WIDTH}px`, height: `${ROW_HEIGHT}px` }"
          >
            {{ dh.label }}
          </div>
        </div>
        <!-- バー行 -->
        <div class="gantt-body">
          <!-- 週末ハイライト -->
          <div
            v-for="(wc, i) in weekendColumns"
            :key="`wk-${i}`"
            class="weekend-col"
            :style="{ left: `${wc.left}px`, width: `${DAY_WIDTH}px` }"
          />
          <!-- 月境界線 -->
          <div
            v-for="(ml, i) in monthBoundaries"
            :key="`mb-${i}`"
            class="grid-line grid-line--month"
            :style="{ left: `${ml}px` }"
          />
          <!-- 各行 -->
          <div
            v-for="row in rows"
            :key="row.key"
            class="gantt-row"
            :style="{ height: `${ROW_HEIGHT}px` }"
          >
            <div
              v-if="barStyle(row)"
              class="gantt-bar"
              :style="barStyle(row)!"
            />
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

.gantt-month-row {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--p-content-hover-background);
  border-bottom: 1px solid var(--p-content-border-color);
  position: relative;
}

.month-cell {
  position: absolute;
  top: 0;
  display: flex;
  align-items: center;
  padding-left: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--p-text-muted-color);
  border-right: 1px solid var(--p-content-border-color);
  box-sizing: border-box;
}

.gantt-day-row {
  position: sticky;
  top: 36px;
  z-index: 2;
  background: var(--p-content-hover-background);
  border-bottom: 1px solid var(--p-content-border-color);
  position: relative;
}

.day-cell {
  position: absolute;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  color: var(--p-text-muted-color);
  box-sizing: border-box;
}

.day-cell--weekend {
  color: var(--p-red-400);
  background: rgba(255, 0, 0, 0.04);
}

.gantt-body {
  position: relative;
}

.weekend-col {
  position: absolute;
  top: 0;
  bottom: 0;
  background: rgba(255, 0, 0, 0.03);
  pointer-events: none;
}

.grid-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  pointer-events: none;
}

.grid-line--month {
  background: var(--p-content-border-color);
}

.gantt-row {
  position: relative;
  border-bottom: 1px solid var(--p-content-border-color);
}

.gantt-bar {
  position: absolute;
  top: 6px;
  height: 24px;
  border-radius: 3px;
  z-index: 1;
  opacity: 0.85;
}
</style>
