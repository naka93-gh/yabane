<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import DatePicker from 'primevue/datepicker'
import Select from 'primevue/select'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import { formatDate } from '../utils/date-helper'
import { useProjectStore } from '../stores/project'
import { useIssueStore } from '../stores/issue'
import type { Issue } from '@shared/types/models'

const projectStore = useProjectStore()
const store = useIssueStore()
const confirm = useConfirm()

const STATUS_OPTIONS = [
  { label: 'オープン', value: 'open' },
  { label: '対応中', value: 'in_progress' },
  { label: '解決済み', value: 'resolved' },
  { label: 'クローズ', value: 'closed' }
]

const PRIORITY_OPTIONS = [
  { label: '低', value: 'low' },
  { label: '中', value: 'medium' },
  { label: '高', value: 'high' },
  { label: '最優先', value: 'critical' }
]

const STATUS_LABELS: Record<string, string> = {
  open: 'オープン',
  in_progress: '対応中',
  resolved: '解決済み',
  closed: 'クローズ'
}

const PRIORITY_LABELS: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '最優先'
}

// フィルタ用セレクト
const filterStatusOptions = [{ label: 'すべて', value: null }, ...STATUS_OPTIONS]
const filterPriorityOptions = [{ label: 'すべて', value: null }, ...PRIORITY_OPTIONS]

// 展開中の課題ID
const expandedId = ref<number | null>(null)

function toggleExpand(id: number): void {
  expandedId.value = expandedId.value === id ? null : id
}

// ダイアログ
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formTitle = ref('')
const formDescription = ref('')
const formOwner = ref('')
const formPriority = ref<Issue['priority']>('medium')
const formStatus = ref<Issue['status']>('open')
const formDueDate = ref<Date | null>(null)
const formResolution = ref('')

const dialogTitle = computed(() => (editingId.value ? '課題を編集' : '課題を追加'))

watch(
  () => projectStore.currentProject?.id,
  async (projectId) => {
    if (projectId) {
      await store.fetchIssues(projectId)
    }
  },
  { immediate: true }
)

function formatDisplayDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

function openCreate(): void {
  editingId.value = null
  formTitle.value = ''
  formDescription.value = ''
  formOwner.value = ''
  formPriority.value = 'medium'
  formStatus.value = 'open'
  formDueDate.value = null
  formResolution.value = ''
  dialogVisible.value = true
}

function openEdit(issue: Issue): void {
  editingId.value = issue.id
  formTitle.value = issue.title
  formDescription.value = issue.description ?? ''
  formOwner.value = issue.owner ?? ''
  formPriority.value = issue.priority
  formStatus.value = issue.status
  formDueDate.value = issue.due_date ? new Date(issue.due_date) : null
  formResolution.value = issue.resolution ?? ''
  dialogVisible.value = true
}

async function save(): Promise<void> {
  const projectId = projectStore.currentProject?.id
  if (!projectId || !formTitle.value.trim()) return

  const dueDate = formDueDate.value ? formatDate(formDueDate.value) : undefined

  if (editingId.value) {
    await store.editIssue({
      id: editingId.value,
      title: formTitle.value.trim(),
      description: formDescription.value || undefined,
      owner: formOwner.value || undefined,
      priority: formPriority.value,
      status: formStatus.value,
      dueDate,
      resolution: formResolution.value || undefined
    })
  } else {
    await store.addIssue({
      projectId,
      title: formTitle.value.trim(),
      description: formDescription.value || undefined,
      owner: formOwner.value || undefined,
      priority: formPriority.value,
      status: formStatus.value,
      dueDate
    })
  }
  dialogVisible.value = false
}

function confirmDelete(issue: Issue): void {
  confirm.require({
    message: `「${issue.title}」を削除しますか？`,
    header: '削除確認',
    acceptLabel: '削除',
    rejectLabel: 'キャンセル',
    acceptClass: 'p-button-danger',
    accept: () => store.removeIssue(issue.id)
  })
}

