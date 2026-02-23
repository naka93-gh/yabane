import type { Member } from '@shared/types/models'
import type {
  MemberCreateArgs,
  MemberUpdateArgs,
  CsvSaveArgs,
  CsvOpenResult
} from '@shared/types/ipc'

/** メンバー一覧を取得する */
export function listMembers(args: { projectId: number; archived?: number }): Promise<Member[]> {
  return window.api.member.list(args)
}

/** メンバーを作成する */
export function createMember(args: MemberCreateArgs): Promise<Member> {
  return window.api.member.create(args)
}

/** メンバーを更新する */
export function updateMember(args: MemberUpdateArgs): Promise<Member> {
  return window.api.member.update(args)
}

/** メンバーを削除する */
export function deleteMember(args: { id: number }): Promise<Member> {
  return window.api.member.delete(args)
}

/** メンバーをアーカイブする */
export function archiveMember(args: { id: number }): Promise<Member> {
  return window.api.member.archive(args)
}

/** メンバーのアーカイブを解除する */
export function unarchiveMember(args: { id: number }): Promise<Member> {
  return window.api.member.unarchive(args)
}

/** メンバーの並び順を更新する */
export function reorderMembers(args: { ids: number[] }): Promise<void> {
  return window.api.member.reorder(args)
}

/** CSV ファイルを保存する */
export function saveCsv(args: CsvSaveArgs): Promise<{ canceled: boolean; filePath?: string }> {
  return window.api.export.saveCsv(args)
}

/** CSV ファイルを開く */
export function openCsv(): Promise<CsvOpenResult> {
  return window.api.import.openCsv()
}
