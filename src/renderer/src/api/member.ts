import type { Member } from '@shared/types/models'
import type { MemberCreateArgs, MemberUpdateArgs } from '@shared/types/ipc'

export function listMembers(args: { projectId: number }): Promise<Member[]> {
  return window.api.member.list(args)
}

export function createMember(args: MemberCreateArgs): Promise<Member> {
  return window.api.member.create(args)
}

export function updateMember(args: MemberUpdateArgs): Promise<Member> {
  return window.api.member.update(args)
}

export function deleteMember(args: { id: number }): Promise<Member> {
  return window.api.member.delete(args)
}
