import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Member } from '@shared/types/models'
import type { MemberCreateArgs, MemberUpdateArgs } from '@shared/types/ipc'
import * as api from '../api/member'

export const useMemberStore = defineStore('member', () => {
  const members = ref<Member[]>([])
  const loading = ref(false)

  /** AutoComplete 候補用の名前リスト */
  const memberNames = computed(() => members.value.map((m) => m.name))

  /** メンバー一覧を取得してストアに反映する */
  async function fetchMembers(projectId: number): Promise<void> {
    loading.value = true
    try {
      members.value = await api.listMembers({ projectId })
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

  /** メンバーの並び順を更新する */
  async function reorder(ids: number[]): Promise<void> {
    await api.reorderMembers({ ids })
    const orderMap = new Map(ids.map((id, i) => [id, i]))
    members.value = members.value
      .map((m) => (orderMap.has(m.id) ? { ...m, sort_order: orderMap.get(m.id)! } : m))
      .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
  }

  return { members, loading, memberNames, fetchMembers, addMember, editMember, removeMember, reorder }
})
