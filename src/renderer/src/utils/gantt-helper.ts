import { diffDays } from './date-helper'

/** dateRange 内の全日付を配列で返す */
export function buildAllDates(start: Date, end: Date): Date[] {
  const days = diffDays(start, end)
  const result: Date[] = []
  for (let i = 0; i <= days; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    result.push(d)
  }
  return result
}

export interface MonthHeader {
  label: string
  left: number
  width: number
}

/** 月ヘッダー（ラベル・位置・幅）を算出する */
export function buildMonthHeaders(dates: Date[], dayWidth: number): MonthHeader[] {
  if (dates.length === 0) return []
  const groups: { label: string; startIdx: number; count: number }[] = []
  let current = ''
  for (let i = 0; i < dates.length; i++) {
    const d = dates[i]
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (key !== current) {
      current = key
      groups.push({ label: `${d.getMonth() + 1}月`, startIdx: i, count: 1 })
    } else {
      groups[groups.length - 1].count++
    }
  }
  return groups.map((g) => ({
    label: g.label,
    left: g.startIdx * dayWidth,
    width: g.count * dayWidth
  }))
}

export interface GridLine {
  left: number
  type: 'month' | 'third'
}

/** 月境界と三等分線（11日・21日）の位置を算出する */
export function buildGridLines(dates: Date[], dayWidth: number): GridLine[] {
  const lines: GridLine[] = []
  for (let i = 0; i < dates.length; i++) {
    const day = dates[i].getDate()
    if (day === 1) {
      lines.push({ left: i * dayWidth, type: 'month' })
    } else if (day === 11 || day === 21) {
      lines.push({ left: i * dayWidth, type: 'third' })
    }
  }
  return lines
}

/** 月初の位置一覧を返す */
export function buildMonthBoundaries(dates: Date[], dayWidth: number): number[] {
  const lines: number[] = []
  for (let i = 0; i < dates.length; i++) {
    if (dates[i].getDate() === 1) {
      lines.push(i * dayWidth)
    }
  }
  return lines
}

/** ステータスに応じたバーの色 */
export const BAR_COLORS: Record<string, string> = {
  not_started: 'var(--p-text-muted-color)',
  in_progress: 'var(--p-primary-color)',
  done: 'var(--p-green-500)'
}

/** ガントバーのスタイル（left, width, background）を算出する */
export function calcBarStyle(
  startDate: string,
  endDate: string,
  rangeStart: Date,
  dayWidth: number,
  status: string
): Record<string, string> {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const leftDays = diffDays(rangeStart, start)
  const spanDays = diffDays(start, end) + 1
  return {
    left: `${leftDays * dayWidth}px`,
    width: `${spanDays * dayWidth}px`,
    background: BAR_COLORS[status] ?? BAR_COLORS.not_started
  }
}
