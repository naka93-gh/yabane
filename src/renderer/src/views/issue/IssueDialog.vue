<script setup lang="ts">
import { ref, computed } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import DatePicker from 'primevue/datepicker'
import Select from 'primevue/select'
import Button from 'primevue/button'
import { formatDate } from '../../utils/date-helper'
import { useProjectStore } from '../../stores/project'
import { useIssueStore } from '../../stores/issue'
import { useAppToast } from '../../composables/useAppToast'
import { ISSUE_STATUS_OPTIONS, PRIORITY_OPTIONS } from '../../utils/constants'
import type { Issue } from '@shared/types/models'

const projectStore = useProjectStore()
const store = useIssueStore()
const toast = useAppToast()

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

const emit = defineEmits<{ saved: [] }>()

async function save(): Promise<void> {
  const projectId = projectStore.currentProject?.id
  if (!projectId || !formTitle.value.trim()) return

  const dueDate = formDueDate.value ? formatDate(formDueDate.value) : undefined
  const isEdit = !!editingId.value

  try {
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
    toast.success(isEdit ? '更新しました' : '作成しました')
    emit('saved')
  } catch {
    toast.error(isEdit ? '更新に失敗しました' : '作成に失敗しました')
  }
}

defineExpose({ openCreate, openEdit })
</script>

<template>
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
            :options="ISSUE_STATUS_OPTIONS"
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
</template>

<style scoped>
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
