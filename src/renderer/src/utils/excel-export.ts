import XLSX from 'xlsx-js-style'
import type { Purpose, Milestone, Arrow, WbsItem, Issue } from '@shared/types/models'

export type ExportSection = 'purpose' | 'milestone' | 'arrow' | 'wbs' | 'issue'

export interface ExportData {
  projectName: string
  purpose: Purpose | null
  milestones: Milestone[]
  arrows: Arrow[]
  wbsItems: WbsItem[]
  issues: Issue[]
}

type WS = XLSX.WorkSheet
type CellStyle = XLSX.CellStyle

// --- スタイル定数 ---
const HEADER_STYLE: CellStyle = {
  font: { bold: true, color: { rgb: 'FFFFFF' } },
  fill: { fgColor: { rgb: '4472C4' } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: thinBorder()
}

const LABEL_STYLE: CellStyle = {
  font: { bold: true },
  fill: { fgColor: { rgb: 'D9E2F3' } },
  alignment: { vertical: 'top', wrapText: true },
  border: thinBorder()
}

const CELL_STYLE: CellStyle = {
  alignment: { vertical: 'top', wrapText: true },
  border: thinBorder()
}

/** 細線の罫線スタイルを返す */
function thinBorder(): CellStyle['border'] {
  const side = { style: 'thin' as const, color: { rgb: 'B4C6E7' } }
  return { top: side, bottom: side, left: side, right: side }
}

/** 通常セルを生成する */
function cell(v: string | number | null, style: CellStyle = CELL_STYLE): XLSX.CellObject {
  return { v: v ?? '', t: typeof v === 'number' ? 'n' : 's', s: style }
}

/** ヘッダーセルを生成する */
function headerCell(v: string): XLSX.CellObject {
  return { v, t: 's', s: HEADER_STYLE }
}

/** ラベルセル（背景色付き）を生成する */
function labelCell(v: string): XLSX.CellObject {
  return { v, t: 's', s: LABEL_STYLE }
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

/** 目的シートを構築する */
function buildPurposeSheet(purpose: Purpose | null): WS {
  const fields: [string, string | null][] = [
    ['背景', purpose?.background ?? null],
    ['目的', purpose?.objective ?? null],
    ['スコープ', purpose?.scope ?? null],
    ['スコープ外', purpose?.out_of_scope ?? null],
    ['前提', purpose?.assumption ?? null]
  ]

  const ws: WS = {}
  fields.forEach(([label, value], i) => {
    const r = i
    ws[XLSX.utils.encode_cell({ r, c: 0 })] = labelCell(label)
    ws[XLSX.utils.encode_cell({ r, c: 1 })] = cell(value)
  })

  ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: fields.length - 1, c: 1 } })
  ws['!cols'] = [{ wch: 14 }, { wch: 80 }]
  ws['!rows'] = fields.map(() => ({ hpt: 60 }))
  return ws
}

