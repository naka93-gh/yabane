<script setup lang="ts">
import { ref, watch } from 'vue'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import ConfirmDialog from 'primevue/confirmdialog'
import Textarea from 'primevue/textarea'
import { useConfirm } from 'primevue/useconfirm'
import type { Member } from '@shared/types/models'
import { useProjectStore } from '../stores/project'
import { useMemberStore } from '../stores/member'
import { useAppToast } from '../composables/useAppToast'

const projectStore = useProjectStore()
const store = useMemberStore()
const confirm = useConfirm()
const toast = useAppToast()

const newName = ref('')

// 編集ダイアログ
const editDialogVisible = ref(false)
const editForm = ref<{
  id: number
  name: string
  role: string
  organization: string
  email: string
  note: string
}>({ id: 0, name: '', role: '', organization: '', email: '', note: '' })

watch(
  () => projectStore.currentProject?.id,
  async (id) => {
    if (id) await store.fetchMembers(id)
  },
  { immediate: true }
)

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

function openEdit(member: Member): void {
  editForm.value = {
    id: member.id,
    name: member.name,
    role: member.role ?? '',
    organization: member.organization ?? '',
    email: member.email ?? '',
    note: member.note ?? ''
  }
  editDialogVisible.value = true
}

async function saveEdit(): Promise<void> {
  if (!editForm.value.name.trim()) return
  try {
    await store.editMember({
      id: editForm.value.id,
      name: editForm.value.name.trim(),
      role: editForm.value.role || undefined,
      organization: editForm.value.organization || undefined,
      email: editForm.value.email || undefined,
      note: editForm.value.note || undefined
    })
    editDialogVisible.value = false
    toast.success('メンバーを更新しました')
  } catch {
    toast.error('メンバーの更新に失敗しました')
  }
}

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
  <div v-if="!projectStore.currentProject" class="no-project">プロジェクトを選択してください</div>
  <div v-else>
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

    <DataTable :value="store.members" size="small" striped-rows>
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
    <Dialog
      v-model:visible="editDialogVisible"
      header="メンバーを編集"
      :modal="true"
      :style="{ width: '440px' }"
    >
      <div class="edit-form">
        <div class="field">
          <label>名前</label>
          <InputText v-model="editForm.name" class="w-full" />
        </div>
        <div class="field">
          <label>役割</label>
          <InputText v-model="editForm.role" placeholder="役割（任意）" class="w-full" />
        </div>
        <div class="field">
          <label>組織</label>
          <InputText v-model="editForm.organization" placeholder="組織（任意）" class="w-full" />
        </div>
        <div class="field">
          <label>メール</label>
          <InputText v-model="editForm.email" placeholder="メール（任意）" class="w-full" />
        </div>
        <div class="field">
          <label>備考</label>
          <Textarea v-model="editForm.note" placeholder="備考（任意）" rows="2" class="w-full" />
        </div>
      </div>
      <template #footer>
        <Button label="キャンセル" text @click="editDialogVisible = false" />
        <Button
          label="保存"
          icon="pi pi-check"
          :disabled="!editForm.name.trim()"
          @click="saveEdit"
        />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
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

.edit-form .field {
  margin-bottom: 14px;
}

.edit-form .field label {
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
  font-size: 0.85rem;
}

.w-full {
  width: 100%;
}
</style>
