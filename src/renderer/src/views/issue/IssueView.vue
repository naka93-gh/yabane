<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Button from 'primevue/button'
import Select from 'primevue/select'
import SelectButton from 'primevue/selectbutton'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import { useProjectStore } from '../../stores/project'
import { useIssueStore } from '../../stores/issue'
import { useAppToast } from '../../composables/useAppToast'
import { formatDisplayDate } from '../../utils/date-helper'
import {
  ISSUE_STATUS_OPTIONS,
  ISSUE_STATUS_LABELS,
  PRIORITY_OPTIONS,
  PRIORITY_LABELS
} from '../../utils/constants'
import type { Issue } from '@shared/types/models'
import IssueDialog from './IssueDialog.vue'

const projectStore = useProjectStore()
const store = useIssueStore()
const confirm = useConfirm()
const toast = useAppToast()

const filterStatusOptions = [{ label: 'すべて', value: null }, ...ISSUE_STATUS_OPTIONS]
const filterPriorityOptions = [{ label: 'すべて', value: null }, ...PRIORITY_OPTIONS]

const SORT_OPTIONS = [
  { label: '起票日順', value: 'created_at' },
  { label: '期限順', value: 'due_date' },
  { label: '優先度順', value: 'priority' }
]

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3
}

const sortMode = ref<'created_at' | 'due_date' | 'priority'>('created_at')

const sortedIssues = computed(() => {
  const issues = [...store.filteredIssues]
  switch (sortMode.value) {
    case 'created_at':
      return issues.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    case 'due_date':
      return issues.sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      })
    case 'priority':
      return issues.sort(
        (a, b) => (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99)
      )
    default:
      return issues
  }
})

const expandedId = ref<number | null>(null)
const issueDialog = ref<InstanceType<typeof IssueDialog> | null>(null)

function toggleExpand(id: number): void {
  expandedId.value = expandedId.value === id ? null : id
}

watch(
  () => projectStore.currentProject?.id,
  async (projectId) => {
    if (projectId) {
      await store.fetchIssues(projectId)
    }
  },
  { immediate: true }
)

function confirmDelete(issue: Issue): void {
  confirm.require({
    message: `「${issue.title}」を削除しますか？`,
    header: '削除確認',
    acceptLabel: '削除',
    rejectLabel: 'キャンセル',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await store.removeIssue(issue.id)
        toast.success('削除しました')
      } catch {
        toast.error('削除に失敗しました')
      }
    }
  })
}

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
        <Button label="追加" icon="pi pi-plus" @click="issueDialog?.openCreate()" />
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
      <SelectButton
        v-model="sortMode"
        :options="SORT_OPTIONS"
        option-label="label"
        option-value="value"
        :allow-empty="false"
        class="sort-select"
      />
    </div>

    <div v-if="sortedIssues.length === 0 && !store.loading" class="empty-state">
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
        <span class="col-created">起票日</span>
        <span class="col-actions">&nbsp;</span>
      </div>
      <div v-for="issue in sortedIssues" :key="issue.id" class="table-row-group">
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
              {{ ISSUE_STATUS_LABELS[issue.status] }}
            </span>
          </span>
          <span class="col-owner">{{ issue.owner ?? '' }}</span>
          <span class="col-due">{{ formatDisplayDate(issue.due_date) }}</span>
          <span class="col-created">{{ formatDisplayDate(issue.created_at) }}</span>
          <span class="col-actions" @click.stop>
            <Button
              icon="pi pi-pencil"
              text
              rounded
              size="small"
              @click="issueDialog?.openEdit(issue)"
            />
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

    <IssueDialog ref="issueDialog" />
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

.sort-select {
  margin-left: auto;
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

.col-created {
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
</style>
