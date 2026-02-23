import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Member } from '@shared/types/models'
import type { MemberCreateArgs, MemberUpdateArgs } from '@shared/types/ipc'
import * as api from '../api/member'
import { buildMemberCsv, parseMemberCsv } from '../utils/csv'

export const useMemberStore = defineStore('member', () => {
  const members = ref<Member[]>([])
  const loading = ref(false)

  /** AutoComplete 候補用の名前リスト */
  const memberNames = computed(() => members.value.map((m) => m.name))

  /** メンバー一覧を取得してストアに反映する */
  async function fetchMembers(projectId: number, archived?: number): Promise<void> {
    loading.value = true
    try {
      members.value = await api.listMembers({ projectId, archived })
    } finally {
      loading.value = false
    }
  }

  /** メンバーを追加しストアに反映する */
  async function addMember(args: MemberCreateArgs): Promise<Member> {
    const created = await api.createMember(args)
    members.value.push(created)
    return created
  }

  /** メンバーを更新しストアに反映する */
  async function editMember(args: MemberUpdateArgs): Promise<void> {
    const updated = await api.updateMember(args)
    const idx = members.value.findIndex((m) => m.id === args.id)
    if (idx !== -1) members.value[idx] = updated
  }

  /** メンバーを削除しストアから除去する */
  async function removeMember(id: number): Promise<void> {
    await api.deleteMember({ id })
    members.value = members.value.filter((m) => m.id !== id)
  }

  /** メンバーをアーカイブしストアから除去する */
  async function archiveMember(id: number): Promise<void> {
    await api.archiveMember({ id })
    members.value = members.value.filter((m) => m.id !== id)
  }

  /** メンバーのアーカイブを解除しストアから除去する */
  async function unarchiveMember(id: number): Promise<void> {
    await api.unarchiveMember({ id })
    members.value = members.value.filter((m) => m.id !== id)
  }

  /** メンバーの並び順を更新する */
  async function reorder(ids: number[]): Promise<void> {
    await api.reorderMembers({ ids })
    const orderMap = new Map(ids.map((id, i) => [id, i]))
    members.value = members.value
      .map((m) => (orderMap.has(m.id) ? { ...m, sort_order: orderMap.get(m.id)! } : m))
      .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
  }

  /** メンバー一覧を CSV としてエクスポートする */
  async function exportCsv(): Promise<boolean> {
    const csv = buildMemberCsv(members.value)
    const result = await api.saveCsv({ content: csv, defaultName: 'members.csv' })
    return !result.canceled
  }

  /** CSV ファイルからメンバーを一括インポートする。追加件数を返す。 */
  async function importCsv(projectId: number): Promise<number> {
    const result = await api.openCsv()
    if (result.canceled || !result.content) return 0

    const rows = parseMemberCsv(result.content, projectId)
    for (const row of rows) {
      await api.createMember(row)
    }
    await fetchMembers(projectId)
    return rows.length
  }

  return {
    members,
    loading,
    memberNames,
    fetchMembers,
    addMember,
    editMember,
    removeMember,
    archiveMember,
    unarchiveMember,
    reorder,
    exportCsv,
    importCsv
  }
})
