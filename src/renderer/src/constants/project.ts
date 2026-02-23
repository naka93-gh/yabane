import type { Project } from '@shared/types/models'

export interface ProjectStatusDef {
  value: Project['status']
  label: string
  severity: string
}

export const PROJECT_STATUSES: ProjectStatusDef[] = [
  { value: 'planning', label: '計画中', severity: 'info' },
  { value: 'active', label: '進行中', severity: 'success' },
  { value: 'completed', label: '完了', severity: 'secondary' },
  { value: 'on_hold', label: '保留', severity: 'warn' },
  { value: 'cancelled', label: '中止', severity: 'danger' },
  { value: 'archived', label: 'アーカイブ', severity: 'secondary' }
]
