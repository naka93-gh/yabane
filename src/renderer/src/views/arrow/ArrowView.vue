<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Button from 'primevue/button'
import ToggleButton from 'primevue/togglebutton'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import { useProjectStore } from '../../stores/project'
import {
  buildAllDates,
  buildMonthHeaders,
  buildGridLines,
  buildMilestoneLines,
  calcTodayLeft,
  calcBarStyle,
  type GridLine
} from '../../utils/gantt-helper'
import { useArrowStore } from '../../stores/arrow'
import { useMilestoneStore } from '../../stores/milestone'
import { useAppToast } from '../../composables/useAppToast'
import { useListReorder } from '../../composables/useListReorder'
import type { Arrow } from '@shared/types/models'
import type { ArrowNode } from '../../stores/arrow'
import ArrowDialog from './ArrowDialog.vue'

const projectStore = useProjectStore()
const store = useArrowStore()
const milestoneStore = useMilestoneStore()
const confirm = useConfirm()
const toast = useAppToast()

const ROW_HEIGHT = 40
const DAY_WIDTH = 5

const showTodayLine = ref(true)
const showMilestones = ref(true)
const arrowDialog = ref<InstanceType<typeof ArrowDialog> | null>(null)

watch(
  () => projectStore.currentProject?.id,
  async (projectId) => {
    if (projectId) {
      await Promise.all([store.fetchArrows(projectId), milestoneStore.fetchMilestones(projectId)])
    }
  },
  { immediate: true }
)

const allDates = computed(() => buildAllDates(store.dateRange.start, store.dateRange.end))
const ganttTotalWidth = computed(() => allDates.value.length * DAY_WIDTH)
const monthHeaders = computed(() => buildMonthHeaders(allDates.value, DAY_WIDTH))
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

const statusLabel: Record<Arrow['status'], string> = {
  not_started: '未着手',
  in_progress: '進行中',
  done: '完了'
}

function barTooltip(arrow: Arrow): string {
  const parts = [arrow.name]
  if (arrow.start_date && arrow.end_date) {
    parts.push(`${arrow.start_date} 〜 ${arrow.end_date}`)
  }
  parts.push(statusLabel[arrow.status])
  return parts.join('\n')
}

function hasChildren(id: number): boolean {
  return store.arrows.some((a) => a.parent_id === id)
}

// --- ドラッグ＆ドロップ ---
const reorder = useListReorder<ArrowNode>({
  getId: (node) => node.arrow.id,
  onReorder: (ids) => store.reorder(ids),
  isSameGroup: (a, b) => a.arrow.parent_id === b.arrow.parent_id,
  getGroupItems: (node, items) =>
    items
      .filter((n) => n.arrow.parent_id === node.arrow.parent_id)
      .sort((a, b) => a.arrow.sort_order - b.arrow.sort_order || a.arrow.id - b.arrow.id)
})

function confirmDelete(a: Arrow): void {
  const hasChild = hasChildren(a.id)
  confirm.require({
    message: hasChild
      ? `「${a.name}」とその子要素をすべて削除しますか？`
      : `「${a.name}」を削除しますか？`,
    header: '削除確認',
    acceptLabel: '削除',
    rejectLabel: 'キャンセル',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await store.removeArrow(a.id)
        toast.success('削除しました')
      } catch {
        toast.error('削除に失敗しました')
      }
    }
  })
}
</script>

