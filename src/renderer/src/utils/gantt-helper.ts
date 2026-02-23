import { diffDays } from './date-helper'

export interface DateRange {
  start: Date
  end: Date
}

/** プロジェクト期間 → データ日付 → デフォルト値 の優先度で日付レンジを算出する */
export function calcDateRange(
  project: { start_date: string | null; end_date: string | null } | null,
  dateStrings: string[],
  marginDays = 7
): DateRange {
  if (project?.start_date && project?.end_date) {
    return { start: new Date(project.start_date), end: new Date(project.end_date) }
  }

  let min: number | null = null
  let max: number | null = null
  for (const ds of dateStrings) {
    const t = new Date(ds).getTime()
    if (min === null || t < min) min = t
    if (max === null || t > max) max = t
  }

  const DAY = 86_400_000
  if (min !== null && max !== null) {
    return { start: new Date(min - marginDays * DAY), end: new Date(max + marginDays * DAY) }
  }
  const now = Date.now()
  return { start: new Date(now - 30 * DAY), end: new Date(now + 60 * DAY) }
}

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

export interface JunHeader {
  label: '上' | '中' | '下'
  left: number
  width: number
}

/** 旬ヘッダー（上旬/中旬/下旬）を算出する */
export function buildJunHeaders(dates: Date[], dayWidth: number): JunHeader[] {
  if (dates.length === 0) return []
  const groups: { label: '上' | '中' | '下'; startIdx: number; count: number }[] = []
  let currentKey = ''
  for (let i = 0; i < dates.length; i++) {
    const d = dates[i]
    const day = d.getDate()
    const jun = day <= 10 ? '上' : day <= 20 ? '中' : '下'
    const key = `${d.getFullYear()}-${d.getMonth()}-${jun}`
    if (key !== currentKey) {
      currentKey = key
      groups.push({ label: jun, startIdx: i, count: 1 })
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

export interface MilestoneLine {
  id: number
  name: string
  left: number
  color: string
}

/** 表示範囲内のマイルストーン縦線位置を算出する */
export function buildMilestoneLines(
  milestones: { id: number; name: string; due_date: string | null; color: string }[],
  rangeStart: Date,
  rangeEnd: Date,
  dayWidth: number
): MilestoneLine[] {
  const rangeEndTime = rangeEnd.getTime()
  const rangeStartTime = rangeStart.getTime()
  return milestones
    .filter((m) => {
      if (!m.due_date) return false
      const t = new Date(m.due_date).getTime()
      return t >= rangeStartTime && t <= rangeEndTime
    })
    .map((m) => ({
      id: m.id,
      name: m.name,
      left: diffDays(rangeStart, new Date(m.due_date!)) * dayWidth + dayWidth / 2,
      color: m.color
    }))
}

/** ステータスに応じたバーの色 */
export const BAR_COLORS: Record<string, string> = {
  not_started: 'var(--p-text-muted-color)',
  in_progress: 'var(--p-primary-color)',
  done: 'var(--p-green-500)'
}

/** 今日の日付の表示位置（px）を返す。範囲外なら null */
export function calcTodayLeft(rangeStart: Date, rangeEnd: Date, dayWidth: number): number | null {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (today < rangeStart || today > rangeEnd) return null
  return diffDays(rangeStart, today) * dayWidth + dayWidth / 2
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