/** マイルストーンシートを構築する */
function buildMilestoneSheet(milestones: Milestone[]): WS {
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

// --- 矢羽シート用定数 ---
const STATUS_LABELS: Record<string, string> = {
  not_started: '未着手',
  in_progress: '進行中',
  done: '完了'
}

const ARROW_BAR_COLORS: Record<string, string> = {
  not_started: 'BFBFBF',
  in_progress: '4472C4',
  done: '70AD47'
}

/** 矢羽シートを構築する（ツリー表示 + 旬単位のガントバー） */
function buildArrowSheet(arrows: Arrow[]): WS {
  // ツリー構築
  const childrenMap = new Map<number | null, Arrow[]>()
  for (const a of arrows) {
    const key = a.parent_id
    if (!childrenMap.has(key)) childrenMap.set(key, [])
    childrenMap.get(key)!.push(a)
  }

  interface FlatRow {
    arrow: Arrow
    depth: number
  }
  const flatRows: FlatRow[] = []
  function walk(parentId: number | null, depth: number): void {
    const children = childrenMap.get(parentId) ?? []
    children.sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
    for (const arrow of children) {
      flatRows.push({ arrow, depth })
      walk(arrow.id, depth + 1)
    }
  }
  walk(null, 0)

  // 旬（上/中/下）レンジ算出
  const junPeriods = calcJunRange(
    arrows.flatMap((a) => [a.start_date, a.end_date].filter(Boolean) as string[])
  )

  const fixedHeaders = ['矢羽名', '担当者', 'ステータス', '開始日', '終了日']
  const fixedCount = fixedHeaders.length
  const ws: WS = {}
  const totalCols = fixedCount + junPeriods.length
  const merges: XLSX.Range[] = []

  // ヘッダー行 0: 固定列（2行分マージ）+ 月ラベル
  fixedHeaders.forEach((h, c) => {
    ws[XLSX.utils.encode_cell({ r: 0, c })] = headerCell(h)
    ws[XLSX.utils.encode_cell({ r: 1, c })] = headerCell('')
    merges.push({ s: { r: 0, c }, e: { r: 1, c } })
  })

  // 月ラベルをマージして配置
  if (junPeriods.length > 0) {
    let groupStart = 0
    let currentKey = ''
    junPeriods.forEach((p, i) => {
      const key = `${p.year}-${p.month}`
      if (key !== currentKey) {
        if (currentKey && i > groupStart) {
          merges.push({
            s: { r: 0, c: fixedCount + groupStart },
            e: { r: 0, c: fixedCount + i - 1 }
          })
        }
        currentKey = key
        groupStart = i
        ws[XLSX.utils.encode_cell({ r: 0, c: fixedCount + i })] = headerCell(`${p.month}月`)
      }
    })
    merges.push({
      s: { r: 0, c: fixedCount + groupStart },
      e: { r: 0, c: fixedCount + junPeriods.length - 1 }
    })
  }

  // ヘッダー行 1: 上/中/下
  const JUN_LABELS = ['上', '中', '下']
  junPeriods.forEach((p, i) => {
    ws[XLSX.utils.encode_cell({ r: 1, c: fixedCount + i })] = headerCell(JUN_LABELS[p.jun])
  })

  // データ行（行2から）
  flatRows.forEach((row, i) => {
    const r = i + 2
    const a = row.arrow
    const indent = '  '.repeat(row.depth)
    ws[XLSX.utils.encode_cell({ r, c: 0 })] = cell(indent + a.name)
    ws[XLSX.utils.encode_cell({ r, c: 1 })] = cell(a.owner)
    ws[XLSX.utils.encode_cell({ r, c: 2 })] = cell(STATUS_LABELS[a.status] ?? a.status)
    ws[XLSX.utils.encode_cell({ r, c: 3 })] = cell(a.start_date)
    ws[XLSX.utils.encode_cell({ r, c: 4 })] = cell(a.end_date)

    // ガントバー色塗り（旬単位）
    if (a.start_date && a.end_date) {
      const s = new Date(a.start_date)
      const e = new Date(a.end_date)
      const barColor = ARROW_BAR_COLORS[a.status] ?? ARROW_BAR_COLORS.not_started
      junPeriods.forEach((p, pi) => {
        if (junOverlaps(p, s, e)) {
          ws[XLSX.utils.encode_cell({ r, c: fixedCount + pi })] = {
            v: '',
            t: 's',
            s: { fill: { fgColor: { rgb: barColor } }, border: thinBorder() }
          }
        }
      })
    }
  })

  ws['!merges'] = merges
  ws['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: flatRows.length + 1, c: totalCols - 1 }
  })
  ws['!cols'] = [
    { wch: 24 },
    { wch: 12 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    ...junPeriods.map(() => ({ wch: 4 }))
  ]
  return ws
}

// --- WBS シート用定数 ---
const WBS_BAR_COLORS: Record<string, string> = {
  not_started: 'BFBFBF',
  in_progress: '4472C4',
  done: '70AD47'
}

/** WBS シートを構築する（親→子→タスクの3階層 + 日単位のガントバー） */
function buildWbsSheet(arrows: Arrow[], wbsItems: WbsItem[]): WS {
  // 親→子→タスクのフラット行を構築
  const parents = arrows
    .filter((a) => a.parent_id === null)
    .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)

  const childrenMap = new Map<number, Arrow[]>()
  for (const a of arrows) {
    if (a.parent_id !== null) {
      if (!childrenMap.has(a.parent_id)) childrenMap.set(a.parent_id, [])
      childrenMap.get(a.parent_id)!.push(a)
    }
  }
  for (const ch of childrenMap.values()) {
    ch.sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
  }

  const taskMap = new Map<number, WbsItem[]>()
  for (const t of wbsItems) {
    if (!taskMap.has(t.arrow_id)) taskMap.set(t.arrow_id, [])
    taskMap.get(t.arrow_id)!.push(t)
  }
  for (const ts of taskMap.values()) {
    ts.sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
  }

  interface WbsRow {
    parentName: string
    childName: string
    taskName: string
    owner: string | null
    status: string
    progress: number
    startDate: string | null
    endDate: string | null
    showParent: boolean
    showChild: boolean
  }

  const rows: WbsRow[] = []
  for (const parent of parents) {
    const children = childrenMap.get(parent.id) ?? []
    let isFirstParent = true
    for (const child of children) {
      const tasks = taskMap.get(child.id) ?? []
      let isFirstChild = true
      if (tasks.length === 0) {
        rows.push({
          parentName: parent.name,
          childName: child.name,
          taskName: '',
          owner: null,
          status: '',
          progress: 0,
          startDate: null,
          endDate: null,
          showParent: isFirstParent,
          showChild: true
        })
        isFirstParent = false
      } else {
        for (const task of tasks) {
          rows.push({
            parentName: parent.name,
            childName: child.name,
            taskName: task.name,
            owner: task.owner,
            status: task.status,
            progress: task.progress,
            startDate: task.start_date,
            endDate: task.end_date,
            showParent: isFirstParent,
            showChild: isFirstChild
          })
          isFirstParent = false
          isFirstChild = false
        }
      }
    }
  }

  // 日付レンジ（矢羽の日付も含めて常にガント列を生成）
  const allDateStrs = [
    ...wbsItems.flatMap((t) => [t.start_date, t.end_date].filter(Boolean) as string[]),
    ...arrows.flatMap((a) => [a.start_date, a.end_date].filter(Boolean) as string[])
  ]
  const { dates } = calcDateRange(allDateStrs)

  const fixedHeaders = [
    '親矢羽',
    '子矢羽',
    'タスク',
    '担当者',
    'ステータス',
    '進捗',
    '開始日',
    '終了日'
  ]
  const fixedCount = fixedHeaders.length
  const ws: WS = {}
  const totalCols = fixedCount + dates.length
  const merges: XLSX.Range[] = []

  // ヘッダー行 0: 固定列（2行分マージ）+ 月ラベル
  fixedHeaders.forEach((h, c) => {
    ws[XLSX.utils.encode_cell({ r: 0, c })] = headerCell(h)
    ws[XLSX.utils.encode_cell({ r: 1, c })] = headerCell('')
    merges.push({ s: { r: 0, c }, e: { r: 1, c } })
  })

  // 月ラベルをマージして配置
  if (dates.length > 0) {
    let groupStart = 0
    let currentKey = ''
    dates.forEach((d, i) => {
      const key = `${d.getFullYear()}-${d.getMonth()}`
      if (key !== currentKey) {
        if (currentKey && i > groupStart) {
          merges.push({
            s: { r: 0, c: fixedCount + groupStart },
            e: { r: 0, c: fixedCount + i - 1 }
          })
        }
        currentKey = key
        groupStart = i
        ws[XLSX.utils.encode_cell({ r: 0, c: fixedCount + i })] = headerCell(
          `${d.getMonth() + 1}月`
        )
      }
    })
    merges.push({
      s: { r: 0, c: fixedCount + groupStart },
      e: { r: 0, c: fixedCount + dates.length - 1 }
    })
  }

  // ヘッダー行 1: 日番号
  dates.forEach((d, i) => {
    const isWeekend = d.getDay() === 0 || d.getDay() === 6
    ws[XLSX.utils.encode_cell({ r: 1, c: fixedCount + i })] = {
      v: d.getDate(),
      t: 'n',
      s: {
        font: { bold: true, sz: 8, color: { rgb: isWeekend ? 'FF6666' : 'FFFFFF' } },
        fill: { fgColor: { rgb: isWeekend ? '2F5496' : '4472C4' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: thinBorder()
      }
    }
  })

  // データ行（行2から）
  const DATA_START = 2
  rows.forEach((row, i) => {
    const r = DATA_START + i
    ws[XLSX.utils.encode_cell({ r, c: 0 })] = cell(row.showParent ? row.parentName : '')
    ws[XLSX.utils.encode_cell({ r, c: 1 })] = cell(row.showChild ? row.childName : '')
    ws[XLSX.utils.encode_cell({ r, c: 2 })] = cell(row.taskName)
    ws[XLSX.utils.encode_cell({ r, c: 3 })] = cell(row.owner)
    ws[XLSX.utils.encode_cell({ r, c: 4 })] = cell(STATUS_LABELS[row.status] ?? row.status)
    ws[XLSX.utils.encode_cell({ r, c: 5 })] = cell(row.progress, {
      ...CELL_STYLE,
      alignment: { horizontal: 'right', vertical: 'center' }
    })
    ws[XLSX.utils.encode_cell({ r, c: 6 })] = cell(row.startDate)
    ws[XLSX.utils.encode_cell({ r, c: 7 })] = cell(row.endDate)

    // セル色塗り
    if (row.startDate && row.endDate) {
      const s = new Date(row.startDate)
      const e = new Date(row.endDate)
      const barColor = WBS_BAR_COLORS[row.status] ?? WBS_BAR_COLORS.not_started
      for (const [di, d] of dates.entries()) {
        if (d >= s && d <= e) {
          ws[XLSX.utils.encode_cell({ r, c: fixedCount + di })] = {
            v: '',
            t: 's',
            s: { fill: { fgColor: { rgb: barColor } }, border: thinBorder() }
          }
        }
      }
    }
  })

  // 親矢羽・子矢羽のセル結合
  let parentStart = DATA_START
  for (let i = DATA_START; i <= DATA_START + rows.length; i++) {
    const rowIdx = i - DATA_START
    if (i === DATA_START + rows.length || rows[rowIdx]?.showParent) {
      if (i - parentStart > 1) {
        merges.push({ s: { r: parentStart, c: 0 }, e: { r: i - 1, c: 0 } })
      }
      parentStart = i
    }
  }
  let childStart = DATA_START
  for (let i = DATA_START; i <= DATA_START + rows.length; i++) {
    const rowIdx = i - DATA_START
    if (i === DATA_START + rows.length || rows[rowIdx]?.showChild) {
      if (i - childStart > 1) {
        merges.push({ s: { r: childStart, c: 1 }, e: { r: i - 1, c: 1 } })
      }
      childStart = i
    }
  }
  ws['!merges'] = merges

  ws['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: DATA_START + rows.length - 1, c: totalCols - 1 }
  })
  ws['!cols'] = [
    { wch: 16 },
    { wch: 16 },
    { wch: 20 },
    { wch: 10 },
    { wch: 10 },
    { wch: 6 },
    { wch: 12 },
    { wch: 12 },
    ...dates.map(() => ({ wch: 3.5 }))
  ]
  return ws
}

// --- 課題シート用定数 ---
const PRIORITY_LABELS: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '最優先'
}

