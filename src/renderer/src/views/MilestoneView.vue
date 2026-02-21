<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import DatePicker from 'primevue/datepicker'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import { useProjectStore } from '../stores/project'
import { useMilestoneStore } from '../stores/milestone'
import type { Milestone } from '../types/models'

const projectStore = useProjectStore()
const store = useMilestoneStore()
const confirm = useConfirm()

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

// ダイアログ
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formName = ref('')
const formDescription = ref('')
const formDueDate = ref<Date | null>(null)
const formColor = ref('#6366f1')

const dialogTitle = computed(() => (editingId.value ? 'マイルストーンを編集' : 'マイルストーンを追加'))

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

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function save(): Promise<void> {
  const projectId = projectStore.currentProject?.id
  if (!projectId || !formName.value.trim()) return

  const dueDate = formDueDate.value ? formatDate(formDueDate.value) : undefined

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
}

function confirmDelete(m: Milestone): void {
  confirm.require({
    message: `「${m.name}」を削除しますか？`,
    header: '削除確認',
    acceptLabel: '削除',
    rejectLabel: 'キャンセル',
    acceptClass: 'p-button-danger',
    accept: () => store.removeMilestone(m.id)
  })
}

function displayDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}
</script>

<template>
  <div class="milestone-view">
    <div class="milestone-header">
      <h2>マイルストーン</h2>
      <Button label="追加" icon="pi pi-plus" @click="openCreate" />
    </div>

    <div v-if="store.milestones.length === 0 && !store.loading" class="empty-state">
      マイルストーンはまだありません
    </div>

    <div class="milestone-list">
      <div
        v-for="m in store.milestones"
        :key="m.id"
        class="milestone-card"
        :style="{ borderLeftColor: m.color }"
      >
        <div class="card-body">
          <div class="card-main">
            <span class="card-name">{{ m.name }}</span>
            <span v-if="m.due_date" class="card-due">
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
  max-width: 800px;
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
  border: 1px solid var(--p-surface-200);
  border-left: 4px solid;
  border-radius: 8px;
  padding: 16px;
  background: var(--p-surface-0);
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
  box-shadow: 0 0 0 2px var(--p-surface-0), 0 0 0 4px var(--p-text-muted-color);
}
</style>
