<script setup lang="ts">
import { ref, computed } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import DatePicker from 'primevue/datepicker'
import Button from 'primevue/button'
import { formatDate } from '../../utils/date-helper'
import { useProjectStore } from '../../stores/project'
import { useMilestoneStore } from '../../stores/milestone'
import { useAppToast } from '../../composables/useAppToast'
import type { Milestone } from '@shared/types/models'

const PRESET_COLORS = [
  { name: 'red', value: '#ef4444' },
  { name: 'orange', value: '#f97316' },
  { name: 'yellow', value: '#eab308' },
  { name: 'green', value: '#22c55e' },
  { name: 'cyan', value: '#06b6d4' },
  { name: 'blue', value: '#3b82f6' },
  { name: 'indigo', value: '#6366f1' },
  { name: 'purple', value: '#a855f7' },
  { name: 'pink', value: '#ec4899' },
  { name: 'gray', value: '#6b7280' }
]

const projectStore = useProjectStore()
const store = useMilestoneStore()
const toast = useAppToast()

const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formName = ref('')
const formDescription = ref('')
const formDueDate = ref<Date | null>(null)
const formColor = ref('#6366f1')

const dialogTitle = computed(() =>
  editingId.value ? 'マイルストーンを編集' : 'マイルストーンを追加'
)

function openCreate(): void {
  editingId.value = null
  formName.value = ''
  formDescription.value = ''
  formDueDate.value = null
  formColor.value = '#6366f1'
  dialogVisible.value = true
}

function openEdit(m: Milestone): void {
  editingId.value = m.id
  formName.value = m.name
  formDescription.value = m.description ?? ''
  formDueDate.value = m.due_date ? new Date(m.due_date) : null
  formColor.value = m.color
  dialogVisible.value = true
}

const emit = defineEmits<{ saved: [] }>()

async function save(): Promise<void> {
  const projectId = projectStore.currentProject?.id
  if (!projectId || !formName.value.trim()) return

  const dueDate = formDueDate.value ? formatDate(formDueDate.value) : undefined
  const isEdit = !!editingId.value

  try {
    if (editingId.value) {
      await store.editMilestone({
        id: editingId.value,
        name: formName.value.trim(),
        description: formDescription.value || undefined,
        dueDate,
        color: formColor.value
      })
    } else {
      await store.addMilestone({
        projectId,
        name: formName.value.trim(),
        description: formDescription.value || undefined,
        dueDate,
        color: formColor.value
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
        <InputText v-model="formName" placeholder="マイルストーン名" class="w-full" />
      </div>
      <div class="field">
        <label>期日</label>
        <DatePicker
          v-model="formDueDate"
          date-format="yy/mm/dd"
          placeholder="期日を選択"
          class="w-full"
        />
      </div>
      <div class="field">
        <label>メモ</label>
        <Textarea
          v-model="formDescription"
          auto-resize
          rows="3"
          placeholder="メモ（任意）"
          class="w-full"
        />
      </div>
      <div class="field">
        <label>カラー</label>
        <div class="color-picker">
          <button
            v-for="c in PRESET_COLORS"
            :key="c.name"
            class="color-swatch"
            :class="{ selected: formColor === c.value }"
            :style="{ backgroundColor: c.value }"
            :title="c.name"
            @click="formColor = c.value"
          />
        </div>
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

.color-picker {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: border-color 0.15s;
}

.color-swatch:hover {
  opacity: 0.8;
}

.color-swatch.selected {
  border-color: var(--p-text-color);
  box-shadow:
    0 0 0 2px var(--p-content-background),
    0 0 0 4px var(--p-text-muted-color);
}
</style>
