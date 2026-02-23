<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import DatePicker from 'primevue/datepicker'
import SelectButton from 'primevue/selectbutton'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import { formatDate } from '../utils/date-helper'
import { useProjectStore } from '../stores/project'
import { useMilestoneStore } from '../stores/milestone'
import { useAppToast } from '../composables/useAppToast'
import type { Milestone } from '@shared/types/models'

const projectStore = useProjectStore()
const store = useMilestoneStore()
const confirm = useConfirm()
const toast = useAppToast()

const PRESET_COLORS = [
  { name: 'red', value: '#ef4444' },
  { name: 'orange', value: '#f97316' },
  { name: 'yellow', value: '#eab308' },
  { name: 'green', value: '#22c55e' },
  { name: 'cyan', value: '#06b6d4' },
  { name: 'blue', value: '#3b82f6' },
  { name: 'indigo', value: '#6366f1' },
  { name: 'purple', value: '#a855f7' },
  { name: 'pink', value: '#ec4899' },
  { name: 'gray', value: '#6b7280' }
]

const SORT_OPTIONS = [
  { label: '手動', value: 'manual' },
  { label: '期日順', value: 'due_date' }
]

// ソートモード
const sortMode = ref<'manual' | 'due_date'>('manual')

// ダイアログ
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formName = ref('')
const formDescription = ref('')
const formDueDate = ref<Date | null>(null)
const formColor = ref('#6366f1')

const dialogTitle = computed(() => (editingId.value ? 'マイルストーンを編集' : 'マイルストーンを追加'))

// ソート済みマイルストーン
const sortedMilestones = computed<Milestone[]>(() => {
  if (sortMode.value === 'due_date') {
    return [...store.milestones].sort((a, b) => {
      if (!a.due_date && !b.due_date) return 0
      if (!a.due_date) return 1
      if (!b.due_date) return -1
      return a.due_date.localeCompare(b.due_date)
    })
  }
  return store.milestones
})

// 期日超過判定
function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false
  const today = formatDate(new Date())
  return dateStr < today
}

watch(
  () => projectStore.currentProject?.id,
  async (projectId) => {
    if (projectId) {
      await store.fetchMilestones(projectId)
    }
  },
  { immediate: true }
)

function openCreate(): void {
  editingId.value = null
  formName.value = ''
  formDescription.value = ''
  formDueDate.value = null
  formColor.value = '#6366f1'
  dialogVisible.value = true
}

function openEdit(m: Milestone): void {
  editingId.value = m.id
  formName.value = m.name
  formDescription.value = m.description ?? ''
  formDueDate.value = m.due_date ? new Date(m.due_date) : null
  formColor.value = m.color
  dialogVisible.value = true
}

async function save(): Promise<void> {
  const projectId = projectStore.currentProject?.id
  if (!projectId || !formName.value.trim()) return

  const dueDate = formDueDate.value ? formatDate(formDueDate.value) : undefined
  const isEdit = !!editingId.value

  try {
    if (editingId.value) {
      await store.editMilestone({
        id: editingId.value,
        name: formName.value.trim(),
        description: formDescription.value || undefined,
        dueDate,
        color: formColor.value
      })
    } else {
      await store.addMilestone({
        projectId,
        name: formName.value.trim(),
        description: formDescription.value || undefined,
        dueDate,
        color: formColor.value
      })
    }
    dialogVisible.value = false
    toast.success(isEdit ? '更新しました' : '作成しました')
  } catch {
    toast.error(isEdit ? '更新に失敗しました' : '作成に失敗しました')
  }
}

function confirmDelete(m: Milestone): void {
  confirm.require({
    message: `「${m.name}」を削除しますか？`,
    header: '削除確認',
    acceptLabel: '削除',
    rejectLabel: 'キャンセル',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await store.removeMilestone(m.id)
        toast.success('削除しました')
      } catch {
        toast.error('削除に失敗しました')
      }
    }
  })
}

function displayDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

// --- ドラッグ並べ替え ---
const dragIndex = ref<number | null>(null)
const dropIndex = ref<number | null>(null)

function onDragStart(index: number, e: DragEvent): void {
  dragIndex.value = index
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
  }
}

function onDragOver(index: number, e: DragEvent): void {
  e.preventDefault()
  dropIndex.value = index
}

function onDragEnd(): void {
  dragIndex.value = null
  dropIndex.value = null
}

async function onDrop(index: number): Promise<void> {
  const from = dragIndex.value
  if (from === null || from === index) {
    onDragEnd()
    return
  }
  const ids = store.milestones.map((m) => m.id)
  const [moved] = ids.splice(from, 1)
  ids.splice(index, 0, moved)
  onDragEnd()
  await store.reorder(ids)
}
</script>

