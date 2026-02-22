<script setup lang="ts">
import { computed } from 'vue'
import Select from 'primevue/select'
import Button from 'primevue/button'
import { useProjectStore } from '../stores/project'
import { useThemeStore } from '../stores/theme'
import type { ThemeMode } from '../stores/theme'

const store = useProjectStore()
const themeStore = useThemeStore()

/** プロジェクトセレクトの v-model 用（選択時に store を更新） */
const selectedProjectId = computed({
  get: () => store.currentProject?.id ?? null,
  set: (id: number | null) => {
    if (id !== null) store.selectProject(id)
  }
})

/** 現在のテーマモードに応じたアイコンクラスを返す */
const themeIcon = computed(() => {
  const icons: Record<ThemeMode, string> = {
    system: 'pi-desktop',
    light: 'pi-sun',
    dark: 'pi-moon'
  }
  return icons[themeStore.mode]
})

/** テーマを system → light → dark の順に切り替える */
const cycleTheme = (): void => {
  const order: ThemeMode[] = ['system', 'light', 'dark']
  const next = order[(order.indexOf(themeStore.mode) + 1) % order.length]
  themeStore.setMode(next)
}

const emit = defineEmits<{ exportExcel: [] }>()

/** プロジェクト管理ダイアログを開く */
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
        :icon="`pi ${themeIcon}`"
        severity="secondary"
        text
        rounded
        size="small"
        :aria-label="`テーマ: ${themeStore.mode}`"
        @click="cycleTheme"
      />
      <Button
        label="Excel出力"
        icon="pi pi-file-excel"
        severity="secondary"
        size="small"
        :disabled="!store.currentProject"
        @click="emit('exportExcel')"
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
  gap: 4px;
}
</style>
