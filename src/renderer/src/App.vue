<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppHeader from './components/AppHeader.vue'
import AppSidebar from './components/AppSidebar.vue'
import ProjectDialog from './components/ProjectDialog.vue'
import ExportDialog from './components/ExportDialog.vue'
import PlaceholderView from './views/PlaceholderView.vue'
import PurposeView from './views/PurposeView.vue'
import MilestoneView from './views/milestone/MilestoneView.vue'
import ArrowView from './views/arrow/ArrowView.vue'
import WbsView from './views/wbs/WbsView.vue'
import IssueView from './views/issue/IssueView.vue'
import MemberView from './views/member/MemberView.vue'
import ProjectSettingsView from './views/settings/ProjectSettingsView.vue'
import Toast from 'primevue/toast'
import { useProjectStore } from './stores/project'
import { useNavigationGuard } from './composables/useNavigationGuard'

const store = useProjectStore()
const guard = useNavigationGuard()
const activeSection = ref('purpose')
const exportDialog = ref<InstanceType<typeof ExportDialog> | null>(null)

function onRequestSection(key: string): void {
  if (key === activeSection.value) return
  if (!guard.confirmLeave()) return
  guard.reset()
  activeSection.value = key
}

type Section = 'purpose' | 'milestone' | 'arrow' | 'wbs' | 'issue' | 'member' | 'settings'

const sectionLabels: Record<Section, string> = {
  purpose: '目的',
  milestone: 'マイルストーン',
  arrow: '矢羽',
  wbs: 'WBS',
  issue: '課題',
  member: '関係者',
  settings: 'プロジェクト設定'
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
    />
    <main class="app-main">
      <PurposeView v-if="store.currentProject && activeSection === 'purpose'" />
      <MilestoneView v-else-if="store.currentProject && activeSection === 'milestone'" />
      <ArrowView v-else-if="store.currentProject && activeSection === 'arrow'" />
      <WbsView v-else-if="store.currentProject && activeSection === 'wbs'" />
      <IssueView v-else-if="store.currentProject && activeSection === 'issue'" />
      <MemberView v-else-if="store.currentProject && activeSection === 'member'" />
      <ProjectSettingsView v-else-if="store.currentProject && activeSection === 'settings'" />
      <PlaceholderView v-else :section-name="sectionLabels[activeSection as Section]" />
    </main>
    <Toast />
    <ProjectDialog />
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
