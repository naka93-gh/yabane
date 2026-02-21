<script setup lang="ts">
import { ref, watch } from 'vue'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import { useProjectStore } from '../stores/project'
import { usePurposeStore } from '../stores/purpose'

const projectStore = useProjectStore()
const purposeStore = usePurposeStore()

const background = ref('')
const objective = ref('')
const scope = ref('')
const outOfScope = ref('')
const assumption = ref('')

function loadFormFromStore(): void {
  const p = purposeStore.purpose
  background.value = p?.background ?? ''
  objective.value = p?.objective ?? ''
  scope.value = p?.scope ?? ''
  outOfScope.value = p?.out_of_scope ?? ''
  assumption.value = p?.assumption ?? ''
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

  await purposeStore.savePurpose({
    projectId,
    background: background.value || undefined,
    objective: objective.value || undefined,
    scope: scope.value || undefined,
    out_of_scope: outOfScope.value || undefined,
    assumption: assumption.value || undefined
  })
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
      <Button label="保存" icon="pi pi-save" @click="save" />
    </div>

    <div class="purpose-form">
      <div v-for="field in fields" :key="field.label" class="field">
        <label>{{ field.label }}</label>
        <Textarea v-model="field.model.value" auto-resize rows="4" class="w-full" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.purpose-view {
  max-width: 800px;
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

.field {
  margin-bottom: 20px;
}

.field label {
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
}

.w-full {
  width: 100%;
}
</style>
