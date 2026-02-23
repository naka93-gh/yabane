<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Button from 'primevue/button'
import Select from 'primevue/select'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import { useProjectStore } from '../../stores/project'
import { useArrowStore } from '../../stores/arrow'
import { useWbsStore, type WbsTreeRow } from '../../stores/wbs'
import { useAppToast } from '../../composables/useAppToast'
import WbsGantt from './WbsGantt.vue'
import WbsDialog from './WbsDialog.vue'
import { TASK_STATUS_OPTIONS, TASK_STATUS_LABELS } from '../../utils/constants'

const projectStore = useProjectStore()
const arrowStore = useArrowStore()
const store = useWbsStore()
const confirm = useConfirm()
const toast = useAppToast()

const ROW_HEIGHT = 36

const wbsDialog = ref<InstanceType<typeof WbsDialog> | null>(null)

const arrowOptions = computed(() => store.childArrows.map((a) => ({ label: a.name, value: a.id })))

// フィルタ用セレクト
const filterArrowOptions = computed(() => [
  { label: 'すべて', value: null },
  ...store.childArrows.map((a) => ({ label: a.name, value: a.id }))
])
const filterStatusOptions = computed(() => [
  { label: 'すべて', value: null },
  ...TASK_STATUS_OPTIONS
])
const filterOwnerOptions = computed(() => [
  { label: 'すべて', value: null },
  ...store.owners.map((o) => ({ label: o, value: o }))
])

// データ取得
watch(
  () => projectStore.currentProject?.id,
  async (projectId) => {
    if (projectId) {
      await Promise.all([arrowStore.fetchArrows(projectId), store.fetchItems(projectId)])
    }
  },
  { immediate: true }
)

function confirmDelete(row: WbsTreeRow): void {
  if (!row.task) return
  confirm.require({
    message: `「${row.task.name}」を削除しますか？`,
    header: '削除確認',
    acceptLabel: '削除',
    rejectLabel: 'キャンセル',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await store.removeItem(row.task!.id)
        toast.success('削除しました')
      } catch {
        toast.error('削除に失敗しました')
      }
    }
  })
}

// フィルタ
const filterArrow = computed({
  get: () => store.filter.arrowId,
  set: (v) => store.setFilter({ arrowId: v })
})
const filterStatus = computed({
  get: () => store.filter.status,
  set: (v) => store.setFilter({ status: v })
})
const filterOwner = computed({
  get: () => store.filter.owner,
  set: (v) => store.setFilter({ owner: v })
})
</script>

