import XLSX from 'xlsx-js-style'
import type { Purpose, Milestone, Issue, Member } from '@shared/types/models'
import { ISSUE_STATUS_LABELS, PRIORITY_LABELS } from '../constants'
import { headerCell, labelCell, cell, CELL_STYLE } from '../excel-style'

type WS = XLSX.WorkSheet

/** 目的シートを構築する */
export function buildPurposeSheet(purpose: Purpose | null): WS {
  const fields: [string, string | null][] = [
    ['背景', purpose?.background ?? null],
    ['目的', purpose?.objective ?? null],
    ['スコープ', purpose?.scope ?? null],
    ['スコープ外', purpose?.out_of_scope ?? null],
    ['前提', purpose?.assumption ?? null]
  ]

  const ws: WS = {}
  fields.forEach(([label, value], i) => {
    ws[XLSX.utils.encode_cell({ r: i, c: 0 })] = labelCell(label)
    ws[XLSX.utils.encode_cell({ r: i, c: 1 })] = cell(value)
  })

  ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: fields.length - 1, c: 1 } })
  ws['!cols'] = [{ wch: 14 }, { wch: 80 }]
  ws['!rows'] = fields.map(() => ({ hpt: 60 }))
  return ws
}

/** マイルストーンシートを構築する */
export function buildMilestoneSheet(milestones: Milestone[]): WS {
  const headers = ['名前', '説明', '期限', 'カラー']
  const ws: WS = {}

  headers.forEach((h, c) => {
    ws[XLSX.utils.encode_cell({ r: 0, c })] = headerCell(h)
  })

  milestones.forEach((m, i) => {
    const r = i + 1
    ws[XLSX.utils.encode_cell({ r, c: 0 })] = cell(m.name)
    ws[XLSX.utils.encode_cell({ r, c: 1 })] = cell(m.description)
    ws[XLSX.utils.encode_cell({ r, c: 2 })] = cell(m.due_date)
    ws[XLSX.utils.encode_cell({ r, c: 3 })] = cell(m.color, {
      ...CELL_STYLE,
      fill: { fgColor: { rgb: m.color.replace('#', '') } }
    })
  })

  ws['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: milestones.length, c: headers.length - 1 }
  })
  ws['!cols'] = [{ wch: 24 }, { wch: 40 }, { wch: 14 }, { wch: 10 }]
  return ws
}

/** 課題シートを構築する */
export function buildIssueSheet(issues: Issue[]): WS {
  const headers = ['タイトル', '説明', '優先度', 'ステータス', '担当者', '期限', '対応内容']
  const ws: WS = {}

  headers.forEach((h, c) => {
    ws[XLSX.utils.encode_cell({ r: 0, c })] = headerCell(h)
  })

  issues.forEach((issue, i) => {
    const r = i + 1
    ws[XLSX.utils.encode_cell({ r, c: 0 })] = cell(issue.title)
    ws[XLSX.utils.encode_cell({ r, c: 1 })] = cell(issue.description)
    ws[XLSX.utils.encode_cell({ r, c: 2 })] = cell(
      PRIORITY_LABELS[issue.priority] ?? issue.priority
    )
    ws[XLSX.utils.encode_cell({ r, c: 3 })] = cell(
      ISSUE_STATUS_LABELS[issue.status] ?? issue.status
    )
    ws[XLSX.utils.encode_cell({ r, c: 4 })] = cell(issue.owner)
    ws[XLSX.utils.encode_cell({ r, c: 5 })] = cell(issue.due_date)
    ws[XLSX.utils.encode_cell({ r, c: 6 })] = cell(issue.resolution)
  })

  ws['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: issues.length, c: headers.length - 1 }
  })
  ws['!cols'] = [
    { wch: 30 },
    { wch: 40 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 40 }
  ]
  return ws
}

/** 関係者シートを構築する */
export function buildMemberSheet(members: Member[]): WS {
  const headers = ['組織', '名前', '役割', 'メール', '備考']
  const ws: WS = {}

  headers.forEach((h, c) => {
    ws[XLSX.utils.encode_cell({ r: 0, c })] = headerCell(h)
  })

  members.forEach((m, i) => {
    const r = i + 1
    ws[XLSX.utils.encode_cell({ r, c: 0 })] = cell(m.organization)
    ws[XLSX.utils.encode_cell({ r, c: 1 })] = cell(m.name)
    ws[XLSX.utils.encode_cell({ r, c: 2 })] = cell(m.role)
    ws[XLSX.utils.encode_cell({ r, c: 3 })] = cell(m.email)
    ws[XLSX.utils.encode_cell({ r, c: 4 })] = cell(m.note)
  })

  ws['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: members.length, c: headers.length - 1 }
  })
  ws['!cols'] = [{ wch: 20 }, { wch: 16 }, { wch: 16 }, { wch: 28 }, { wch: 40 }]
  return ws
}
