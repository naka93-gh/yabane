<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import DatePicker from 'primevue/datepicker'
import Select from 'primevue/select'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import { formatDate } from '../../utils/date-helper'
import { useProjectStore } from '../../stores/project'
import { useArrowStore } from '../../stores/arrow'
import { useWbsStore, type WbsTreeRow } from '../../stores/wbs'
import type { WbsItem } from '@shared/types/models'
import WbsGantt from './WbsGantt.vue'

const projectStore = useProjectStore()
const arrowStore = useArrowStore()
const store = useWbsStore()
const confirm = useConfirm()

const ROW_HEIGHT = 36

const STATUS_OPTIONS = [
  { label: '未着手', value: 'not_started' },
  { label: '進行中', value: 'in_progress' },
  { label: '完了', value: 'done' }
]

const STATUS_LABELS: Record<string, string> = {
  not_started: '未着手',
  in_progress: '進行中',
  done: '完了'
}

// --- ダイアログ ---
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formArrowId = ref<number | null>(null)
const formName = ref('')
const formOwner = ref('')
const formStartDate = ref<Date | null>(null)
const formEndDate = ref<Date | null>(null)
const formStatus = ref<WbsItem['status']>('not_started')
const formProgress = ref(0)
const formEstimatedHours = ref<number | null>(null)
const formActualHours = ref<number | null>(null)

const dialogTitle = computed(() => (editingId.value ? 'タスクを編集' : 'タスクを追加'))

// 子矢羽セレクト用
const arrowOptions = computed(() => store.childArrows.map((a) => ({ label: a.name, value: a.id })))

// フィルタ用セレクト
const filterArrowOptions = computed(() => [
  { label: 'すべて', value: null },
  ...store.childArrows.map((a) => ({ label: a.name, value: a.id }))
])
const filterStatusOptions = computed(() => [{ label: 'すべて', value: null }, ...STATUS_OPTIONS])
const filterOwnerOptions = computed(() => [
  { label: 'すべて', value: null },
  ...store.owners.map((o) => ({ label: o, value: o }))
])

// データ取得
watch(
  () => projectStore.currentProject?.id,
  async (projectId) => {
    if (projectId) {
      await Promise.all([arrowStore.fetchArrows(projectId), store.fetchItems(projectId)])
    }
  },
  { immediate: true }
)

// --- 日付ユーティリティ ---

// --- CRUD ---
function openCreate(arrowId?: number): void {
  editingId.value = null
  formArrowId.value = arrowId ?? store.childArrows[0]?.id ?? null
  formName.value = ''
  formOwner.value = ''
  formStartDate.value = null
  formEndDate.value = null
  formStatus.value = 'not_started'
  formProgress.value = 0
  formEstimatedHours.value = null
  formActualHours.value = null
  dialogVisible.value = true
}

function openEdit(item: WbsItem): void {
  editingId.value = item.id
  formArrowId.value = item.arrow_id
  formName.value = item.name
  formOwner.value = item.owner ?? ''
  formStartDate.value = item.start_date ? new Date(item.start_date) : null
  formEndDate.value = item.end_date ? new Date(item.end_date) : null
  formStatus.value = item.status
  formProgress.value = item.progress
  formEstimatedHours.value = item.estimated_hours
  formActualHours.value = item.actual_hours
  dialogVisible.value = true
}

async function save(): Promise<void> {
  if (!formName.value.trim() || !formArrowId.value) return

  const startDate = formStartDate.value ? formatDate(formStartDate.value) : undefined
  const endDate = formEndDate.value ? formatDate(formEndDate.value) : undefined

  if (editingId.value) {
    await store.editItem({
      id: editingId.value,
      arrowId: formArrowId.value,
      name: formName.value.trim(),
      owner: formOwner.value || undefined,
      startDate,
      endDate,
      status: formStatus.value,
      progress: formProgress.value,
      estimatedHours: formEstimatedHours.value ?? undefined,
      actualHours: formActualHours.value ?? undefined
    })
  } else {
    await store.addItem({
      arrowId: formArrowId.value,
      name: formName.value.trim(),
      owner: formOwner.value || undefined,
      startDate,
      endDate,
      status: formStatus.value,
      progress: formProgress.value,
      estimatedHours: formEstimatedHours.value ?? undefined
    })
  }
  dialogVisible.value = false
}

