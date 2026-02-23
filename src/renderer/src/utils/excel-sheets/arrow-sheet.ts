import XLSX from 'xlsx-js-style'
import type { Arrow } from '@shared/types/models'
import { TASK_STATUS_LABELS } from '../constants'
import { thinBorder, headerCell, cell, BAR_COLORS } from '../excel-style'

type WS = XLSX.WorkSheet

// --- 旬ユーティリティ ---

/** 旬（上旬/中旬/下旬）を表す期間 */
interface JunPeriod {
  year: number
  month: number
  jun: 0 | 1 | 2
}

/** 旬の開始日・終了日を返す */
function junBounds(p: JunPeriod): { start: Date; end: Date } {
  const lastDay = new Date(p.year, p.month, 0).getDate()
  const starts = [1, 11, 21]
  const ends = [10, 20, lastDay]
  return {
    start: new Date(p.year, p.month - 1, starts[p.jun]),
    end: new Date(p.year, p.month - 1, ends[p.jun])
  }
}

/** 旬と日付範囲が重なるか判定する */
function junOverlaps(p: JunPeriod, rangeStart: Date, rangeEnd: Date): boolean {
  const { start, end } = junBounds(p)
  return start <= rangeEnd && end >= rangeStart
}

/** 日付文字列群から前後1旬を含む旬一覧を算出する */
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

/** 矢羽シートを構築する（ツリー表示 + 旬単位のガントバー） */
export function buildArrowSheet(arrows: Arrow[]): WS {
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

  const junPeriods = calcJunRange(
    arrows.flatMap((a) => [a.start_date, a.end_date].filter(Boolean) as string[])
  )

  const fixedHeaders = ['矢羽名', '担当者', 'ステータス', '開始日', '終了日']
  const fixedCount = fixedHeaders.length
  const ws: WS = {}
  const totalCols = fixedCount + junPeriods.length
  const merges: XLSX.Range[] = []

  fixedHeaders.forEach((h, c) => {
    ws[XLSX.utils.encode_cell({ r: 0, c })] = headerCell(h)
    ws[XLSX.utils.encode_cell({ r: 1, c })] = headerCell('')
    merges.push({ s: { r: 0, c }, e: { r: 1, c } })
  })

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

  const JUN_LABELS = ['上', '中', '下']
  junPeriods.forEach((p, i) => {
    ws[XLSX.utils.encode_cell({ r: 1, c: fixedCount + i })] = headerCell(JUN_LABELS[p.jun])
  })

  flatRows.forEach((row, i) => {
    const r = i + 2
    const a = row.arrow
    const indent = '  '.repeat(row.depth)
    ws[XLSX.utils.encode_cell({ r, c: 0 })] = cell(indent + a.name)
    ws[XLSX.utils.encode_cell({ r, c: 1 })] = cell(a.owner)
    ws[XLSX.utils.encode_cell({ r, c: 2 })] = cell(TASK_STATUS_LABELS[a.status] ?? a.status)
    ws[XLSX.utils.encode_cell({ r, c: 3 })] = cell(a.start_date)
    ws[XLSX.utils.encode_cell({ r, c: 4 })] = cell(a.end_date)

    if (a.start_date && a.end_date) {
      const s = new Date(a.start_date)
      const e = new Date(a.end_date)
      const barColor = BAR_COLORS[a.status] ?? BAR_COLORS.not_started
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
