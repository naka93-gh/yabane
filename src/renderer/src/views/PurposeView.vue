<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import { useProjectStore } from '../stores/project'
import { usePurposeStore } from '../stores/purpose'
import { useAppToast } from '../composables/useAppToast'
import { useNavigationGuard } from '../composables/useNavigationGuard'

const projectStore = useProjectStore()
const purposeStore = usePurposeStore()
const toast = useAppToast()
const guard = useNavigationGuard()

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
  if (!projectId) return

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
    <div class="purpose-header">
      <h2>目的</h2>
      <Button
        label="保存"
        icon="pi pi-save"
        :severity="isDirty ? 'warn' : 'primary'"
        :badge="isDirty ? '!' : undefined"
        :disabled="!isDirty"
        @click="save"
      />
    </div>

    <div class="purpose-form">
      <div v-for="(field, i) in fields" :key="field.label" class="field-section">
        <div v-if="i > 0" class="field-divider" />
        <div class="field-header">
          <label>{{ field.label }}</label>
          <span class="char-count">{{ field.model.value.length }} 文字</span>
        </div>
        <Textarea v-model="field.model.value" auto-resize rows="4" class="w-full" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.purpose-view {
  height: 100%;
}

.purpose-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.purpose-header h2 {
  margin: 0;
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
}

.field-header label {
  font-weight: 600;
  font-size: 0.95rem;
}

.char-count {
  font-size: 0.8rem;
  color: var(--p-text-muted-color);
}

.w-full {
  width: 100%;
}
</style>