function confirmDelete(row: WbsTreeRow): void {
  if (!row.task) return
  confirm.require({
    message: `「${row.task.name}」を削除しますか？`,
    header: '削除確認',
    acceptLabel: '削除',
    rejectLabel: 'キャンセル',
    acceptClass: 'p-button-danger',
    accept: () => store.removeItem(row.task!.id)
  })
}

// フィルタ
const filterArrow = computed({
  get: () => store.filter.arrowId,
  set: (v) => store.setFilter({ arrowId: v })
})
const filterStatus = computed({
  get: () => store.filter.status,
  set: (v) => store.setFilter({ status: v })
})
const filterOwner = computed({
  get: () => store.filter.owner,
  set: (v) => store.setFilter({ owner: v })
})
</script>

<template>
  <div class="wbs-view">
    <div class="wbs-header">
      <h2>WBS</h2>
      <div class="wbs-header-actions">
        <Button
          v-if="
            store.filter.arrowId !== null ||
            store.filter.status !== null ||
            store.filter.owner !== null
          "
          label="フィルタ解除"
          text
          size="small"
          @click="store.clearFilter()"
        />
        <Button
          label="タスク追加"
          icon="pi pi-plus"
          @click="openCreate()"
          :disabled="arrowOptions.length === 0"
        />
      </div>
    </div>

    <!-- フィルタバー -->
    <div v-if="store.childArrows.length > 0" class="filter-bar">
      <Select
        v-model="filterArrow"
        :options="filterArrowOptions"
        option-label="label"
        option-value="value"
        placeholder="矢羽"
        class="filter-select"
      />
      <Select
        v-model="filterStatus"
        :options="filterStatusOptions"
        option-label="label"
        option-value="value"
        placeholder="ステータス"
        class="filter-select"
      />
      <Select
        v-model="filterOwner"
        :options="filterOwnerOptions"
        option-label="label"
        option-value="value"
        placeholder="担当者"
        class="filter-select"
      />
    </div>

    <div v-if="arrowOptions.length === 0 && !store.loading" class="empty-state">
      子矢羽を先に追加してください
    </div>

    <div v-else-if="store.tree.length === 0 && !store.loading" class="empty-state">
      タスクはまだありません
    </div>

    <div v-else class="gantt-container">
      <!-- 左パネル: ツリー -->
      <div class="gantt-left">
        <div class="gantt-left-header" :style="{ height: `${ROW_HEIGHT * 2}px` }">
          <span class="col-parent">親矢羽</span>
          <span class="col-child">子矢羽</span>
          <span class="col-task">タスク</span>
          <span class="col-status">状態</span>
          <span class="col-actions">&nbsp;</span>
        </div>
        <div class="gantt-left-body">
          <div
            v-for="row in store.tree"
            :key="row.key"
            class="left-row"
            :style="{ height: `${ROW_HEIGHT}px` }"
          >
            <span class="col-parent" :class="{ 'cell-merged': !row.showParentName }">
              <template v-if="row.showParentName">{{ row.parentArrow?.name }}</template>
            </span>
            <span class="col-child" :class="{ 'cell-merged': !row.showChildName }">
              <template v-if="row.showChildName">{{ row.childArrow?.name }}</template>
            </span>
            <span class="col-task" :title="row.type === 'task' ? row.name : ''">
              {{ row.type === 'task' ? row.name : row.type === 'child' ? '—' : '' }}
            </span>
            <span class="col-status">
              <span
                v-if="row.type === 'task'"
                class="status-badge"
                :class="`status--${row.status}`"
              >
                {{ STATUS_LABELS[row.status] ?? row.status }}
              </span>
            </span>
            <span class="col-actions">
              <template v-if="row.type === 'task' && row.task">
                <Button
                  icon="pi pi-pencil"
                  text
                  rounded
                  size="small"
                  @click="openEdit(row.task!)"
                />
                <Button
                  icon="pi pi-trash"
                  text
                  rounded
                  size="small"
                  severity="danger"
                  @click="confirmDelete(row)"
                />
              </template>
              <template v-else-if="row.childArrow">
                <Button
                  icon="pi pi-plus"
                  text
                  rounded
                  size="small"
                  title="タスクを追加"
                  @click="openCreate(row.childArrow!.id)"
                />
              </template>
            </span>
          </div>
        </div>
      </div>

      <!-- 右パネル: ガント -->
      <WbsGantt :rows="store.tree" :date-range="store.dateRange" />
    </div>

    <!-- CRUD ダイアログ -->
    <Dialog
      v-model:visible="dialogVisible"
      :header="dialogTitle"
      :modal="true"
      :style="{ width: '520px' }"
    >
      <div class="dialog-form">
        <div class="field">
          <label>タスク名</label>
          <InputText v-model="formName" placeholder="タスク名" class="w-full" />
        </div>
        <div class="field">
          <label>所属矢羽</label>
          <Select
            v-model="formArrowId"
            :options="arrowOptions"
            option-label="label"
            option-value="value"
            placeholder="子矢羽を選択"
            class="w-full"
          />
        </div>
        <div class="field">
          <label>担当者</label>
          <InputText v-model="formOwner" placeholder="担当者（任意）" class="w-full" />
        </div>
        <div class="field-row">
          <div class="field">
            <label>開始日</label>
            <DatePicker
              v-model="formStartDate"
              date-format="yy/mm/dd"
              placeholder="開始日"
              class="w-full"
            />
          </div>
          <div class="field">
            <label>終了日</label>
            <DatePicker
              v-model="formEndDate"
              date-format="yy/mm/dd"
              placeholder="終了日"
              class="w-full"
            />
          </div>
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
        <div class="field-row">
          <div class="field">
            <label>進捗 (%)</label>
            <InputNumber v-model="formProgress" :min="0" :max="100" suffix="%" class="w-full" />
          </div>
          <div class="field">
            <label>見積工数 (h)</label>
            <InputNumber
              v-model="formEstimatedHours"
              :min="0"
              :max-fraction-digits="1"
              class="w-full"
            />
          </div>
          <div v-if="editingId" class="field">
            <label>実績工数 (h)</label>
            <InputNumber
              v-model="formActualHours"
              :min="0"
              :max-fraction-digits="1"
              class="w-full"
            />
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="キャンセル" text @click="dialogVisible = false" />
        <Button
          label="保存"
          icon="pi pi-check"
          :disabled="!formName.trim() || !formArrowId"
          @click="save"
        />
      </template>
    </Dialog>

    <ConfirmDialog />
  </div>