<template>
  <div class="arrow-view">
    <div class="arrow-header">
      <h2>矢羽</h2>
      <div class="arrow-header-actions">
        <ToggleButton
          v-model="showMilestones"
          on-label="MS"
          off-label="MS"
          on-icon="pi pi-flag"
          off-icon="pi pi-flag"
          :pt="{ root: { class: 'today-toggle' } }"
        />
        <ToggleButton
          v-model="showTodayLine"
          on-label="今日"
          off-label="今日"
          on-icon="pi pi-calendar-clock"
          off-icon="pi pi-calendar-clock"
          :pt="{ root: { class: 'today-toggle' } }"
        />
        <Button label="追加" icon="pi pi-plus" @click="arrowDialog?.openCreate(null)" />
      </div>
    </div>

    <div v-if="store.visibleTree.length === 0 && !store.loading" class="empty-state">
      矢羽はまだありません
    </div>

    <div v-else class="gantt-container">
      <!-- 左パネル: ツリーリスト -->
      <div class="gantt-left">
        <div class="gantt-left-header" :style="{ height: `${ROW_HEIGHT}px` }">
          <span>名前</span>
        </div>
        <div class="gantt-left-body">
          <div
            v-for="(node, i) in store.visibleTree"
            :key="node.arrow.id"
            class="left-row"
            :class="{ 'left-row--drag-over': reorder.dropIndex.value === i }"
            :style="{ height: `${ROW_HEIGHT}px`, paddingLeft: `${node.depth * 20 + 12}px` }"
            draggable="true"
            @dragstart="reorder.onDragStart(node, i, $event)"
            @dragover="reorder.onDragOver(node, i, $event)"
            @dragleave="reorder.onDragLeave"
            @drop="reorder.onDrop(node, store.visibleTree)"
            @dragend="reorder.onDragEnd"
          >
            <i class="pi pi-bars drag-handle" />
            <i
              v-if="hasChildren(node.arrow.id)"
              class="collapse-toggle"
              :class="store.collapsedIds.has(node.arrow.id) ? 'pi pi-chevron-right' : 'pi pi-chevron-down'"
              @click="store.toggleCollapse(node.arrow.id)"
            />
            <span v-else class="collapse-spacer" />
            <span class="left-row-name" :title="node.arrow.name">{{ node.arrow.name }}</span>
            <span class="left-row-actions">
              <Button
                icon="pi pi-plus"
                text
                rounded
                size="small"
                title="子矢羽を追加"
                @click="arrowDialog?.openCreate(node.arrow.id)"
              />
              <Button
                icon="pi pi-pencil"
                text
                rounded
                size="small"
                @click="arrowDialog?.openEdit(node.arrow)"
              />
              <Button
                icon="pi pi-trash"
                text
                rounded
                size="small"
                severity="danger"
                @click="confirmDelete(node.arrow)"
              />
            </span>
          </div>
        </div>
      </div>

      <!-- 中パネル: 担当者 -->
      <div class="gantt-owner">
        <div class="gantt-owner-header" :style="{ height: `${ROW_HEIGHT}px` }">
          <span>担当者</span>
        </div>
        <div class="gantt-owner-body">
          <div
            v-for="node in store.visibleTree"
            :key="node.arrow.id"
            class="owner-row"
            :style="{ height: `${ROW_HEIGHT}px` }"
          >
            <span class="owner-row-text" :title="node.arrow.owner ?? ''">
              {{ node.arrow.owner ?? '' }}
            </span>
          </div>
        </div>
      </div>

      <!-- 右パネル: ガントバー -->
      <div class="gantt-right">
        <div class="gantt-right-scroll">
          <div class="gantt-right-inner" :style="{ width: `${ganttTotalWidth}px` }">
            <!-- 月ヘッダー行 -->
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
    </div>

    <ArrowDialog ref="arrowDialog" />
    <ConfirmDialog />
  </div>
</template>

<style scoped>
.arrow-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.arrow-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.arrow-header h2 {
  margin: 0;
}

.empty-state {
  color: var(--p-text-muted-color);
  text-align: center;
  padding: 48px 0;
}

/* === ガントチャート全体 === */
.gantt-container {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  border: 1px solid var(--p-content-border-color);
  border-radius: 8px;
  background: var(--p-content-background);
}

/* === 左パネル === */
.gantt-left {
  width: 280px;
  min-width: 280px;
  border-right: 1px solid var(--p-content-border-color);
  flex-shrink: 0;
}

.gantt-left-header {
  display: flex;
  align-items: flex-end;
  padding: 0 12px 8px;
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--p-text-muted-color);
  border-bottom: 1px solid var(--p-content-border-color);
  position: sticky;
  top: 0;
  background: var(--p-content-hover-background);
  z-index: 2;
}

.left-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--p-content-border-color);
  gap: 4px;
}

.left-row--drag-over {
  border-top: 2px solid var(--p-primary-color);
}

.drag-handle {
  cursor: grab;
  color: var(--p-text-muted-color);
  padding: 4px 4px 4px 0;
  flex-shrink: 0;
  align-self: center;
}

.collapse-toggle {
  cursor: pointer;
  font-size: 0.75rem;
  color: var(--p-text-muted-color);
  width: 16px;
  text-align: center;
  flex-shrink: 0;
}

.collapse-toggle:hover {
  color: var(--p-text-color);
}

.collapse-spacer {
  width: 16px;
  flex-shrink: 0;
}

.left-row-name {
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.left-row-actions {
  display: flex;
  gap: 0;
  flex-shrink: 0;
}

.left-row-actions :deep(.p-button) {
  width: 28px;
  height: 28px;
}

/* === 中パネル: 担当者 === */
.gantt-owner {
  width: 100px;
  min-width: 100px;
  border-right: 1px solid var(--p-content-border-color);
  flex-shrink: 0;
}

.gantt-owner-header {
  display: flex;
  align-items: flex-end;
  padding: 0 8px 8px;
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--p-text-muted-color);
  border-bottom: 1px solid var(--p-content-border-color);
  position: sticky;
  top: 0;
  background: var(--p-content-hover-background);
  z-index: 2;
}

.owner-row {
  display: flex;
  align-items: center;
  padding: 0 8px;
  border-bottom: 1px solid var(--p-content-border-color);
}

.owner-row-text {
  font-size: 0.8rem;
  color: var(--p-text-muted-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* === 右パネル === */
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

/* 月ヘッダー */
.gantt-month-row {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--p-content-hover-background);
  border-bottom: 1px solid var(--p-content-border-color);
  display: flex;
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

.arrow-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.today-toggle {
  font-size: 0.8rem;
}
</style>
