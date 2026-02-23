<script setup lang="ts">
import { ref, computed } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import AutoComplete from 'primevue/autocomplete'
import DatePicker from 'primevue/datepicker'
import Select from 'primevue/select'
import Button from 'primevue/button'
import { formatDate } from '../../utils/date-helper'
import { useProjectStore } from '../../stores/project'
import { useArrowStore } from '../../stores/arrow'
import { useAppToast } from '../../composables/useAppToast'
import { useOwnerSuggestions } from '../../composables/useOwnerSuggestions'
import { TASK_STATUS_OPTIONS } from '../../utils/constants'
import type { Arrow } from '@shared/types/models'

const projectStore = useProjectStore()
const store = useArrowStore()
const toast = useAppToast()
const { suggestions, search } = useOwnerSuggestions()

const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formParentId = ref<number | null>(null)
const formName = ref('')
const formOwner = ref('')
const formStartDate = ref<Date | null>(null)
const formEndDate = ref<Date | null>(null)
const formStatus = ref<Arrow['status']>('not_started')

const dialogTitle = computed(() => (editingId.value ? '矢羽を編集' : '矢羽を追加'))

function openCreate(parentId: number | null = null): void {
  editingId.value = null
  formParentId.value = parentId
  formName.value = ''
  formOwner.value = ''
  formStartDate.value = null
  formEndDate.value = null
  formStatus.value = 'not_started'
  dialogVisible.value = true
}

function openEdit(a: Arrow): void {
  editingId.value = a.id
  formParentId.value = a.parent_id
  formName.value = a.name
  formOwner.value = a.owner ?? ''
  formStartDate.value = a.start_date ? new Date(a.start_date) : null
  formEndDate.value = a.end_date ? new Date(a.end_date) : null
  formStatus.value = a.status
  dialogVisible.value = true
}

const emit = defineEmits<{ saved: [] }>()

async function save(): Promise<void> {
  const projectId = projectStore.currentProject?.id
  if (!projectId || !formName.value.trim()) return

  const startDate = formStartDate.value ? formatDate(formStartDate.value) : undefined
  const endDate = formEndDate.value ? formatDate(formEndDate.value) : undefined
  const isEdit = !!editingId.value

  try {
    if (editingId.value) {
      await store.editArrow({
        id: editingId.value,
        name: formName.value.trim(),
        owner: formOwner.value || undefined,
        startDate,
        endDate,
        status: formStatus.value
      })
    } else {
      await store.addArrow({
        projectId,
        parentId: formParentId.value ?? undefined,
        name: formName.value.trim(),
        owner: formOwner.value || undefined,
        startDate,
        endDate,
        status: formStatus.value
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
    :style="{ width: '480px' }"
  >
    <div class="dialog-form">
      <div class="field">
        <label>名前</label>
        <InputText v-model="formName" placeholder="矢羽名" class="w-full" />
      </div>
      <div class="field">
        <label>担当者</label>
        <AutoComplete
          v-model="formOwner"
          :suggestions="suggestions"
          placeholder="担当者（任意）"
          complete-on-focus
          class="w-full"
          @complete="search"
        />
      </div>
      <div class="field">
        <label>開始日</label>
        <DatePicker
          v-model="formStartDate"
          date-format="yy/mm/dd"
          placeholder="開始日を選択"
          class="w-full"
        />
      </div>
      <div class="field">
        <label>終了日</label>
        <DatePicker
          v-model="formEndDate"
          date-format="yy/mm/dd"
          placeholder="終了日を選択"
          class="w-full"
        />
      </div>
      <div class="field">
        <label>ステータス</label>
        <Select
          v-model="formStatus"
          :options="TASK_STATUS_OPTIONS"
          option-label="label"
          option-value="value"
          class="w-full"
        />
      </div>
    </div>
    <template #footer>
      <Button label="キャンセル" text @click="dialogVisible = false" />
      <Button label="保存" icon="pi pi-check" :disabled="!formName.trim()" @click="save" />
    </template>
  </Dialog>
</template>

<style scoped>
.dialog-form .field {
  margin-bottom: 16px;
}

.dialog-form .field label {
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
}

.w-full {
  width: 100%;
}
</style>