</template>

<style scoped>
.wbs-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.wbs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.wbs-header h2 {
  margin: 0;
}

.wbs-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.filter-select {
  width: 160px;
}

.empty-state {
  color: var(--p-text-muted-color);
  text-align: center;
  padding: 48px 0;
}

/* === ガント全体 === */
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
  min-width: 560px;
  border-right: 1px solid var(--p-content-border-color);
  flex-shrink: 0;
}

.gantt-left-header {
  display: flex;
  align-items: flex-end;
  padding-bottom: 8px;
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--p-text-muted-color);
  border-bottom: 1px solid var(--p-content-border-color);
  position: sticky;
  top: 0;
  background: var(--p-content-hover-background);
  z-index: 3;
}

.left-row {
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--p-content-border-color);
  font-size: 0.8rem;
}

.col-parent {
  width: 120px;
  min-width: 120px;
  padding: 0 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col-child {
  width: 120px;
  min-width: 120px;
  padding: 0 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col-task {
  width: 140px;
  min-width: 140px;
  padding: 0 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.col-status {
  width: 56px;
  min-width: 56px;
  padding: 0 4px;
}

.col-actions {
  width: 64px;
  min-width: 64px;
  display: flex;
  gap: 0;
  flex-shrink: 0;
}

.col-actions :deep(.p-button) {
  width: 26px;
  height: 26px;
}

.cell-merged {
  border-left-color: transparent;
}

/* ステータスバッジ */
.status-badge {
  font-size: 0.65rem;
  padding: 1px 6px;
  border-radius: 8px;
  white-space: nowrap;
}

.status--not_started {
  background: var(--p-surface-200);
  color: var(--p-text-muted-color);
}

.status--in_progress {
  background: var(--p-primary-100);
  color: var(--p-primary-700);
}

.status--done {
  background: var(--p-green-100);
  color: var(--p-green-700);
}

/* === ダイアログ === */
.dialog-form .field {
  margin-bottom: 14px;
  flex: 1;
}

.dialog-form .field label {
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
  font-size: 0.85rem;
}

.field-row {
  display: flex;
  gap: 12px;
}

.w-full {
  width: 100%;
}
</style>
