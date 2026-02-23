import XLSX from 'xlsx-js-style'
import type { Arrow, WbsItem } from '@shared/types/models'
import { TASK_STATUS_LABELS } from '../constants'
import { thinBorder, headerCell, cell, CELL_STYLE, BAR_COLORS } from '../excel-style'

type WS = XLSX.WorkSheet

/** 日付文字列群から前後3日のマージンを含む日付配列を算出する */
function calcExcelDateRange(dateStrings: string[]): { dates: Date[]; startDate: Date | null } {
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

/** WBS シートの1行分のデータ */
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

/** WBS シートを構築する（親→子→タスクの3階層 + 日単位のガントバー） */
export function buildWbsSheet(arrows: Arrow[], wbsItems: WbsItem[]): WS {
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

  const allDateStrs = [
    ...wbsItems.flatMap((t) => [t.start_date, t.end_date].filter(Boolean) as string[]),
    ...arrows.flatMap((a) => [a.start_date, a.end_date].filter(Boolean) as string[])
  ]
  const { dates } = calcExcelDateRange(allDateStrs)

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

  fixedHeaders.forEach((h, c) => {
    ws[XLSX.utils.encode_cell({ r: 0, c })] = headerCell(h)
    ws[XLSX.utils.encode_cell({ r: 1, c })] = headerCell('')
    merges.push({ s: { r: 0, c }, e: { r: 1, c } })
  })

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

  const DATA_START = 2
  rows.forEach((row, i) => {
    const r = DATA_START + i
    ws[XLSX.utils.encode_cell({ r, c: 0 })] = cell(row.showParent ? row.parentName : '')
    ws[XLSX.utils.encode_cell({ r, c: 1 })] = cell(row.showChild ? row.childName : '')
    ws[XLSX.utils.encode_cell({ r, c: 2 })] = cell(row.taskName)
    ws[XLSX.utils.encode_cell({ r, c: 3 })] = cell(row.owner)
    ws[XLSX.utils.encode_cell({ r, c: 4 })] = cell(TASK_STATUS_LABELS[row.status] ?? row.status)
    ws[XLSX.utils.encode_cell({ r, c: 5 })] = cell(row.progress, {
      ...CELL_STYLE,
      alignment: { horizontal: 'right', vertical: 'center' }
    })
    ws[XLSX.utils.encode_cell({ r, c: 6 })] = cell(row.startDate)
    ws[XLSX.utils.encode_cell({ r, c: 7 })] = cell(row.endDate)

    if (row.startDate && row.endDate) {
      const s = new Date(row.startDate)
      const e = new Date(row.endDate)
      const barColor = BAR_COLORS[row.status] ?? BAR_COLORS.not_started
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
