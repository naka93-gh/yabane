<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Button from 'primevue/button'
import SelectButton from 'primevue/selectbutton'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import { formatDate, formatDisplayDate } from '../../utils/date-helper'
import { useProjectStore } from '../../stores/project'
import { useMilestoneStore } from '../../stores/milestone'
import { useAppToast } from '../../composables/useAppToast'
import { useListReorder } from '../../composables/useListReorder'
import type { Milestone } from '@shared/types/models'
import MilestoneDialog from './MilestoneDialog.vue'

const projectStore = useProjectStore()
const store = useMilestoneStore()
const confirm = useConfirm()
const toast = useAppToast()

const SORT_OPTIONS = [
  { label: '手動', value: 'manual' },
  { label: '期日順', value: 'due_date' }
]

const sortMode = ref<'manual' | 'due_date'>('manual')
const milestoneDialog = ref<InstanceType<typeof MilestoneDialog> | null>(null)

const sortedMilestones = computed<Milestone[]>(() => {
  if (sortMode.value === 'due_date') {
    return [...store.milestones].sort((a, b) => {
      if (!a.due_date && !b.due_date) return 0
      if (!a.due_date) return 1
      if (!b.due_date) return -1
      return a.due_date.localeCompare(b.due_date)
    })
  }
  return store.milestones
})

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false
  const today = formatDate(new Date())
  return dateStr < today
}

watch(
  () => projectStore.currentProject?.id,
  async (projectId) => {
    if (projectId) {
      await store.fetchMilestones(projectId)
    }
  },
  { immediate: true }
)

function confirmDelete(m: Milestone): void {
  confirm.require({
    message: `「${m.name}」を削除しますか？`,
    header: '削除確認',
    acceptLabel: '削除',
    rejectLabel: 'キャンセル',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await store.removeMilestone(m.id)
        toast.success('削除しました')
      } catch {
        toast.error('削除に失敗しました')
      }
    }
  })
}

// --- ドラッグ並べ替え ---
const reorder = useListReorder<Milestone>({
  getId: (m) => m.id,
  onReorder: (ids) => store.reorder(ids)
})
</script>

<template>
  <div class="milestone-view">
    <div class="milestone-header">
      <h2>マイルストーン</h2>
      <div class="milestone-header-actions">
        <SelectButton
          v-model="sortMode"
          :options="SORT_OPTIONS"
          option-label="label"
          option-value="value"
          :allow-empty="false"
        />
        <Button label="追加" icon="pi pi-plus" @click="milestoneDialog?.openCreate()" />
      </div>
    </div>

    <div v-if="store.milestones.length === 0 && !store.loading" class="empty-state">
      マイルストーンはまだありません
    </div>

    <div class="milestone-list">
      <div
        v-for="(m, i) in sortedMilestones"
        :key="m.id"
        class="milestone-card"
        :class="{
          'milestone-card--overdue': isOverdue(m.due_date),
          'milestone-card--drag-over':
            reorder.dropIndex.value === i && reorder.dragIndex.value !== i
        }"
        :style="{ borderLeftColor: m.color }"
        :draggable="sortMode === 'manual'"
        @dragstart="sortMode === 'manual' && reorder.onDragStart(m, i, $event)"
        @dragover="sortMode === 'manual' && reorder.onDragOver(m, i, $event)"
        @drop="sortMode === 'manual' && reorder.onDrop(m, sortedMilestones)"
        @dragend="reorder.onDragEnd"
      >
        <i v-if="sortMode === 'manual'" class="pi pi-bars drag-handle" />
        <div class="card-body">
          <div class="card-main">
            <span class="card-name">{{ m.name }}</span>
            <span
              v-if="m.due_date"
              class="card-due"
              :class="{ 'card-due--overdue': isOverdue(m.due_date) }"
            >
              <i class="pi pi-calendar" />
              {{ formatDisplayDate(m.due_date) }}
            </span>
          </div>
          <p v-if="m.description" class="card-description">{{ m.description }}</p>
        </div>
        <div class="card-actions">
          <Button
            icon="pi pi-pencil"
            text
            rounded
            size="small"
            @click="milestoneDialog?.openEdit(m)"
          />
          <Button
            icon="pi pi-trash"
            text
            rounded
            size="small"
            severity="danger"
            @click="confirmDelete(m)"
          />
        </div>
      </div>
    </div>

    <MilestoneDialog ref="milestoneDialog" />
    <ConfirmDialog />
  </div>
</template>

<style scoped>
.milestone-view {
  /* レスポンシブ: max-width 制限なし */
}

.milestone-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.milestone-header h2 {
  margin: 0;
}

.milestone-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.empty-state {
  color: var(--p-text-muted-color);
  text-align: center;
  padding: 48px 0;
}

.milestone-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.milestone-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  border: 1px solid var(--p-content-border-color);
  border-left: 4px solid;
  border-radius: 8px;
  padding: 16px;
  background: var(--p-content-background);
  transition:
    background 0.15s,
    border-color 0.15s;
}

.milestone-card--overdue {
  border-color: var(--p-red-200);
  background: color-mix(in srgb, var(--p-red-50) 40%, var(--p-content-background));
}

.milestone-card--drag-over {
  border-top: 2px solid var(--p-primary-color);
}

.drag-handle {
  cursor: grab;
  color: var(--p-text-muted-color);
  padding: 4px 8px 4px 0;
  flex-shrink: 0;
  align-self: center;
}

.card-body {
  flex: 1;
  min-width: 0;
}

.card-main {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.card-name {
  font-weight: 600;
  font-size: 1rem;
}

.card-due {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  color: var(--p-text-muted-color);
}

.card-due--overdue {
  color: var(--p-red-500);
  font-weight: 700;
}

.card-description {
  margin: 8px 0 0;
  font-size: 0.9rem;
  color: var(--p-text-muted-color);
  white-space: pre-wrap;
}

.card-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
</style>
