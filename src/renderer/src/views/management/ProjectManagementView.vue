<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import DatePicker from 'primevue/datepicker'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ToggleSwitch from 'primevue/toggleswitch'
import type { Project } from '@shared/types/models'
import { useProjectStore } from '../../stores/project'
import { listProjects } from '../../api/project'
import { useAppToast } from '../../composables/useAppToast'
import { formatDate, formatDisplayDate } from '../../utils/date-helper'
import { validateDateRange } from '../../utils/validators'
import { PROJECT_STATUSES } from '../../constants/project'

const STATUS_OPTIONS = PROJECT_STATUSES.filter((s) => s.value !== 'archived')

const store = useProjectStore()
const toast = useAppToast()

const emit = defineEmits<{ selectProject: [id: number] }>()

const newName = ref('')
const newDescription = ref('')
const newStartDate = ref<Date | null>(null)
const newEndDate = ref<Date | null>(null)
const showArchived = ref(false)

const dateError = computed(() => validateDateRange(newStartDate.value, newEndDate.value))

const archivedProjects = ref<Project[]>([])

const displayedProjects = computed(() =>
  showArchived.value ? archivedProjects.value : store.projects
)

async function fetchArchived(): Promise<void> {
  archivedProjects.value = await listProjects({ status: 'archived' })
}

watch(showArchived, (val) => {
  if (val) fetchArchived()
})

async function handleCreate(): Promise<void> {
  if (!newName.value.trim() || dateError.value) return
  try {
    const project = await store.createProject({
      name: newName.value.trim(),
      description: newDescription.value.trim() || undefined,
      start_date: newStartDate.value ? formatDate(newStartDate.value) : undefined,
      end_date: newEndDate.value ? formatDate(newEndDate.value) : undefined
    })
    newName.value = ''
    newDescription.value = ''
    newStartDate.value = null
    newEndDate.value = null
    toast.success('プロジェクトを作成しました')
    emit('selectProject', project.id)
  } catch {
    toast.error('プロジェクトの作成に失敗しました')
  }
}

async function handleArchive(project: Project): Promise<void> {
  try {
    await store.archiveProject(project.id)
    if (showArchived.value) await fetchArchived()
    toast.success('アーカイブしました')
  } catch {
    toast.error('アーカイブに失敗しました')
  }
}

async function handleUnarchive(project: Project): Promise<void> {
  try {
    await store.unarchiveProject(project.id)
    await fetchArchived()
    await store.fetchProjects()
    toast.success('復元しました')
  } catch {
    toast.error('復元に失敗しました')
  }
}

async function handleStatusChange(project: Project, status: Project['status']): Promise<void> {
  try {
    await store.updateProject(project.id, { status })
    toast.success('ステータスを変更しました')
  } catch {
    toast.error('ステータスの変更に失敗しました')
  }
}

function handleRowClick(event: { data: Project }): void {
  if (event.data.status === 'archived') return
  emit('selectProject', event.data.id)
}
</script>

<template>
  <div class="management-page">
    <h1 class="page-title">プロジェクト管理</h1>

    <section class="create-card">
      <div class="create-card-header">
        <h2>新規プロジェクト</h2>
      </div>
      <div class="create-card-body">
        <div class="form-row">
          <InputText v-model="newName" placeholder="プロジェクト名" class="form-input" />
        </div>
        <div class="form-row">
          <Textarea
            v-model="newDescription"
            placeholder="説明（任意）"
            rows="2"
            class="form-input"
          />
        </div>
        <div class="form-row-group">
          <div class="form-row">
            <label>開始日</label>
            <DatePicker
              v-model="newStartDate"
              date-format="yy/mm/dd"
              placeholder="開始日を選択"
              class="form-input"
              show-button-bar
            />
          </div>
          <div class="form-row">
            <label>終了日</label>
            <DatePicker
              v-model="newEndDate"
              date-format="yy/mm/dd"
              placeholder="終了日を選択"
              class="form-input"
              show-button-bar
            />
          </div>
        </div>
        <small v-if="dateError" class="date-error">{{ dateError }}</small>
        <Button
          label="作成"
          icon="pi pi-plus"
          size="small"
          :disabled="!newName.trim() || !!dateError"
          @click="handleCreate"
        />
      </div>
    </section>

    <section class="list-section">
      <div class="list-header">
        <h2>プロジェクト一覧</h2>
        <div class="archive-toggle">
          <label>アーカイブ済みを表示</label>
          <ToggleSwitch v-model="showArchived" />
        </div>
      </div>

      <DataTable
        :value="displayedProjects"
        size="small"
        striped-rows
        row-hover
        class="project-table"
        @row-click="handleRowClick"
      >
        <Column field="name" header="名前" />
        <Column field="description" header="説明" />
        <Column header="期間" style="width: 220px">
          <template #body="{ data }">
            <span v-if="data.start_date || data.end_date">
              {{ formatDisplayDate(data.start_date) }} 〜 {{ formatDisplayDate(data.end_date) }}
            </span>
          </template>
        </Column>
        <Column header="ステータス" style="width: 160px">
          <template #body="{ data }">
            <div @click.stop>
              <Select
                v-if="data.status !== 'archived'"
                :model-value="data.status"
                :options="STATUS_OPTIONS"
                option-label="label"
                option-value="value"
                size="small"
                class="status-select"
                @update:model-value="handleStatusChange(data, $event)"
              />
              <Tag v-else value="アーカイブ" severity="secondary" />
            </div>
          </template>
        </Column>
        <Column header="操作" style="width: 120px">
          <template #body="{ data }">
            <div class="action-buttons" @click.stop>
              <Button
                v-if="data.status !== 'archived'"
                v-tooltip.top="'アーカイブ'"
                icon="pi pi-inbox"
                severity="secondary"
                text
                rounded
                size="small"
                @click="handleArchive(data)"
              />
              <Button
                v-else
                v-tooltip.top="'復元'"
                icon="pi pi-replay"
                severity="secondary"
                text
                rounded
                size="small"
                @click="handleUnarchive(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </section>
  </div>
</template>

<style scoped>
.management-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 32px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 24px;
}

.create-card {
  margin-bottom: 32px;
  border: 1px solid var(--p-content-border-color);
  border-radius: 8px;
  background: var(--p-content-background);
}

.create-card-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--p-content-border-color);
}

.create-card-header h2 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.create-card-body {
  padding: 20px;
}

.form-row {
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
}

.form-row-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-row-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
}

.date-error {
  display: block;
  color: var(--p-red-400);
  margin-bottom: 8px;
}

.list-section h2 {
  font-size: 16px;
  font-weight: 600;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.archive-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.action-buttons {
  display: flex;
  gap: 4px;
}

.status-select {
  width: 100%;
}

.project-table :deep(tr.p-datatable-row-selectable) {
  cursor: pointer;
}
</style>
