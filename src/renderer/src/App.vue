<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppHeader from './components/AppHeader.vue'
import AppSidebar from './components/AppSidebar.vue'
import ProjectDialog from './components/ProjectDialog.vue'
import ProjectSettingsDialog from './components/ProjectSettingsDialog.vue'
import ExportDialog from './components/ExportDialog.vue'
import PlaceholderView from './views/PlaceholderView.vue'
import PurposeView from './views/PurposeView.vue'
import MilestoneView from './views/MilestoneView.vue'
import ArrowView from './views/ArrowView.vue'
import WbsView from './views/wbs/WbsView.vue'
import IssueView from './views/IssueView.vue'
import Toast from 'primevue/toast'
import { useProjectStore } from './stores/project'
import { useNavigationGuard } from './composables/useNavigationGuard'

const store = useProjectStore()
const guard = useNavigationGuard()
const activeSection = ref('purpose')
const exportDialog = ref<InstanceType<typeof ExportDialog> | null>(null)
const settingsDialog = ref<InstanceType<typeof ProjectSettingsDialog> | null>(null)

function onRequestSection(key: string): void {
  if (key === activeSection.value) return
  if (!guard.confirmLeave()) return
  guard.reset()
  activeSection.value = key
}

type Section = 'purpose' | 'milestone' | 'arrow' | 'wbs' | 'issue'

const sectionLabels: Record<Section, string> = {
  purpose: '目的',
  milestone: 'マイルストーン',
  arrow: '矢羽',
  wbs: 'WBS',
  issue: '課題'
}

onMounted(async () => {
  await store.fetchProjects()
  if (store.projects.length > 0) {
    await store.selectProject(store.projects[0].id)
  }
})
</script>

<template>
  <div class="app-layout">
    <AppHeader class="app-header" @export-excel="exportDialog?.open()" />
    <AppSidebar
      :active-section="activeSection"
      class="app-sidebar"
      @request-section="onRequestSection"
      @open-settings="settingsDialog?.open()"
    />
    <main class="app-main">
      <PurposeView v-if="store.currentProject && activeSection === 'purpose'" />
      <MilestoneView v-else-if="store.currentProject && activeSection === 'milestone'" />
      <ArrowView v-else-if="store.currentProject && activeSection === 'arrow'" />
      <WbsView v-else-if="store.currentProject && activeSection === 'wbs'" />
      <IssueView v-else-if="store.currentProject && activeSection === 'issue'" />
      <PlaceholderView v-else :section-name="sectionLabels[activeSection as Section]" />
    </main>
    <Toast />
    <ProjectDialog />
    <ProjectSettingsDialog ref="settingsDialog" />
    <ExportDialog ref="exportDialog" />
  </div>
</template>

<style scoped>
.app-layout {
  display: grid;
  grid-template-areas:
    'header header'
    'sidebar main';
  grid-template-columns: 200px 1fr;
  grid-template-rows: 48px 1fr;
  height: 100vh;
  overflow: hidden;
}

.app-header {
  grid-area: header;
}

.app-sidebar {
  grid-area: sidebar;
}

.app-main {
  grid-area: main;
  overflow: auto;
  padding: 16px;
}
</style>
