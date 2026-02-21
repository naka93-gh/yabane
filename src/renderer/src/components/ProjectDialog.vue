<script setup lang="ts">
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ToggleSwitch from 'primevue/toggleswitch'
import type { Project } from '../types/models'
import { useProjectStore } from '../stores/project'
import { listProjects } from '../api/project'

const store = useProjectStore()

const newName = ref('')
const newDescription = ref('')
const showArchived = ref(false)
const archivedProjects = ref<Project[]>([])

watch(
  () => store.dialogVisible,
  async (visible) => {
    if (visible) {
      await store.fetchProjects()
      newName.value = ''
      newDescription.value = ''
      showArchived.value = false
    }
  }
)

watch(showArchived, async (val) => {
  if (val) {
    archivedProjects.value = await listProjects({ status: 'archived' })
  }
})

const displayedProjects = ref<Project[]>([])
watch(
  [() => store.projects, () => archivedProjects.value, showArchived],
  () => {
    displayedProjects.value = showArchived.value ? archivedProjects.value : store.projects
  },
  { immediate: true }
)

async function handleCreate(): Promise<void> {
  if (!newName.value.trim()) return
  const project = await store.createProject(newName.value.trim(), newDescription.value.trim() || undefined)
  await store.selectProject(project.id)
  newName.value = ''
  newDescription.value = ''
}

async function handleArchive(project: Project): Promise<void> {
  await store.archiveProject(project.id)
  archivedProjects.value = await listProjects({ status: 'archived' })
}

async function handleUnarchive(project: Project): Promise<void> {
  await store.unarchiveProject(project.id)
  archivedProjects.value = await listProjects({ status: 'archived' })
  await store.fetchProjects()
}
</script>

<template>
  <Dialog
    v-model:visible="store.dialogVisible"
    header="プロジェクト管理"
    :modal="true"
    :style="{ width: '640px' }"
  >
    <div class="create-form">
      <h4>新規プロジェクト</h4>
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

    <div class="project-list">
      <div class="list-header">
        <h4>プロジェクト一覧</h4>
        <div class="archive-toggle">
          <label>アーカイブ済みを表示</label>
          <ToggleSwitch v-model="showArchived" />
        </div>
      </div>

      <DataTable :value="displayedProjects" size="small" striped-rows>
        <Column field="name" header="名前" />
        <Column field="description" header="説明" />
        <Column field="status" header="ステータス" style="width: 100px" />
        <Column header="操作" style="width: 120px">
          <template #body="{ data }">
            <div class="action-buttons">
              <Button
                v-if="data.status === 'active'"
                icon="pi pi-inbox"
                severity="secondary"
                text
                rounded
                size="small"
                v-tooltip.top="'アーカイブ'"
                @click="handleArchive(data)"
              />
              <Button
                v-else
                icon="pi pi-replay"
                severity="secondary"
                text
                rounded
                size="small"
                v-tooltip.top="'復元'"
                @click="handleUnarchive(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </Dialog>
</template>

<style scoped>
.create-form {
  margin-bottom: 24px;
}

.create-form h4 {
  margin-bottom: 8px;
}

.form-row {
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
}

.project-list {
  margin-top: 8px;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
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
</style>
