<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Button from 'primevue/button'
import ToggleButton from 'primevue/togglebutton'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import DatePicker from 'primevue/datepicker'
import Select from 'primevue/select'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import { useProjectStore } from '../stores/project'
import { formatDate } from '../utils/date-helper'
import {
  buildAllDates,
  buildMonthHeaders,
  buildGridLines,
  buildMilestoneLines,
  calcTodayLeft,
  calcBarStyle,
  type GridLine
} from '../utils/gantt-helper'
import { useArrowStore } from '../stores/arrow'
import { useMilestoneStore } from '../stores/milestone'
import { useAppToast } from '../composables/useAppToast'
import type { Arrow } from '@shared/types/models'
import type { ArrowNode } from '../stores/arrow'

const projectStore = useProjectStore()
const store = useArrowStore()
const milestoneStore = useMilestoneStore()
const confirm = useConfirm()
const toast = useAppToast()

const ROW_HEIGHT = 40
const DAY_WIDTH = 14

const STATUS_OPTIONS = [
  { label: '未着手', value: 'not_started' },
  { label: '進行中', value: 'in_progress' },
  { label: '完了', value: 'done' }
]

// 今日線
const showTodayLine = ref(true)

// ダイアログ
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formParentId = ref<number | null>(null)
const formName = ref('')
const formOwner = ref('')
const formStartDate = ref<Date | null>(null)
const formEndDate = ref<Date | null>(null)
const formStatus = ref<Arrow['status']>('not_started')

const dialogTitle = computed(() => (editingId.value ? '矢羽を編集' : '矢羽を追加'))

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

// --- CRUD ---
function openCreate(parentId: number | null = null): void {
  editingId.value = null
  formParentId.value = parentId
  formName.value = ''
  formOwner.value = ''
  formStartDate.value = null
  formEndDate.value = null
  formStatus.value = 'not_started'
  dialogVisible.value = true
}

function openEdit(a: Arrow): void {
  editingId.value = a.id
  formParentId.value = a.parent_id
  formName.value = a.name
  formOwner.value = a.owner ?? ''
  formStartDate.value = a.start_date ? new Date(a.start_date) : null
  formEndDate.value = a.end_date ? new Date(a.end_date) : null
  formStatus.value = a.status
  dialogVisible.value = true
}

async function save(): Promise<void> {
  const projectId = projectStore.currentProject?.id
  if (!projectId || !formName.value.trim()) return

  const startDate = formStartDate.value ? formatDate(formStartDate.value) : undefined
  const endDate = formEndDate.value ? formatDate(formEndDate.value) : undefined
  const isEdit = !!editingId.value

  try {
    if (editingId.value) {
      await store.editArrow({
        id: editingId.value,
        name: formName.value.trim(),
        owner: formOwner.value || undefined,
        startDate,
        endDate,
        status: formStatus.value
      })
    } else {
      await store.addArrow({
        projectId,
        parentId: formParentId.value ?? undefined,
        name: formName.value.trim(),
        owner: formOwner.value || undefined,
        startDate,
        endDate,
        status: formStatus.value
      })
    }
    dialogVisible.value = false
    toast.success(isEdit ? '更新しました' : '作成しました')
  } catch {
    toast.error(isEdit ? '更新に失敗しました' : '作成に失敗しました')
  }
}

function hasChildren(id: number): boolean {
  return store.arrows.some((a) => a.parent_id === id)
}

// --- ドラッグ＆ドロップ ---
const dragNodeId = ref<number | null>(null)
const dragParentId = ref<number | null>(null)
const dropTargetId = ref<number | null>(null)

function onDragStart(node: ArrowNode, e: DragEvent): void {
  dragNodeId.value = node.arrow.id
  dragParentId.value = node.arrow.parent_id
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
  }
}

function onDragOver(node: ArrowNode, e: DragEvent): void {
  if (dragNodeId.value === null) return
  if (node.arrow.parent_id !== dragParentId.value) return
  if (node.arrow.id === dragNodeId.value) return
  e.preventDefault()
  dropTargetId.value = node.arrow.id
}

function onDragLeave(): void {
  dropTargetId.value = null
}

