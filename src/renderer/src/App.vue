<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppHeader from './components/AppHeader.vue'
import AppSidebar from './components/AppSidebar.vue'
import ProjectDialog from './components/ProjectDialog.vue'
import PlaceholderView from './views/PlaceholderView.vue'
import PurposeView from './views/PurposeView.vue'
import MilestoneView from './views/MilestoneView.vue'
import { useProjectStore } from './stores/project'

const store = useProjectStore()
const activeSection = ref('purpose')

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
    <AppHeader class="app-header" />
    <AppSidebar
      v-model:active-section="activeSection"
      class="app-sidebar"
    />
    <main class="app-main">
      <PurposeView v-if="store.currentProject && activeSection === 'purpose'" />
      <MilestoneView v-else-if="store.currentProject && activeSection === 'milestone'" />
      <PlaceholderView v-else :section-name="sectionLabels[activeSection as Section]" />
    </main>
    <ProjectDialog />
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
