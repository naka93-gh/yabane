<script setup lang="ts">
import type { PurposeHistory } from '@shared/types/models'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { ref } from 'vue'
import { useProjectStore } from '../../stores/project'
import { usePurposeStore } from '../../stores/purpose'

const projectStore = useProjectStore()
const purposeStore = usePurposeStore()

const emit = defineEmits<{ restore: [history: PurposeHistory] }>()

const visible = ref(false)
const selectedHistory = ref<PurposeHistory | null>(null)

async function open(): Promise<void> {
  const projectId = projectStore.currentProject?.id
  if (!projectId) return
  await purposeStore.fetchHistory(projectId)
  selectedHistory.value = null
  visible.value = true
}

function handleRestore(): void {
  if (!selectedHistory.value) return
  emit('restore', selectedHistory.value)
  visible.value = false
}

function formatDate(iso: string): string {
  const d = new Date(`${iso}Z`)
  return d.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const historyFields = [
  { label: '背景', key: 'background' },
  { label: '目的', key: 'objective' },
  { label: 'スコープ', key: 'scope' },
  { label: 'スコープ外', key: 'out_of_scope' },
  { label: '前提条件', key: 'assumption' }
] as const

defineExpose({ open })
</script>

<template>
  <Dialog
    v-model:visible="visible"
    header="変更履歴"
    :modal="true"
    :style="{ width: '720px' }"
  >
    <div class="history-layout">
      <div class="history-list">
        <div
          v-for="h in purposeStore.history"
          :key="h.id"
          class="history-item"
          :class="{ selected: selectedHistory?.id === h.id }"
          @click="selectedHistory = h"
        >
          {{ formatDate(h.saved_at) }}
        </div>
        <div v-if="purposeStore.history.length === 0" class="history-empty">
          履歴がありません
        </div>
      </div>
      <div class="history-detail">
        <template v-if="selectedHistory">
          <div v-for="hf in historyFields" :key="hf.key" class="history-field">
            <div class="history-field-label">{{ hf.label }}</div>
            <div class="history-field-value">{{ selectedHistory[hf.key] ?? '(未入力)' }}</div>
          </div>
        </template>
        <div v-else class="history-empty">左のリストから履歴を選択してください</div>
      </div>
    </div>
    <template #footer>
      <Button label="閉じる" text @click="visible = false" />
      <Button
        label="この内容に戻す"
        icon="pi pi-replay"
        :disabled="!selectedHistory"
        @click="handleRestore"
      />
    </template>
  </Dialog>
</template>

<style scoped>
.history-layout {
  display: flex;
  gap: 16px;
  height: 400px;
}

.history-list {
  width: 200px;
  flex-shrink: 0;
  overflow-y: auto;
  border: 1px solid var(--p-content-border-color);
  border-radius: var(--p-border-radius);
}

.history-item {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 0.85rem;
  border-bottom: 1px solid var(--p-content-border-color);
}

.history-item:hover {
  background: var(--p-content-hover-background);
}

.history-item.selected {
  background: var(--p-primary-color);
  color: var(--p-primary-contrast-color);
}

.history-detail {
  flex: 1;
  overflow-y: auto;
  border: 1px solid var(--p-content-border-color);
  border-radius: var(--p-border-radius);
  padding: 12px;
}

.history-field {
  margin-bottom: 12px;
}

.history-field-label {
  font-weight: 600;
  font-size: 0.85rem;
  margin-bottom: 4px;
  color: var(--p-text-muted-color);
}

.history-field-value {
  font-size: 0.9rem;
  white-space: pre-wrap;
  line-height: 1.6;
}

.history-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--p-text-muted-color);
  font-size: 0.9rem;
}
</style>
