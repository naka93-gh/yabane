<script setup lang="ts">
import { ref, watch } from 'vue'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ConfirmDialog from 'primevue/confirmdialog'
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

// 編集ダイアログ
const editDialogVisible = ref(false)
const editTarget = ref<Member | null>(null)

watch(
  () => projectStore.currentProject?.id,
  async (id) => {
    if (id) await store.fetchMembers(id)
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

/** 確認ダイアログを表示してからメンバーを削除する */
function handleDelete(member: Member): void {
  confirm.require({
    message: `「${member.name}」を削除しますか？`,
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
        <InputText
          v-model="newName"
          placeholder="メンバー名を入力"
          class="add-input"
          @keydown.enter="handleAdd"
        />
        <Button
          label="追加"
          icon="pi pi-plus"
          size="small"
          :disabled="!newName.trim()"
          @click="handleAdd"
        />
      </div>

      <DataTable :value="store.members" size="small" striped-rows @row-reorder="handleReorder">
        <Column row-reorder style="width: 32px" />
        <Column field="organization" header="組織" />
        <Column field="name" header="名前" />
        <Column field="role" header="役割" />
        <Column field="email" header="メール" />
        <Column header="操作" style="width: 100px">
          <template #body="{ data }">
            <div class="action-buttons">
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
                v-tooltip.top="'削除'"
                icon="pi pi-trash"
                severity="danger"
                text
                rounded
                size="small"
                @click="handleDelete(data)"
              />
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
</style>