// フィルタ
const filterStatus = computed({
  get: () => store.filter.status,
  set: (v) => store.setFilter({ status: v })
})
const filterPriority = computed({
  get: () => store.filter.priority,
  set: (v) => store.setFilter({ priority: v })
})
</script>

<template>
  <div class="issue-view">
    <div class="issue-header">
      <h2>課題</h2>
      <div class="issue-header-actions">
        <Button
          v-if="store.filter.status !== null || store.filter.priority !== null"
          label="フィルタ解除"
          text
          size="small"
          @click="store.clearFilter()"
        />
        <Button label="追加" icon="pi pi-plus" @click="openCreate()" />
      </div>
    </div>

    <!-- フィルタバー -->
    <div class="filter-bar">
      <Select
        v-model="filterStatus"
        :options="filterStatusOptions"
        option-label="label"
        option-value="value"
        placeholder="ステータス"
        class="filter-select"
      />
      <Select
        v-model="filterPriority"
        :options="filterPriorityOptions"
        option-label="label"
        option-value="value"
        placeholder="優先度"
        class="filter-select"
      />
    </div>

    <div v-if="store.filteredIssues.length === 0 && !store.loading" class="empty-state">
      課題はまだありません
    </div>

    <!-- テーブル -->
    <div v-else class="issue-table">
      <div class="table-header">
        <span class="col-title">タイトル</span>
        <span class="col-priority">優先度</span>
        <span class="col-status">ステータス</span>
        <span class="col-owner">担当者</span>
        <span class="col-due">期限</span>
        <span class="col-actions">&nbsp;</span>
      </div>
      <div v-for="issue in store.filteredIssues" :key="issue.id" class="table-row-group">
        <div class="table-row" @click="toggleExpand(issue.id)">
          <span class="col-title">
            <i
              class="pi expand-icon"
              :class="expandedId === issue.id ? 'pi-chevron-down' : 'pi-chevron-right'"
            />
            {{ issue.title }}
          </span>
          <span class="col-priority">
            <span class="priority-badge" :class="`priority--${issue.priority}`">
              {{ PRIORITY_LABELS[issue.priority] }}
            </span>
          </span>
          <span class="col-status">
            <span class="status-badge" :class="`status--${issue.status}`">
              {{ STATUS_LABELS[issue.status] }}
            </span>
          </span>
          <span class="col-owner">{{ issue.owner ?? '' }}</span>
          <span class="col-due">{{ formatDisplayDate(issue.due_date) }}</span>
          <span class="col-actions" @click.stop>
            <Button icon="pi pi-pencil" text rounded size="small" @click="openEdit(issue)" />
            <Button
              icon="pi pi-trash"
              text
              rounded
              size="small"
              severity="danger"
              @click="confirmDelete(issue)"
            />
          </span>
        </div>
        <!-- 詳細展開パネル -->
        <div v-if="expandedId === issue.id" class="detail-panel">
          <div v-if="issue.description" class="detail-section">
            <div class="detail-label">説明</div>
            <div class="detail-text">{{ issue.description }}</div>
          </div>
          <div v-if="issue.resolution" class="detail-section">
            <div class="detail-label">対応内容</div>
            <div class="detail-text">{{ issue.resolution }}</div>
          </div>
          <div v-if="!issue.description && !issue.resolution" class="detail-empty">
            詳細情報はありません
          </div>
        </div>
      </div>
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
          <label>タイトル</label>
          <InputText v-model="formTitle" placeholder="課題タイトル" class="w-full" />
        </div>
        <div class="field">
          <label>説明</label>
          <Textarea
            v-model="formDescription"
            placeholder="課題の詳細説明（任意）"
            rows="3"
            class="w-full"
          />
        </div>
        <div class="field-row">
          <div class="field">
            <label>優先度</label>
            <Select
              v-model="formPriority"
              :options="PRIORITY_OPTIONS"
              option-label="label"
              option-value="value"
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
        <div class="field-row">
          <div class="field">
            <label>担当者</label>
            <InputText v-model="formOwner" placeholder="担当者（任意）" class="w-full" />
          </div>
          <div class="field">
            <label>期限</label>
            <DatePicker
              v-model="formDueDate"
              date-format="yy/mm/dd"
              placeholder="期限を選択"
              class="w-full"
            />
          </div>
        </div>
        <div v-if="editingId" class="field">
          <label>対応内容</label>
          <Textarea
            v-model="formResolution"
            placeholder="対応内容・解決策（任意）"
            rows="3"
            class="w-full"
          />
        </div>
      </div>
      <template #footer>
        <Button label="キャンセル" text @click="dialogVisible = false" />
        <Button label="保存" icon="pi pi-check" :disabled="!formTitle.trim()" @click="save" />
      </template>
    </Dialog>

    <ConfirmDialog />
  </div>
