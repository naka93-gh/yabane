<script setup lang="ts">
import { ref, computed } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import AutoComplete from 'primevue/autocomplete'
import DatePicker from 'primevue/datepicker'
import Select from 'primevue/select'
import Button from 'primevue/button'
import { formatDate } from '../../utils/date-helper'
import { useWbsStore } from '../../stores/wbs'
import { useAppToast } from '../../composables/useAppToast'
import { useOwnerSuggestions } from '../../composables/useOwnerSuggestions'
import { TASK_STATUS_OPTIONS } from '../../utils/constants'
import type { WbsItem } from '@shared/types/models'

const store = useWbsStore()
const toast = useAppToast()
const { suggestions, search } = useOwnerSuggestions()

const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formArrowId = ref<number | null>(null)
const formName = ref('')
const formOwner = ref('')
const formStartDate = ref<Date | null>(null)
const formEndDate = ref<Date | null>(null)
const formStatus = ref<WbsItem['status']>('not_started')
const formProgress = ref(0)
const formEstimatedHours = ref<number | null>(null)
const formActualHours = ref<number | null>(null)

const dialogTitle = computed(() => (editingId.value ? 'タスクを編集' : 'タスクを追加'))
const arrowOptions = computed(() => store.childArrows.map((a) => ({ label: a.name, value: a.id })))

function openCreate(arrowId?: number): void {
  editingId.value = null
  formArrowId.value = arrowId ?? store.childArrows[0]?.id ?? null
  formName.value = ''
  formOwner.value = ''
  formStartDate.value = null
  formEndDate.value = null
  formStatus.value = 'not_started'
  formProgress.value = 0
  formEstimatedHours.value = null
  formActualHours.value = null
  dialogVisible.value = true
}

function openEdit(item: WbsItem): void {
  editingId.value = item.id
  formArrowId.value = item.arrow_id
  formName.value = item.name
  formOwner.value = item.owner ?? ''
  formStartDate.value = item.start_date ? new Date(item.start_date) : null
  formEndDate.value = item.end_date ? new Date(item.end_date) : null
  formStatus.value = item.status
  formProgress.value = item.progress
  formEstimatedHours.value = item.estimated_hours
  formActualHours.value = item.actual_hours
  dialogVisible.value = true
}

const emit = defineEmits<{ saved: [] }>()

async function save(): Promise<void> {
  if (!formName.value.trim() || !formArrowId.value) return

  const startDate = formStartDate.value ? formatDate(formStartDate.value) : undefined
  const endDate = formEndDate.value ? formatDate(formEndDate.value) : undefined
  const isEdit = !!editingId.value

  try {
    if (editingId.value) {
      await store.editItem({
        id: editingId.value,
        arrowId: formArrowId.value,
        name: formName.value.trim(),
        owner: formOwner.value || undefined,
        startDate,
        endDate,
        status: formStatus.value,
        progress: formProgress.value,
        estimatedHours: formEstimatedHours.value ?? undefined,
        actualHours: formActualHours.value ?? undefined
      })
    } else {
      await store.addItem({
        arrowId: formArrowId.value,
        name: formName.value.trim(),
        owner: formOwner.value || undefined,
        startDate,
        endDate,
        status: formStatus.value,
        progress: formProgress.value,
        estimatedHours: formEstimatedHours.value ?? undefined
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
        <label>タスク名</label>
        <InputText v-model="formName" placeholder="タスク名" class="w-full" />
      </div>
      <div class="field">
        <label>所属矢羽</label>
        <Select
          v-model="formArrowId"
          :options="arrowOptions"
          option-label="label"
          option-value="value"
          placeholder="子矢羽を選択"
          class="w-full"
        />
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
      <div class="field-row">
        <div class="field">
          <label>開始日</label>
          <DatePicker
            v-model="formStartDate"
            date-format="yy/mm/dd"
            placeholder="開始日"
            class="w-full"
          />
        </div>
        <div class="field">
          <label>終了日</label>
          <DatePicker
            v-model="formEndDate"
            date-format="yy/mm/dd"
            placeholder="終了日"
            class="w-full"
          />
        </div>
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
      <div class="field-row">
        <div class="field">
          <label>進捗 (%)</label>
          <InputNumber v-model="formProgress" :min="0" :max="100" suffix="%" class="w-full" />
        </div>
        <div class="field">
          <label>見積工数 (h)</label>
          <InputNumber
            v-model="formEstimatedHours"
            :min="0"
            :max-fraction-digits="1"
            class="w-full"
          />
        </div>
        <div v-if="editingId" class="field">
          <label>実績工数 (h)</label>
          <InputNumber v-model="formActualHours" :min="0" :max-fraction-digits="1" class="w-full" />
        </div>
      </div>
    </div>
    <template #footer>
      <Button label="キャンセル" text @click="dialogVisible = false" />
      <Button
        label="保存"
        icon="pi pi-check"
        :disabled="!formName.trim() || !formArrowId"
        @click="save"
      />
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
