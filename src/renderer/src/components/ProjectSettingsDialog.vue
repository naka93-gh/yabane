<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import DatePicker from 'primevue/datepicker'
import Button from 'primevue/button'
import { useProjectStore } from '../stores/project'
import { useAppToast } from '../composables/useAppToast'
import { formatDate } from '../utils/date-helper'

const store = useProjectStore()
const toast = useAppToast()

const visible = ref(false)
const editName = ref('')
const editDescription = ref('')
const editStartDate = ref<Date | null>(null)
const editEndDate = ref<Date | null>(null)

const dateError = computed(() => {
  if (editStartDate.value && editEndDate.value && editStartDate.value > editEndDate.value) {
    return '開始日は終了日以前にしてください'
  }
  return ''
})

const canSave = computed(() => !!editName.value.trim() && !dateError.value)

// ダイアログを開く際にフォームを現在のプロジェクト情報で初期化
watch(visible, (v) => {
  if (v && store.currentProject) {
    const p = store.currentProject
    editName.value = p.name
    editDescription.value = p.description ?? ''
    editStartDate.value = p.start_date ? new Date(p.start_date) : null
    editEndDate.value = p.end_date ? new Date(p.end_date) : null
  }
})

async function handleSave(): Promise<void> {
  if (!store.currentProject || !canSave.value) return
  try {
    await store.updateProject(store.currentProject.id, {
      name: editName.value.trim(),
      description: editDescription.value.trim() || undefined,
      start_date: editStartDate.value ? formatDate(editStartDate.value) : null,
      end_date: editEndDate.value ? formatDate(editEndDate.value) : null
    })
    visible.value = false
    toast.success('プロジェクト設定を更新しました')
  } catch {
    toast.error('プロジェクト設定の更新に失敗しました')
  }
}

function open(): void {
  visible.value = true
}

defineExpose({ open })
</script>

<template>
  <Dialog
    v-model:visible="visible"
    header="プロジェクト設定"
    :modal="true"
    :style="{ width: '480px' }"
  >
    <div class="settings-form">
      <div class="form-row">
        <label>プロジェクト名</label>
        <InputText v-model="editName" class="form-input" />
      </div>
      <div class="form-row">
        <label>説明</label>
        <Textarea v-model="editDescription" rows="2" class="form-input" />
      </div>
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
      <small v-if="dateError" class="date-error">{{ dateError }}</small>
    </div>
    <template #footer>
      <Button label="キャンセル" severity="secondary" text @click="visible = false" />
      <Button label="保存" icon="pi pi-check" :disabled="!canSave" @click="handleSave" />
    </template>
  </Dialog>
</template>

<style scoped>
.settings-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-row {
  margin-bottom: 8px;
}

.form-row label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
}

.form-input {
  width: 100%;
}

.date-error {
  color: var(--p-red-400);
}
</style>
