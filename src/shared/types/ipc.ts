/**
 * IPC 通信で使用する引数型の一元定義。
 * service / ipc / preload / renderer の全レイヤーからこのファイルを参照する。
 */
import type { Project, Arrow, WbsItem, Issue } from './models'

// --- プロジェクト ---

/** プロジェクト一覧取得の引数 */
export interface ProjectListArgs {
  status?: Project['status']
}

/** プロジェクト作成の引数 */
export interface ProjectCreateArgs {
  name: string
  description?: string
}

/** プロジェクト更新の引数 */
export interface ProjectUpdateArgs {
  id: number
  name?: string
  description?: string
  start_date?: string | null
  end_date?: string | null
}

// --- 目的 ---

/** 目的保存の引数 */
export interface PurposeSaveArgs {
  projectId: number
  background?: string
  objective?: string
  scope?: string
  out_of_scope?: string
  assumption?: string
}

// --- マイルストーン ---

/** マイルストーン作成の引数 */
export interface MilestoneCreateArgs {
  projectId: number
  name: string
  description?: string
  dueDate?: string
  color?: string
}

/** マイルストーン更新の引数 */
export interface MilestoneUpdateArgs {
  id: number
  name?: string
  description?: string
  dueDate?: string
  color?: string
}

// --- 矢羽 ---

/** 矢羽作成の引数 */
export interface ArrowCreateArgs {
  projectId: number
  parentId?: number
  name: string
  startDate?: string
  endDate?: string
  owner?: string
  status?: Arrow['status']
}

/** 矢羽更新の引数 */
export interface ArrowUpdateArgs {
  id: number
  name?: string
  startDate?: string
  endDate?: string
  owner?: string
  status?: Arrow['status']
  parentId?: number | null
}

// --- WBS ---

/** WBS 作成の引数 */
export interface WbsCreateArgs {
  arrowId: number
  name: string
  startDate?: string
  endDate?: string
  owner?: string
  status?: WbsItem['status']
  progress?: number
  estimatedHours?: number
}

/** WBS 更新の引数 */
export interface WbsUpdateArgs {
  id: number
  arrowId?: number
  name?: string
  startDate?: string
  endDate?: string
  owner?: string
  status?: WbsItem['status']
  progress?: number
  estimatedHours?: number
  actualHours?: number
}

// --- 課題 ---

/** 課題作成の引数 */
export interface IssueCreateArgs {
  projectId: number
  title: string
  description?: string
  owner?: string
  priority?: Issue['priority']
  status?: Issue['status']
  dueDate?: string
}

/** 課題更新の引数 */
export interface IssueUpdateArgs {
  id: number
  title?: string
  description?: string
  owner?: string
  priority?: Issue['priority']
  status?: Issue['status']
  dueDate?: string
  resolution?: string
}

// --- メンバー ---

export interface MemberCreateArgs {
  projectId: number
  name: string
  role?: string
  organization?: string
  email?: string
  note?: string
}

export interface MemberUpdateArgs {
  id: number
  name?: string
  role?: string
  organization?: string
  email?: string
  note?: string
}

// --- プロジェクトサマリ ---

/** プロジェクトの統計サマリ */
export interface ProjectSummary {
  arrowCount: number
  wbsItemCount: number
  issueCount: number
  openIssueCount: number
  milestoneCount: number
  memberCount: number
}

// --- エクスポート ---

/** Excel 保存の引数 */
export interface ExportSaveArgs {
  buffer: number[]
  defaultName: string
}
