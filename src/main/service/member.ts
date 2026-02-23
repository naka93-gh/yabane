import { getDatabase } from '../database'
import type { Member } from '../../shared/types/models'
import type { MemberCreateArgs, MemberUpdateArgs } from '../../shared/types/ipc'
import { nextSortOrder } from './common'

/** メンバー一覧を取得する */
export function listMembers(projectId: number): Member[] {
  const db = getDatabase()
  return db
    .prepare('SELECT * FROM member WHERE project_id = ? ORDER BY sort_order, id')
    .all(projectId) as Member[]
}

/** メンバーを作成する */
export function createMember(args: MemberCreateArgs): Member {
  const db = getDatabase()
  const sortOrder = nextSortOrder('member', 'project_id = ?', [args.projectId])
  return db
    .prepare(
      'INSERT INTO member (project_id, name, role, organization, email, note, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *'
    )
    .get(
      args.projectId,
      args.name,
      args.role ?? null,
      args.organization ?? null,
      args.email ?? null,
      args.note ?? null,
      sortOrder
    ) as Member
}

/** メンバーを更新する */
export function updateMember(args: MemberUpdateArgs): Member | null {
  const db = getDatabase()
  const member = db.prepare('SELECT * FROM member WHERE id = ?').get(args.id) as Member | undefined
  if (!member) return null
  const name = args.name ?? member.name
  const role = args.role !== undefined ? args.role : member.role
  const organization = args.organization !== undefined ? args.organization : member.organization
  const email = args.email !== undefined ? args.email : member.email
  const note = args.note !== undefined ? args.note : member.note
  return db
    .prepare(
      'UPDATE member SET name = ?, role = ?, organization = ?, email = ?, note = ? WHERE id = ? RETURNING *'
    )
    .get(name, role, organization, email, note, args.id) as Member
}

/** メンバーを削除する */
export function deleteMember(id: number): Member | undefined {
  const db = getDatabase()
  return db.prepare('DELETE FROM member WHERE id = ? RETURNING *').get(id) as Member | undefined
}
