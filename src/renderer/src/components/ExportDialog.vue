<script setup lang="ts">
import { ref } from 'vue'
import Dialog from 'primevue/dialog'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import { useProjectStore } from '../stores/project'
import { useMilestoneStore } from '../stores/milestone'
import { useArrowStore } from '../stores/arrow'
import { useWbsStore } from '../stores/wbs'
import { useIssueStore } from '../stores/issue'
import { getPurpose } from '../api/purpose'
import { saveExcel } from '../api/export'
import { useAppToast } from '../composables/useAppToast'
import {
  buildWorkbook,
  workbookToBuffer,
  type ExportSection,
  type ExportData
} from '../utils/excel-export'

const projectStore = useProjectStore()
const milestoneStore = useMilestoneStore()
const arrowStore = useArrowStore()
const wbsStore = useWbsStore()
const issueStore = useIssueStore()

const toast = useAppToast()

const visible = ref(false)
const exporting = ref(false)

interface SectionOption {
  key: ExportSection
  label: string
}

const sections: SectionOption[] = [
  { key: 'purpose', label: '目的' },
  { key: 'milestone', label: 'マイルストーン' },
  { key: 'arrow', label: '矢羽' },
  { key: 'wbs', label: 'WBS' },
  { key: 'issue', label: '課題' }
]

const selected = ref<ExportSection[]>(['purpose', 'milestone', 'arrow', 'wbs', 'issue'])

/** ダイアログを開いてセクション選択を初期化する */
function open(): void {
  selected.value = ['purpose', 'milestone', 'arrow', 'wbs', 'issue']
  visible.value = true
}

/** 選択セクションのデータを収集し Excel を生成・保存する */
async function doExport(): Promise<void> {
  const project = projectStore.currentProject
  if (!project || selected.value.length === 0) return

  exporting.value = true
  try {
    // ストアに未ロードのデータがあれば取得
    const pid = project.id
    const [purpose] = await Promise.all([
      selected.value.includes('purpose') ? getPurpose({ projectId: pid }) : null,
      selected.value.includes('milestone') && milestoneStore.milestones.length === 0
        ? milestoneStore.fetchMilestones(pid)
        : undefined,
      selected.value.includes('arrow') && arrowStore.arrows.length === 0
        ? arrowStore.fetchArrows(pid)
        : undefined,
      selected.value.includes('wbs') && wbsStore.items.length === 0
        ? wbsStore.fetchItems(pid)
        : undefined,
      selected.value.includes('issue') && issueStore.issues.length === 0
        ? issueStore.fetchIssues(pid)
        : undefined
    ])

    const data: ExportData = {
      projectName: project.name,
      purpose: purpose ?? null,
      milestones: milestoneStore.milestones,
      arrows: arrowStore.arrows,
      wbsItems: wbsStore.items,
      issues: issueStore.issues
    }

    const wb = buildWorkbook(data, selected.value)
    const buffer = workbookToBuffer(wb)

    const today = new Date()
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
    const defaultName = `${project.name}_${dateStr}.xlsx`

    await saveExcel({ buffer, defaultName })
    visible.value = false
    toast.success('Excelを出力しました')
  } catch {
    toast.error('Excelの出力に失敗しました')
  } finally {
    exporting.value = false
  }
}

defineExpose({ open })
</script>

<template>
  <Dialog
    v-model:visible="visible"
    header="Excel出力"
    :modal="true"
    :style="{ width: '380px' }"
  >
    <p class="export-description">出力するセクションを選択してください。</p>
    <div class="section-list">
      <div v-for="s in sections" :key="s.key" class="section-item">
        <Checkbox
          v-model="selected"
          :input-id="`export-${s.key}`"
          :value="s.key"
        />
        <label :for="`export-${s.key}`" class="section-label">{{ s.label }}</label>
      </div>
    </div>
    <template #footer>
      <Button label="キャンセル" text @click="visible = false" />
      <Button
        label="出力"
        icon="pi pi-file-excel"
        :disabled="selected.length === 0 || exporting"
        :loading="exporting"
        @click="doExport"
      />
    </template>
  </Dialog>
</template>

<style scoped>
.export-description {
  margin: 0 0 16px;
  font-size: 0.85rem;
  color: var(--p-text-muted-color);
}

.section-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-label {
  font-size: 0.9rem;
  cursor: pointer;
}
</style>
