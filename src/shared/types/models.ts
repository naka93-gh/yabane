export interface Project {
  id: number
  name: string
  description: string | null
  start_date: string | null
  end_date: string | null
  status: 'active' | 'archived'
  created_at: string
  updated_at: string
}

export interface Purpose {
  id: number
  project_id: number
  background: string | null
  objective: string | null
  scope: string | null
  out_of_scope: string | null
  assumption: string | null
  updated_at: string
}

export interface Milestone {
  id: number
  project_id: number
  name: string
  description: string | null
  due_date: string | null
  color: string
  sort_order: number
  created_at: string
}

export interface Arrow {
  id: number
  project_id: number
  parent_id: number | null
  name: string
  start_date: string | null
  end_date: string | null
  owner: string | null
  status: 'not_started' | 'in_progress' | 'done'
  sort_order: number
  created_at: string
}

export interface WbsItem {
  id: number
  arrow_id: number
  name: string
  start_date: string | null
  end_date: string | null
  owner: string | null
  status: 'not_started' | 'in_progress' | 'done'
  progress: number
  estimated_hours: number | null
  actual_hours: number | null
  sort_order: number
  created_at: string
}

export interface Issue {
  id: number
  project_id: number
  title: string
  description: string | null
  owner: string | null
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  due_date: string | null
  resolution: string | null
  created_at: string
  updated_at: string
}

export interface Member {
  id: number
  project_id: number
  name: string
  role: string | null
  organization: string | null
  email: string | null
  note: string | null
  sort_order: number
  created_at: string
}