<template>
  <div class="wbs-view">
    <div class="wbs-header">
      <h2>WBS</h2>
      <div class="wbs-header-actions">
        <Button
          v-if="
            store.filter.arrowId !== null ||
            store.filter.status !== null ||
            store.filter.owner !== null
          "
          label="フィルタ解除"
          text
          size="small"
          @click="store.clearFilter()"
        />
        <Button
          label="タスク追加"
          icon="pi pi-plus"
          :disabled="arrowOptions.length === 0"
          @click="wbsDialog?.openCreate()"
        />
      </div>
    </div>

    <!-- フィルタバー -->
    <div v-if="store.childArrows.length > 0" class="filter-bar">
      <Select
        v-model="filterArrow"
        :options="filterArrowOptions"
        option-label="label"
        option-value="value"
        placeholder="矢羽"
        class="filter-select"
      />
      <Select
        v-model="filterStatus"
        :options="filterStatusOptions"
        option-label="label"
        option-value="value"
        placeholder="ステータス"
        class="filter-select"
      />
      <Select
        v-model="filterOwner"
        :options="filterOwnerOptions"
        option-label="label"
        option-value="value"
        placeholder="担当者"
        class="filter-select"
      />
    </div>

    <div v-if="arrowOptions.length === 0 && !store.loading" class="empty-state">
      子矢羽を先に追加してください
    </div>

    <div v-else-if="store.tree.length === 0 && !store.loading" class="empty-state">
      タスクはまだありません
    </div>

    <div v-else class="gantt-container">
      <!-- 左パネル: ツリー -->
      <div class="gantt-left">
        <div class="gantt-left-header" :style="{ height: `${ROW_HEIGHT * 2}px` }">
          <span class="col-parent">親矢羽</span>
          <span class="col-child">子矢羽</span>
          <span class="col-task">タスク</span>
          <span class="col-status">状態</span>
          <span class="col-actions">&nbsp;</span>
        </div>
        <div class="gantt-left-body">
          <div
            v-for="row in store.tree"
            :key="row.key"
            class="left-row"
            :style="{ height: `${ROW_HEIGHT}px` }"
          >
            <span class="col-parent" :class="{ 'cell-merged': !row.showParentName }">
              <template v-if="row.showParentName">{{ row.parentArrow?.name }}</template>
            </span>
            <span class="col-child" :class="{ 'cell-merged': !row.showChildName }">
              <template v-if="row.showChildName">{{ row.childArrow?.name }}</template>
            </span>
            <span class="col-task" :title="row.type === 'task' ? row.name : ''">
              {{ row.type === 'task' ? row.name : row.type === 'child' ? '—' : '' }}
            </span>
            <span class="col-status">
              <span
                v-if="row.type === 'task'"
                class="status-badge"
                :class="`status--${row.status}`"
              >
                {{ TASK_STATUS_LABELS[row.status] ?? row.status }}
              </span>
            </span>
            <span class="col-actions">
              <template v-if="row.type === 'task' && row.task">
                <Button
                  icon="pi pi-pencil"
                  text
                  rounded
                  size="small"
                  @click="wbsDialog?.openEdit(row.task!)"
                />
                <Button
                  icon="pi pi-trash"
                  text
                  rounded
                  size="small"
                  severity="danger"
                  @click="confirmDelete(row)"
                />
              </template>
              <template v-else-if="row.childArrow">
                <Button
                  icon="pi pi-plus"
                  text
                  rounded
                  size="small"
                  title="タスクを追加"
                  @click="wbsDialog?.openCreate(row.childArrow!.id)"
                />
              </template>
            </span>
          </div>
        </div>
      </div>

      <!-- 右パネル: ガント -->
      <WbsGantt :rows="store.tree" :date-range="store.dateRange" />
    </div>

    <WbsDialog ref="wbsDialog" />
    <ConfirmDialog />
  </div>
</template>

<style scoped>
.wbs-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.wbs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.wbs-header h2 {
  margin: 0;
}

.wbs-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.filter-select {
  width: 160px;
}

.empty-state {
  color: var(--p-text-muted-color);
  text-align: center;
  padding: 48px 0;
}

/* === ガント全体 === */
.gantt-container {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  border: 1px solid var(--p-content-border-color);
  border-radius: 8px;
  background: var(--p-content-background);
}

/* === 左パネル === */
.gantt-left {
  min-width: 560px;
  border-right: 1px solid var(--p-content-border-color);
  flex-shrink: 0;
}

.gantt-left-header {
  display: flex;
  align-items: flex-end;
  padding-bottom: 8px;
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--p-text-muted-color);
  border-bottom: 1px solid var(--p-content-border-color);
  position: sticky;
  top: 0;
  background: var(--p-content-hover-background);
  z-index: 3;
}

.left-row {
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--p-content-border-color);
  font-size: 0.8rem;
}

.col-parent {
  width: 120px;
  min-width: 120px;
  padding: 0 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col-child {
  width: 120px;
  min-width: 120px;
  padding: 0 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col-task {
  width: 140px;
  min-width: 140px;
  padding: 0 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.col-status {
  width: 56px;
  min-width: 56px;
  padding: 0 4px;
}

.col-actions {
  width: 64px;
  min-width: 64px;
  display: flex;
  gap: 0;
  flex-shrink: 0;
}

.col-actions :deep(.p-button) {
  width: 26px;
  height: 26px;
}

.cell-merged {
  border-left-color: transparent;
}
</style>