<template>
  <div class="milestone-view">
    <div class="milestone-header">
      <h2>マイルストーン</h2>
      <div class="milestone-header-actions">
        <SelectButton
          v-model="sortMode"
          :options="SORT_OPTIONS"
          option-label="label"
          option-value="value"
          :allow-empty="false"
        />
        <Button label="追加" icon="pi pi-plus" @click="openCreate" />
      </div>
    </div>

    <div v-if="store.milestones.length === 0 && !store.loading" class="empty-state">
      マイルストーンはまだありません
    </div>

    <div class="milestone-list">
      <div
        v-for="(m, i) in sortedMilestones"
        :key="m.id"
        class="milestone-card"
        :class="{
          'milestone-card--overdue': isOverdue(m.due_date),
          'milestone-card--drag-over': dropIndex === i && dragIndex !== i
        }"
        :style="{ borderLeftColor: m.color }"
        :draggable="sortMode === 'manual'"
        @dragstart="sortMode === 'manual' && onDragStart(i, $event)"
        @dragover="sortMode === 'manual' && onDragOver(i, $event)"
        @drop="sortMode === 'manual' && onDrop(i)"
        @dragend="onDragEnd"
      >
        <i v-if="sortMode === 'manual'" class="pi pi-bars drag-handle" />
        <div class="card-body">
          <div class="card-main">
            <span class="card-name">{{ m.name }}</span>
            <span
              v-if="m.due_date"
              class="card-due"
              :class="{ 'card-due--overdue': isOverdue(m.due_date) }"
            >
              <i class="pi pi-calendar" />
              {{ displayDate(m.due_date) }}
            </span>
          </div>
          <p v-if="m.description" class="card-description">{{ m.description }}</p>
        </div>
        <div class="card-actions">
          <Button icon="pi pi-pencil" text rounded size="small" @click="openEdit(m)" />
          <Button
            icon="pi pi-trash"
            text
            rounded
            size="small"
            severity="danger"
            @click="confirmDelete(m)"
          />
        </div>
      </div>
    </div>

    <!-- 作成/編集ダイアログ -->
    <Dialog v-model:visible="dialogVisible" :header="dialogTitle" :modal="true" :style="{ width: '480px' }">
      <div class="dialog-form">
        <div class="field">
          <label>名前</label>
          <InputText v-model="formName" placeholder="マイルストーン名" class="w-full" />
        </div>
        <div class="field">
          <label>期日</label>
          <DatePicker v-model="formDueDate" date-format="yy/mm/dd" placeholder="期日を選択" class="w-full" />
        </div>
        <div class="field">
          <label>メモ</label>
          <Textarea v-model="formDescription" auto-resize rows="3" placeholder="メモ（任意）" class="w-full" />
        </div>
        <div class="field">
          <label>カラー</label>
          <div class="color-picker">
            <button
              v-for="c in PRESET_COLORS"
              :key="c.name"
              class="color-swatch"
              :class="{ selected: formColor === c.value }"
              :style="{ backgroundColor: c.value }"
              :title="c.name"
              @click="formColor = c.value"
            />
          </div>
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
.milestone-view {
  /* レスポンシブ: max-width 制限なし */
}

.milestone-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.milestone-header h2 {
  margin: 0;
}

.milestone-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.empty-state {
  color: var(--p-text-muted-color);
  text-align: center;
  padding: 48px 0;
}

.milestone-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.milestone-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  border: 1px solid var(--p-content-border-color);
  border-left: 4px solid;
  border-radius: 8px;
  padding: 16px;
  background: var(--p-content-background);
  transition: background 0.15s, border-color 0.15s;
}

.milestone-card--overdue {
  border-color: var(--p-red-200);
  background: color-mix(in srgb, var(--p-red-50) 40%, var(--p-content-background));
}

.milestone-card--drag-over {
  border-top: 2px solid var(--p-primary-color);
}

.drag-handle {
  cursor: grab;
  color: var(--p-text-muted-color);
  padding: 4px 8px 4px 0;
  flex-shrink: 0;
  align-self: center;
}

.card-body {
  flex: 1;
  min-width: 0;
}

.card-main {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.card-name {
  font-weight: 600;
  font-size: 1rem;
}

.card-due {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  color: var(--p-text-muted-color);
}

.card-due--overdue {
  color: var(--p-red-500);
  font-weight: 700;
}

.card-description {
  margin: 8px 0 0;
  font-size: 0.9rem;
  color: var(--p-text-muted-color);
  white-space: pre-wrap;
}

.card-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

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

.color-picker {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: border-color 0.15s;
}

.color-swatch:hover {
  opacity: 0.8;
}

.color-swatch.selected {
  border-color: var(--p-text-color);
  box-shadow: 0 0 0 2px var(--p-content-background), 0 0 0 4px var(--p-text-muted-color);
}
</style>
