/** Arrow / WBS 共通のステータス選択肢 */
export const TASK_STATUS_OPTIONS = [
  { label: '未着手', value: 'not_started' },
  { label: '進行中', value: 'in_progress' },
  { label: '完了', value: 'done' }
]

/** Arrow / WBS 共通のステータスラベル */
export const TASK_STATUS_LABELS: Record<string, string> = {
  not_started: '未着手',
  in_progress: '進行中',
  done: '完了'
}

/** Issue ステータス選択肢 */
export const ISSUE_STATUS_OPTIONS = [
  { label: 'オープン', value: 'open' },
  { label: '対応中', value: 'in_progress' },
  { label: '解決済み', value: 'resolved' },
  { label: 'クローズ', value: 'closed' }
]

/** Issue ステータスラベル */
export const ISSUE_STATUS_LABELS: Record<string, string> = {
  open: 'オープン',
  in_progress: '対応中',
  resolved: '解決済み',
  closed: 'クローズ'
}

/** 優先度選択肢 */
export const PRIORITY_OPTIONS = [
  { label: '低', value: 'low' },
  { label: '中', value: 'medium' },
  { label: '高', value: 'high' },
  { label: '最優先', value: 'critical' }
]

/** 優先度ラベル */
export const PRIORITY_LABELS: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '最優先'
}
