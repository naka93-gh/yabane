<script setup lang="ts">
import { computed } from 'vue'
import Select from 'primevue/select'
import Button from 'primevue/button'
import { useProjectStore } from '../stores/project'

const store = useProjectStore()

const selectedProjectId = computed({
  get: () => store.currentProject?.id ?? null,
  set: (id: number | null) => {
    if (id !== null) store.selectProject(id)
  }
})

const showProjectDialog = (): void => {
  store.dialogVisible = true
}
</script>

<template>
  <header class="app-header-bar">
    <div class="header-left">
      <span class="app-title">yabane</span>
    </div>
    <div class="header-center">
      <Select
        v-model="selectedProjectId"
        :options="store.projects"
        option-label="name"
        option-value="id"
        placeholder="プロジェクトを選択"
        class="project-select"
      />
      <Button
        icon="pi pi-cog"
        severity="secondary"
        text
        rounded
        size="small"
        aria-label="プロジェクト管理"
        @click="showProjectDialog"
      />
    </div>
    <div class="header-right">
      <Button
        label="Excel出力"
        icon="pi pi-file-excel"
        severity="secondary"
        size="small"
        disabled
      />
    </div>
  </header>
</template>

<style scoped>
.app-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid var(--p-content-border-color);
  background: var(--p-content-background);
}

.header-left {
  display: flex;
  align-items: center;
}

.app-title {
  font-size: 16px;
  font-weight: 700;
}

.header-center {
  display: flex;
  align-items: center;
  gap: 4px;
}

.project-select {
  min-width: 240px;
}

.header-right {
  display: flex;
  align-items: center;
}
</style>
