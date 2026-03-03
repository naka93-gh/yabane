<script setup lang="ts">
import type { PurposeHistory } from '@shared/types/models'
import Button from 'primevue/button'
import SelectButton from 'primevue/selectbutton'
import Textarea from 'primevue/textarea'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useAppToast } from '../../composables/useAppToast'
import { useNavigationGuard } from '../../composables/useNavigationGuard'
import { useProjectStore } from '../../stores/project'
import { usePurposeStore } from '../../stores/purpose'
import PurposeHistoryDialog from './PurposeHistoryDialog.vue'

const projectStore = useProjectStore()
const purposeStore = usePurposeStore()
const toast = useAppToast()
const guard = useNavigationGuard()

const historyDialog = ref<InstanceType<typeof PurposeHistoryDialog>>()

const background = ref('')
const objective = ref('')
const scope = ref('')
const outOfScope = ref('')
const assumption = ref('')

/** 保存済みの値を記憶し dirty 判定に使う */
const savedSnapshot = ref({
  background: '',
  objective: '',
  scope: '',
  outOfScope: '',
  assumption: ''
})

function takeSnapshot(): void {
  savedSnapshot.value = {
    background: background.value,
    objective: objective.value,
    scope: scope.value,
    outOfScope: outOfScope.value,
    assumption: assumption.value
  }
}

const isDirty = computed(() => {
  const s = savedSnapshot.value
  return (
    background.value !== s.background ||
    objective.value !== s.objective ||
    scope.value !== s.scope ||
    outOfScope.value !== s.outOfScope ||
    assumption.value !== s.assumption
  )
})

watch(isDirty, (v) => guard.setDirty(v))
onBeforeUnmount(() => guard.reset())

function loadFormFromStore(): void {
  const p = purposeStore.purpose
  background.value = p?.background ?? ''
  objective.value = p?.objective ?? ''
  scope.value = p?.scope ?? ''
  outOfScope.value = p?.out_of_scope ?? ''
  assumption.value = p?.assumption ?? ''
  takeSnapshot()
}

watch(
  () => projectStore.currentProject?.id,
  async (projectId) => {
    if (projectId) {
      await purposeStore.fetchPurpose(projectId)
      loadFormFromStore()
    }
  },
  { immediate: true }
)

async function save(): Promise<void> {
  const projectId = projectStore.currentProject?.id
  if (!projectId || !isDirty.value) return

  try {
    await purposeStore.savePurpose({
      projectId,
      background: background.value || undefined,
      objective: objective.value || undefined,
      scope: scope.value || undefined,
      out_of_scope: outOfScope.value || undefined,
      assumption: assumption.value || undefined
    })
    takeSnapshot()
    toast.success('保存しました')
  } catch {
    toast.error('保存に失敗しました')
  }
}

// --- Ctrl+S / Cmd+S ショートカット ---

function handleKeydown(e: KeyboardEvent): void {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    save()
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown))

// --- 表示/編集モード切替 ---

const VIEW_MODE_OPTIONS = [
  { label: '編集', value: 'edit' },
  { label: 'プレビュー', value: 'preview' }
]
const viewMode = ref<'edit' | 'preview'>('edit')

// --- セクション折りたたみ ---

const collapsedFields = ref(new Set<number>())

function toggleCollapse(index: number): void {
  const next = new Set(collapsedFields.value)
  if (next.has(index)) {
    next.delete(index)
  } else {
    next.add(index)
  }
  collapsedFields.value = next
}

// --- 履歴復元 ---

function restoreHistory(h: PurposeHistory): void {
  background.value = h.background ?? ''
  objective.value = h.objective ?? ''
  scope.value = h.scope ?? ''
  outOfScope.value = h.out_of_scope ?? ''
  assumption.value = h.assumption ?? ''
  toast.success('履歴の内容をフォームに反映しました')
}

// --- フィールド定義 ---

const fields = [
  { label: '背景', model: background },
  { label: '目的', model: objective },
  { label: 'スコープ', model: scope },
  { label: 'スコープ外', model: outOfScope },
  { label: '前提条件', model: assumption }
] as const
</script>

<template>
  <div class="purpose-view">
    <div class="view-header">
      <h2>目的</h2>
      <div class="purpose-header-actions">
        <SelectButton
          v-model="viewMode"
          :options="VIEW_MODE_OPTIONS"
          option-label="label"
          option-value="value"
          :allow-empty="false"
        />
        <Button
          label="履歴"
          icon="pi pi-history"
          severity="secondary"
          size="small"
          @click="historyDialog?.open()"
        />
        <Button
          label="保存"
          icon="pi pi-save"
          :severity="isDirty ? 'warn' : 'primary'"
          :badge="isDirty ? '!' : undefined"
          :disabled="!isDirty"
          @click="save"
        />
      </div>
    </div>

    <div v-if="!purposeStore.loading" class="purpose-form">
      <div v-for="(field, i) in fields" :key="field.label" class="field-section">
        <div v-if="i > 0" class="field-divider" />
        <div class="field-header" @click="toggleCollapse(i)">
          <div class="field-header-left">
            <i :class="collapsedFields.has(i) ? 'pi pi-chevron-right' : 'pi pi-chevron-down'" />
            <label>{{ field.label }}</label>
          </div>
          <span v-if="!collapsedFields.has(i)" class="char-count">
            {{ field.model.value.length }} 文字
          </span>
        </div>
        <template v-if="!collapsedFields.has(i)">
          <Textarea
            v-if="viewMode === 'edit'"
            v-model="field.model.value"
            auto-resize
            rows="4"
            class="w-full"
          />
          <div v-else class="text-preview">{{ field.model.value || '(未入力)' }}</div>
        </template>
      </div>
    </div>

    <PurposeHistoryDialog ref="historyDialog" @restore="restoreHistory" />
  </div>
</template>

<style scoped>
.purpose-view {
  height: 100%;
}

.purpose-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.field-section {
  padding-bottom: 20px;
}

.field-divider {
  border-top: 1px dashed var(--p-content-border-color);
  margin-bottom: 20px;
}

.field-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  cursor: pointer;
  user-select: none;
}

.field-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-header-left i {
  font-size: 0.85rem;
  color: var(--p-text-muted-color);
}

.field-header label {
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
}

.char-count {
  font-size: 0.8rem;
  color: var(--p-text-muted-color);
}

.w-full {
  width: 100%;
}

/* テキストプレビュー */
.text-preview {
  padding: 4px 16px;
  line-height: 1.7;
  white-space: pre-wrap;
}
</style>
