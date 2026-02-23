<script setup lang="ts">
import { ref, watch } from 'vue'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ToggleSwitch from 'primevue/toggleswitch'
import type { Project } from '@shared/types/models'
import { useProjectStore } from '../../stores/project'
import { listProjects } from '../../api/project'
import { useAppToast } from '../../composables/useAppToast'

const store = useProjectStore()
const toast = useAppToast()

const emit = defineEmits<{ selectProject: [id: number] }>()

const newName = ref('')
const newDescription = ref('')
const showArchived = ref(false)
const archivedProjects = ref<Project[]>([])

const displayedProjects = ref<Project[]>([])

watch(showArchived, async (val) => {
  if (val) {
    archivedProjects.value = await listProjects({ status: 'archived' })
  }
})

watch(
  [() => store.projects, () => archivedProjects.value, showArchived],
  () => {
    displayedProjects.value = showArchived.value ? archivedProjects.value : store.projects
  },
  { immediate: true }
)

async function handleCreate(): Promise<void> {
  if (!newName.value.trim()) return
  try {
    const project = await store.createProject(
      newName.value.trim(),
      newDescription.value.trim() || undefined
    )
    newName.value = ''
    newDescription.value = ''
    toast.success('プロジェクトを作成しました')
    emit('selectProject', project.id)
  } catch {
    toast.error('プロジェクトの作成に失敗しました')
  }
}

async function handleArchive(project: Project): Promise<void> {
  try {
    await store.archiveProject(project.id)
    archivedProjects.value = await listProjects({ status: 'archived' })
    toast.success('アーカイブしました')
  } catch {
    toast.error('アーカイブに失敗しました')
  }
}

async function handleUnarchive(project: Project): Promise<void> {
  try {
    await store.unarchiveProject(project.id)
    archivedProjects.value = await listProjects({ status: 'archived' })
    await store.fetchProjects()
    toast.success('復元しました')
  } catch {
    toast.error('復元に失敗しました')
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

    <section class="create-section">
      <h2>新規プロジェクト</h2>
      <div class="create-form">
        <div class="form-row">
          <InputText
            v-model="newName"
            placeholder="プロジェクト名"
            class="form-input"
            @keydown.enter="handleCreate"
          />
        </div>
        <div class="form-row">
          <Textarea
            v-model="newDescription"
            placeholder="説明（任意）"
            rows="2"
            class="form-input"
          />
        </div>
        <Button
          label="作成"
          icon="pi pi-plus"
          size="small"
          :disabled="!newName.trim()"
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
        <Column field="status" header="ステータス" style="width: 100px" />
        <Column header="操作" style="width: 120px">
          <template #body="{ data }">
            <div class="action-buttons" @click.stop>
              <Button
                v-if="data.status === 'active'"
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

.create-section {
  margin-bottom: 32px;
}

.create-section h2 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}

.create-form {
  max-width: 480px;
}

.form-row {
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
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

.project-table :deep(tr.p-datatable-row-selectable) {
  cursor: pointer;
}
</style>
