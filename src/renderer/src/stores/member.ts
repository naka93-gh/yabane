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

  async function fetchMembers(projectId: number): Promise<void> {
    loading.value = true
    try {
      members.value = await api.listMembers({ projectId })
    } finally {
      loading.value = false
    }
  }

  async function addMember(args: MemberCreateArgs): Promise<Member> {
    const created = await api.createMember(args)
    members.value.push(created)
    return created
  }

  async function editMember(args: MemberUpdateArgs): Promise<void> {
    const updated = await api.updateMember(args)
    const idx = members.value.findIndex((m) => m.id === args.id)
    if (idx !== -1) members.value[idx] = updated
  }

  async function removeMember(id: number): Promise<void> {
    await api.deleteMember({ id })
    members.value = members.value.filter((m) => m.id !== id)
  }

  return { members, loading, memberNames, fetchMembers, addMember, editMember, removeMember }
})
