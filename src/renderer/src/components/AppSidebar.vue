<script setup lang="ts">
import { computed } from 'vue'
import Select from 'primevue/select'
import { useProjectStore } from '../stores/project'

defineProps<{ activeSection: string }>()
const emit = defineEmits<{
  'request-section': [key: string]
}>()

const store = useProjectStore()

const selectedProjectId = computed({
  get: () => store.currentProject?.id ?? null,
  set: (id: number | null) => {
    if (id !== null) store.selectProject(id)
  }
})

const sections = [
  { key: 'purpose', label: '目的', icon: 'pi pi-file-edit' },
  { key: 'milestone', label: 'マイルストーン', icon: 'pi pi-flag' },
  { key: 'arrow', label: '矢羽', icon: 'pi pi-arrow-right' },
  { key: 'wbs', label: 'WBS', icon: 'pi pi-list-check' },
  { key: 'issue', label: '課題', icon: 'pi pi-exclamation-triangle' },
  { key: 'member', label: '関係者', icon: 'pi pi-users' },
  { key: 'settings', label: 'プロジェクト設定', icon: 'pi pi-cog' }
]
</script>

<template>
  <nav class="sidebar">
    <div class="sidebar-project-select">
      <Select
        v-model="selectedProjectId"
        :options="store.projects"
        option-label="name"
        option-value="id"
        placeholder="プロジェクトを選択"
        class="project-select"
      />
    </div>
    <ul class="sidebar-menu">
      <li
        v-for="section in sections"
        :key="section.key"
        :class="['sidebar-item', { active: activeSection === section.key }]"
        @click="emit('request-section', section.key)"
      >
        <i :class="section.icon" />
        <span>{{ section.label }}</span>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--p-content-border-color);
  background: var(--p-content-hover-background);
  overflow-y: auto;
}

.sidebar-project-select {
  padding: 12px 12px 4px;
}

.project-select {
  width: 100%;
}

.sidebar-menu {
  list-style: none;
  margin: 0;
  padding: 8px 0;
  flex: 1;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  cursor: pointer;
  font-size: 14px;
  color: var(--p-text-color);
  transition: background 0.15s;
}

.sidebar-item:hover {
  background: var(--p-content-background);
}

.sidebar-item.active {
  background: var(--p-highlight-background);
  color: var(--p-highlight-color);
  font-weight: 600;
}

.sidebar-item i {
  font-size: 16px;
  width: 20px;
  text-align: center;
}
</style>
