import XLSX from 'xlsx-js-style'
import type { Purpose, Milestone, Arrow, WbsItem, Issue } from '@shared/types/models'
import { buildArrowSheet } from './excel-sheets/arrow-sheet'
import { buildWbsSheet } from './excel-sheets/wbs-sheet'
import {
  buildPurposeSheet,
  buildMilestoneSheet,
  buildIssueSheet
} from './excel-sheets/simple-sheets'

/** エクスポート対象セクションの種別 */
export type ExportSection = 'purpose' | 'milestone' | 'arrow' | 'wbs' | 'issue'

/** エクスポートに必要なデータ一式 */
export interface ExportData {
  projectName: string
  purpose: Purpose | null
  milestones: Milestone[]
  arrows: Arrow[]
  wbsItems: WbsItem[]
  issues: Issue[]
}

/** 選択されたセクションからワークブックを構築する */
export function buildWorkbook(data: ExportData, sections: ExportSection[]): XLSX.WorkBook {
  const wb = XLSX.utils.book_new()

  if (sections.includes('purpose')) {
    XLSX.utils.book_append_sheet(wb, buildPurposeSheet(data.purpose), '目的')
  }
  if (sections.includes('milestone')) {
    XLSX.utils.book_append_sheet(wb, buildMilestoneSheet(data.milestones), 'マイルストーン')
  }
  if (sections.includes('arrow')) {
    XLSX.utils.book_append_sheet(wb, buildArrowSheet(data.arrows), '矢羽')
  }
  if (sections.includes('wbs')) {
    XLSX.utils.book_append_sheet(wb, buildWbsSheet(data.arrows, data.wbsItems), 'WBS')
  }
  if (sections.includes('issue')) {
    XLSX.utils.book_append_sheet(wb, buildIssueSheet(data.issues), '課題')
  }

  return wb
}

/** ワークブックを ArrayBuffer に変換する */
export function workbookToBuffer(wb: XLSX.WorkBook): number[] {
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
  return Array.from(new Uint8Array(out))
}
