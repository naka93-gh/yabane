<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import DatePicker from 'primevue/datepicker'
import Button from 'primevue/button'
import { useProjectStore } from '../../stores/project'
import { useAppToast } from '../../composables/useAppToast'
import { useNavigationGuard } from '../../composables/useNavigationGuard'
import { formatDate } from '../../utils/date-helper'
import { getProjectSummary } from '../../api/project'
import type { ProjectSummary } from '@shared/types/ipc'

const store = useProjectStore()
const toast = useAppToast()
const guard = useNavigationGuard()

// --- サマリ ---
const summary = ref<ProjectSummary | null>(null)

async function fetchSummary(projectId: number): Promise<void> {
  summary.value = await getProjectSummary({ projectId })
}

const summaryCards = computed(() => {
  const s = summary.value
  if (!s) return []
  return [
    { label: '矢羽', value: s.arrowCount, icon: 'pi pi-arrow-right' },
    { label: 'タスク', value: s.wbsItemCount, icon: 'pi pi-list-check' },
    {
      label: '課題',
      value: `${s.openIssueCount} / ${s.issueCount}`,
      icon: 'pi pi-exclamation-triangle',
      hint: 'オープン / 全体'
    },
    { label: 'マイルストーン', value: s.milestoneCount, icon: 'pi pi-flag' },
    { label: '関係者', value: s.memberCount, icon: 'pi pi-users' }
  ]
})

// --- 設定フォーム ---
const editName = ref('')
const editDescription = ref('')
const editStartDate = ref<Date | null>(null)
const editEndDate = ref<Date | null>(null)

const savedSnapshot = ref({
  name: '',
  description: '',
  startDate: null as Date | null,
  endDate: null as Date | null
})

function takeSnapshot(): void {
  savedSnapshot.value = {
    name: editName.value,
    description: editDescription.value,
    startDate: editStartDate.value,
    endDate: editEndDate.value
  }
}

const isDirty = computed(() => {
  const s = savedSnapshot.value
  return (
    editName.value !== s.name ||
    editDescription.value !== s.description ||
    editStartDate.value?.getTime() !== s.startDate?.getTime() ||
    editEndDate.value?.getTime() !== s.endDate?.getTime()
  )
})

watch(isDirty, (v) => guard.setDirty(v))
onBeforeUnmount(() => guard.reset())

const dateError = computed(() => {
  if (editStartDate.value && editEndDate.value && editStartDate.value > editEndDate.value) {
    return '開始日は終了日以前にしてください'
  }
  return ''
})

const canSave = computed(() => !!editName.value.trim() && !dateError.value)

function loadForm(): void {
  const p = store.currentProject
  if (!p) return
  editName.value = p.name
  editDescription.value = p.description ?? ''
  editStartDate.value = p.start_date ? new Date(p.start_date) : null
  editEndDate.value = p.end_date ? new Date(p.end_date) : null
  takeSnapshot()
}

watch(
  () => store.currentProject?.id,
  async (projectId) => {
    if (projectId) {
      loadForm()
      await fetchSummary(projectId)
    }
  },
  { immediate: true }
)

async function handleSave(): Promise<void> {
  if (!store.currentProject || !canSave.value) return
  try {
    await store.updateProject(store.currentProject.id, {
      name: editName.value.trim(),
      description: editDescription.value.trim() || undefined,
      start_date: editStartDate.value ? formatDate(editStartDate.value) : null,
      end_date: editEndDate.value ? formatDate(editEndDate.value) : null
    })
    loadForm()
    toast.success('プロジェクト設定を更新しました')
  } catch {
    toast.error('プロジェクト設定の更新に失敗しました')
  }
}
</script>

<template>
  <div class="settings-view">
    <div class="settings-header">
      <h2>プロジェクト設定</h2>
      <Button
        label="保存"
        icon="pi pi-save"
        :severity="isDirty ? 'warn' : 'primary'"
        :badge="isDirty ? '!' : undefined"
        :disabled="!canSave || !isDirty"
        @click="handleSave"
      />
    </div>

    <!-- サマリカード -->
    <div v-if="summary" class="summary-grid">
      <div v-for="card in summaryCards" :key="card.label" class="summary-card">
        <div class="summary-icon">
          <i :class="card.icon" />
        </div>
        <div class="summary-body">
          <span class="summary-value">{{ card.value }}</span>
          <span class="summary-label">{{ card.label }}</span>
          <span v-if="card.hint" class="summary-hint">{{ card.hint }}</span>
        </div>
      </div>
    </div>

    <!-- 設定フォーム -->
    <div class="settings-form">
      <div class="form-row">
        <label>プロジェクト名</label>
        <InputText v-model="editName" class="w-full" />
      </div>
      <div class="form-row">
        <label>説明</label>
        <Textarea v-model="editDescription" rows="2" class="w-full" />
      </div>
      <div class="form-row-group">
        <div class="form-row">
          <label>開始日</label>
          <DatePicker
            v-model="editStartDate"
            date-format="yy/mm/dd"
            placeholder="開始日を選択"
            class="w-full"
            show-button-bar
          />
        </div>
        <div class="form-row">
          <label>終了日</label>
          <DatePicker
            v-model="editEndDate"
            date-format="yy/mm/dd"
            placeholder="終了日を選択"
            class="w-full"
            show-button-bar
          />
        </div>
      </div>
      <small v-if="dateError" class="date-error">{{ dateError }}</small>
    </div>
  </div>
</template>

<style scoped>
.settings-view {
  height: 100%;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.settings-header h2 {
  margin: 0;
}

/* サマリカード */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 32px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--p-content-border-color);
  border-radius: 8px;
  background: var(--p-content-background);
}

.summary-icon {
  font-size: 20px;
  color: var(--p-primary-color);
}

.summary-body {
  display: flex;
  flex-direction: column;
}

.summary-value {
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.2;
}

.summary-label {
  font-size: 0.8rem;
  color: var(--p-text-muted-color);
}

.summary-hint {
  font-size: 0.7rem;
  color: var(--p-text-muted-color);
}

/* 設定フォーム */
.settings-form {
  max-width: 560px;
}

.form-row {
  margin-bottom: 16px;
}

.form-row label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
}

.form-row-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.date-error {
  color: var(--p-red-400);
}

.w-full {
  width: 100%;
}
</style>
