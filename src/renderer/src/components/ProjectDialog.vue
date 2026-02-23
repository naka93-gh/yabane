<script setup lang="ts">
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ToggleSwitch from 'primevue/toggleswitch'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import type { Project } from '@shared/types/models'
import { useProjectStore } from '../stores/project'
import { listProjects } from '../api/project'
import { useAppToast } from '../composables/useAppToast'
import MemberPanel from './MemberPanel.vue'

const store = useProjectStore()
const toast = useAppToast()

const newName = ref('')
const newDescription = ref('')
const showArchived = ref(false)
const archivedProjects = ref<Project[]>([])
const activeTab = ref('0')

// ダイアログ表示時にフォームをリセットし一覧を再取得
watch(
  () => store.dialogVisible,
  async (visible) => {
    if (visible) {
      await store.fetchProjects()
      newName.value = ''
      newDescription.value = ''
      showArchived.value = false
      activeTab.value = '0'
    }
  }
)

// アーカイブ表示トグル切替時にアーカイブ済み一覧を取得
watch(showArchived, async (val) => {
  if (val) {
    archivedProjects.value = await listProjects({ status: 'archived' })
  }
})

// トグル状態に応じて表示するプロジェクト一覧を切り替える
const displayedProjects = ref<Project[]>([])
watch(
  [() => store.projects, () => archivedProjects.value, showArchived],
  () => {
    displayedProjects.value = showArchived.value ? archivedProjects.value : store.projects
  },
  { immediate: true }
)

/** プロジェクトを作成して選択状態にする */
async function handleCreate(): Promise<void> {
  if (!newName.value.trim()) return
  try {
    const project = await store.createProject(
      newName.value.trim(),
      newDescription.value.trim() || undefined
    )
    await store.selectProject(project.id)
    newName.value = ''
    newDescription.value = ''
    toast.success('プロジェクトを作成しました')
  } catch {
    toast.error('プロジェクトの作成に失敗しました')
  }
}

/** プロジェクトをアーカイブしてアーカイブ一覧を更新する */
async function handleArchive(project: Project): Promise<void> {
  try {
    await store.archiveProject(project.id)
    archivedProjects.value = await listProjects({ status: 'archived' })
    toast.success('アーカイブしました')
  } catch {
    toast.error('アーカイブに失敗しました')
  }
}

/** プロジェクトを復元して両方の一覧を更新する */
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
</script>

<template>
  <Dialog
    v-model:visible="store.dialogVisible"
    header="プロジェクト管理"
    :modal="true"
    :style="{ width: '700px' }"
  >
    <Tabs v-model:value="activeTab">
      <TabList>
        <Tab value="0">プロジェクト</Tab>
        <Tab value="1">関係者</Tab>
      </TabList>
      <TabPanels>
        <TabPanel value="0">
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
          </div>
        </TabPanel>
        <TabPanel value="1">
          <MemberPanel />
        </TabPanel>
      </TabPanels>
    </Tabs>
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