</template>

<style scoped>
.issue-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.issue-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.issue-header h2 {
  margin: 0;
}

.issue-header-actions {
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

/* === テーブル === */
.issue-table {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  border: 1px solid var(--p-content-border-color);
  border-radius: 8px;
  background: var(--p-content-background);
}

.table-header {
  display: flex;
  align-items: center;
  height: 36px;
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--p-text-muted-color);
  border-bottom: 1px solid var(--p-content-border-color);
  background: var(--p-content-hover-background);
  position: sticky;
  top: 0;
  z-index: 1;
}

.table-row {
  display: flex;
  align-items: center;
  height: 40px;
  border-bottom: 1px solid var(--p-content-border-color);
  cursor: pointer;
  transition: background 0.15s;
}

.table-row:hover {
  background: var(--p-content-hover-background);
}

.col-title {
  flex: 1;
  min-width: 0;
  padding: 0 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.expand-icon {
  font-size: 0.7rem;
  color: var(--p-text-muted-color);
  flex-shrink: 0;
}

.col-priority {
  width: 72px;
  min-width: 72px;
  padding: 0 8px;
}

.col-status {
  width: 88px;
  min-width: 88px;
  padding: 0 8px;
}

.col-owner {
  width: 100px;
  min-width: 100px;
  padding: 0 8px;
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col-due {
  width: 90px;
  min-width: 90px;
  padding: 0 8px;
  font-size: 0.8rem;
  color: var(--p-text-muted-color);
}

.col-actions {
  width: 64px;
  min-width: 64px;
  display: flex;
  gap: 0;
  flex-shrink: 0;
}

.col-actions :deep(.p-button) {
  width: 28px;
  height: 28px;
}

/* バッジ */
.status-badge,
.priority-badge {
  font-size: 0.65rem;
  padding: 2px 8px;
  border-radius: 8px;
  white-space: nowrap;
}

.status--open {
  background: var(--p-blue-100);
  color: var(--p-blue-700);
}

.status--in_progress {
  background: var(--p-primary-100);
  color: var(--p-primary-700);
}

.status--resolved {
  background: var(--p-green-100);
  color: var(--p-green-700);
}

.status--closed {
  background: var(--p-surface-200);
  color: var(--p-text-muted-color);
}

.priority--low {
  background: var(--p-surface-200);
  color: var(--p-text-muted-color);
}

.priority--medium {
  background: var(--p-blue-100);
  color: var(--p-blue-700);
}

.priority--high {
  background: var(--p-orange-100);
  color: var(--p-orange-700);
}

.priority--critical {
  background: var(--p-red-100);
  color: var(--p-red-700);
}

/* 詳細パネル */
.detail-panel {
  padding: 12px 20px 12px 36px;
  border-bottom: 1px solid var(--p-content-border-color);
  background: var(--p-content-hover-background);
}

.detail-section {
  margin-bottom: 8px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--p-text-muted-color);
  margin-bottom: 4px;
}

.detail-text {
  font-size: 0.85rem;
  white-space: pre-wrap;
  line-height: 1.5;
}

.detail-empty {
  font-size: 0.8rem;
  color: var(--p-text-muted-color);
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