const ISSUE_STATUS_LABELS: Record<string, string> = {
  open: 'オープン',
  in_progress: '対応中',
  resolved: '解決済み',
  closed: 'クローズ'
}

/** 課題シートを構築する */
function buildIssueSheet(issues: Issue[]): WS {
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

/** 日付文字列群から前後3日のマージンを含む日付配列を算出する */
function calcDateRange(dateStrings: string[]): { dates: Date[]; startDate: Date | null } {
  if (dateStrings.length === 0) return { dates: [], startDate: null }

  let min = Infinity
  let max = -Infinity
  for (const ds of dateStrings) {
    const t = new Date(ds).getTime()
    if (t < min) min = t
    if (t > max) max = t
  }

  const DAY = 86_400_000
  const start = new Date(min - 3 * DAY)
  start.setHours(0, 0, 0, 0)
  const end = new Date(max + 3 * DAY)
  end.setHours(0, 0, 0, 0)

  const days = Math.round((end.getTime() - start.getTime()) / DAY)
  const dates: Date[] = []
  for (let i = 0; i <= days; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    dates.push(d)
  }
  return { dates, startDate: start }
}

// --- 旬ユーティリティ（矢羽シート用） ---
interface JunPeriod {
  year: number
  month: number
  jun: 0 | 1 | 2 // 0=上旬(1-10), 1=中旬(11-20), 2=下旬(21-末)
}

/** 旬の開始日・終了日 */
function junBounds(p: JunPeriod): { start: Date; end: Date } {
  const lastDay = new Date(p.year, p.month, 0).getDate()
  const starts = [1, 11, 21]
  const ends = [10, 20, lastDay]
  return {
    start: new Date(p.year, p.month - 1, starts[p.jun]),
    end: new Date(p.year, p.month - 1, ends[p.jun])
  }
}

/** 旬とdate rangeが重なるか */
function junOverlaps(p: JunPeriod, rangeStart: Date, rangeEnd: Date): boolean {
  const { start, end } = junBounds(p)
  return start <= rangeEnd && end >= rangeStart
}

/** 日付文字列群から旬の一覧を算出 */
function calcJunRange(dateStrings: string[]): JunPeriod[] {
  if (dateStrings.length === 0) return []

  let minDate: Date | null = null
  let maxDate: Date | null = null
  for (const ds of dateStrings) {
    const d = new Date(ds)
    if (!minDate || d < minDate) minDate = d
    if (!maxDate || d > maxDate) maxDate = d
  }
  if (!minDate || !maxDate) return []

  // 1旬前から1旬後まで含める
  const startJun = dateToJun(minDate)
  const endJun = dateToJun(maxDate)
  const start = prevJun(startJun)
  const end = nextJun(endJun)

  const result: JunPeriod[] = []
  let cur = start
  while (junLessOrEqual(cur, end)) {
    result.push({ ...cur })
    cur = nextJun(cur)
  }
  return result
}

/** Date を旬に変換する */
function dateToJun(d: Date): JunPeriod {
  const day = d.getDate()
  const jun: 0 | 1 | 2 = day <= 10 ? 0 : day <= 20 ? 1 : 2
  return { year: d.getFullYear(), month: d.getMonth() + 1, jun }
}

/** 次の旬を返す */
function nextJun(p: JunPeriod): JunPeriod {
  if (p.jun < 2) return { year: p.year, month: p.month, jun: (p.jun + 1) as 0 | 1 | 2 }
  const nextMonth = p.month === 12 ? 1 : p.month + 1
  const nextYear = p.month === 12 ? p.year + 1 : p.year
  return { year: nextYear, month: nextMonth, jun: 0 }
}

/** 前の旬を返す */
function prevJun(p: JunPeriod): JunPeriod {
  if (p.jun > 0) return { year: p.year, month: p.month, jun: (p.jun - 1) as 0 | 1 | 2 }
  const prevMonth = p.month === 1 ? 12 : p.month - 1
  const prevYear = p.month === 1 ? p.year - 1 : p.year
  return { year: prevYear, month: prevMonth, jun: 2 }
}

/** 旬 a が旬 b 以前かを判定する */
function junLessOrEqual(a: JunPeriod, b: JunPeriod): boolean {
  if (a.year !== b.year) return a.year < b.year
  if (a.month !== b.month) return a.month < b.month
  return a.jun <= b.jun
}