function onDragEnd(): void {
  dragNodeId.value = null
  dragParentId.value = null
  dropTargetId.value = null
}

async function onDrop(node: ArrowNode): Promise<void> {
  const fromId = dragNodeId.value
  const parentId = dragParentId.value
  if (fromId === null || fromId === node.arrow.id) {
    onDragEnd()
    return
  }
  if (node.arrow.parent_id !== parentId) {
    onDragEnd()
    return
  }
  const siblings = store.arrows
    .filter((a) => a.parent_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
  const ids = siblings.map((a) => a.id)
  const fromIdx = ids.indexOf(fromId)
  const toIdx = ids.indexOf(node.arrow.id)
  if (fromIdx === -1 || toIdx === -1) {
    onDragEnd()
    return
  }
  ids.splice(fromIdx, 1)
  ids.splice(toIdx, 0, fromId)
  onDragEnd()
  await store.reorder(ids)
}

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
          v-model="showTodayLine"
          on-label="今日"
          off-label="今日"
          on-icon="pi pi-calendar-clock"
          off-icon="pi pi-calendar-clock"
          :pt="{ root: { class: 'today-toggle' } }"
        />
        <Button label="追加" icon="pi pi-plus" @click="openCreate(null)" />
      </div>
    </div>

    <div v-if="store.tree.length === 0 && !store.loading" class="empty-state">
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
            v-for="node in store.tree"
            :key="node.arrow.id"
            class="left-row"
            :class="{ 'left-row--drag-over': dropTargetId === node.arrow.id }"
            :style="{ height: `${ROW_HEIGHT}px`, paddingLeft: `${node.depth * 20 + 12}px` }"
            draggable="true"
            @dragstart="onDragStart(node, $event)"
            @dragover="onDragOver(node, $event)"
            @dragleave="onDragLeave"
            @drop="onDrop(node)"
            @dragend="onDragEnd"
          >
            <i class="pi pi-bars drag-handle" />
            <span class="left-row-name" :title="node.arrow.name">{{ node.arrow.name }}</span>
            <span class="left-row-actions">
              <Button
                icon="pi pi-plus"
                text
                rounded
                size="small"
                title="子矢羽を追加"
                @click="openCreate(node.arrow.id)"
              />
              <Button icon="pi pi-pencil" text rounded size="small" @click="openEdit(node.arrow)" />
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
                v-for="node in store.tree"
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
                <div v-if="barStyle(node.arrow)" class="gantt-bar" :style="barStyle(node.arrow)!" />
              </div>
              <!-- マイルストーン縦線 -->
              <div
                v-for="ml in milestoneLines"
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

    <!-- 作成/編集ダイアログ -->
    <Dialog
      v-model:visible="dialogVisible"
      :header="dialogTitle"
      :modal="true"
      :style="{ width: '480px' }"
    >
      <div class="dialog-form">
        <div class="field">
          <label>名前</label>
          <InputText v-model="formName" placeholder="矢羽名" class="w-full" />
        </div>
        <div class="field">
          <label>担当者</label>
          <InputText v-model="formOwner" placeholder="担当者（任意）" class="w-full" />
        </div>
        <div class="field">
          <label>開始日</label>
          <DatePicker
            v-model="formStartDate"
            date-format="yy/mm/dd"
            placeholder="開始日を選択"
            class="w-full"
          />
        </div>
        <div class="field">
          <label>終了日</label>
          <DatePicker
            v-model="formEndDate"
            date-format="yy/mm/dd"
            placeholder="終了日を選択"
            class="w-full"
          />
        </div>
        <div class="field">
          <label>ステータス</label>
          <Select
            v-model="formStatus"
            :options="STATUS_OPTIONS"
            option-label="label"
            option-value="value"
            class="w-full"
          />
        </div>
      </div>
      <template #footer>
        <Button label="キャンセル" text @click="dialogVisible = false" />
        <Button label="保存" icon="pi pi-check" :disabled="!formName.trim()" @click="save" />
      </template>
    </Dialog>

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

/* === ダイアログ === */
.dialog-form .field {
  margin-bottom: 16px;
}

.dialog-form .field label {
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
}

.w-full {
  width: 100%;
}
</style>
