<script setup lang="ts">
import { ref, watch } from 'vue'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ConfirmDialog from 'primevue/confirmdialog'
import ToggleSwitch from 'primevue/toggleswitch'
import { useConfirm } from 'primevue/useconfirm'
import type { Member } from '@shared/types/models'
import type { DataTableRowReorderEvent } from 'primevue/datatable'
import { useProjectStore } from '../../stores/project'
import { useMemberStore } from '../../stores/member'
import { useAppToast } from '../../composables/useAppToast'
import MemberEditDialog from './MemberEditDialog.vue'

const projectStore = useProjectStore()
const store = useMemberStore()
const confirm = useConfirm()
const toast = useAppToast()

const newName = ref('')
const showArchived = ref(false)

// 編集ダイアログ
const editDialogVisible = ref(false)
const editTarget = ref<Member | null>(null)

watch(
  [() => projectStore.currentProject?.id, showArchived],
  async ([id, archived]) => {
    if (id) await store.fetchMembers(id, archived ? undefined : 0)
  },
  { immediate: true }
)

/** メンバーを追加し入力欄をリセットする */
async function handleAdd(): Promise<void> {
  const projectId = projectStore.currentProject?.id
  if (!projectId || !newName.value.trim()) return
  try {
    await store.addMember({ projectId, name: newName.value.trim() })
    newName.value = ''
  } catch {
    toast.error('メンバーの追加に失敗しました')
  }
}

/** 編集ダイアログを開く */
function openEdit(member: Member): void {
  editTarget.value = member
  editDialogVisible.value = true
}

/** 行の並び替え後に永続化する */
async function handleReorder(event: DataTableRowReorderEvent): Promise<void> {
  const reordered = event.value as Member[]
  store.members = reordered
  await store.reorder(reordered.map((m) => m.id))
}

/** メンバー一覧を CSV エクスポートする */
async function handleExportCsv(): Promise<void> {
  try {
    const saved = await store.exportCsv()
    if (saved) toast.success('CSV をエクスポートしました')
  } catch {
    toast.error('CSV エクスポートに失敗しました')
  }
}

/** CSV ファイルからメンバーをインポートする */
async function handleImportCsv(): Promise<void> {
  const projectId = projectStore.currentProject?.id
  if (!projectId) return
  try {
    const count = await store.importCsv(projectId)
    if (count > 0) toast.success(`${count} 件のメンバーをインポートしました`)
  } catch {
    toast.error('CSV インポートに失敗しました')
  }
}

/** メンバーをアーカイブする */
function handleArchive(member: Member): void {
  confirm.require({
    message: `「${member.name}」をアーカイブしますか？`,
    header: 'アーカイブ確認',
    acceptLabel: 'アーカイブ',
    rejectLabel: 'キャンセル',
    accept: async () => {
      try {
        await store.archiveMember(member.id)
        toast.success('メンバーをアーカイブしました')
      } catch {
        toast.error('アーカイブに失敗しました')
      }
    }
  })
}

/** アーカイブ済みメンバーを復元する */
async function handleUnarchive(member: Member): Promise<void> {
  try {
    await store.unarchiveMember(member.id)
    toast.success('メンバーを復元しました')
  } catch {
    toast.error('復元に失敗しました')
  }
}

/** 確認ダイアログを表示してからメンバーを削除する */
function handleDelete(member: Member): void {
  confirm.require({
    message: `「${member.name}」を完全に削除しますか？この操作は取り消せません。`,
    header: '削除確認',
    acceptLabel: '削除',
    rejectLabel: 'キャンセル',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await store.removeMember(member.id)
        toast.success('メンバーを削除しました')
      } catch {
        toast.error('メンバーの削除に失敗しました')
      }
    }
  })
}
</script>

<template>
  <div class="member-view">
    <h2>関係者</h2>
    <div v-if="!projectStore.currentProject" class="no-project">プロジェクトを選択してください</div>
    <template v-else>
      <div class="add-form">
        <InputText v-model="newName" placeholder="メンバー名を入力" class="add-input" />
        <Button
          label="追加"
          icon="pi pi-plus"
          size="small"
          :disabled="!newName.trim()"
          @click="handleAdd"
        />
        <Button
          v-tooltip.top="'CSV エクスポート'"
          icon="pi pi-download"
          severity="secondary"
          size="small"
          :disabled="store.members.length === 0"
          @click="handleExportCsv"
        />
        <Button
          v-tooltip.top="'CSV インポート'"
          icon="pi pi-upload"
          severity="secondary"
          size="small"
          @click="handleImportCsv"
        />
        <div class="archive-toggle">
          <label>アーカイブ済みを表示</label>
          <ToggleSwitch v-model="showArchived" />
        </div>
      </div>

      <DataTable
        :value="store.members"
        size="small"
        striped-rows
        :row-class="(data: Member) => ({ 'archived-row': data.archived === 1 })"
        @row-reorder="handleReorder"
      >
        <Column row-reorder style="width: 32px" />
        <Column field="organization" header="組織" />
        <Column field="name" header="名前" />
        <Column field="role" header="役割" />
        <Column field="email" header="メール" />
        <Column header="操作" style="width: 140px">
          <template #body="{ data }">
            <div class="action-buttons">
              <template v-if="data.archived === 1">
                <Button
                  v-tooltip.top="'復元'"
                  icon="pi pi-replay"
                  severity="info"
                  text
                  rounded
                  size="small"
                  @click="handleUnarchive(data)"
                />
                <Button
                  v-tooltip.top="'削除'"
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  size="small"
                  @click="handleDelete(data)"
                />
              </template>
              <template v-else>
                <Button
                  v-tooltip.top="'編集'"
                  icon="pi pi-pencil"
                  severity="secondary"
                  text
                  rounded
                  size="small"
                  @click="openEdit(data)"
                />
                <Button
                  v-tooltip.top="'アーカイブ'"
                  icon="pi pi-inbox"
                  severity="secondary"
                  text
                  rounded
                  size="small"
                  @click="handleArchive(data)"
                />
              </template>
            </div>
          </template>
        </Column>
      </DataTable>

      <ConfirmDialog />
      <MemberEditDialog v-model:visible="editDialogVisible" :member="editTarget" />
    </template>
  </div>
</template>

<style scoped>
.member-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.member-view h2 {
  margin: 0 0 12px;
}

.no-project {
  padding: 24px;
  text-align: center;
  color: var(--p-text-muted-color);
}

.add-form {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.add-input {
  flex: 1;
}

.action-buttons {
  display: flex;
  gap: 4px;
}

.archive-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  white-space: nowrap;
}

:deep(.archived-row) {
  opacity: 0.6;
}
</style>
