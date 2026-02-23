import { ipcMain } from 'electron'
import { listMembers, createMember, updateMember, deleteMember } from '../service/member'
import type { MemberCreateArgs, MemberUpdateArgs } from '../../shared/types/ipc'

/** メンバー関連の IPC ハンドラを登録する */
export function registerMemberHandlers(): void {
  ipcMain.handle('member:list', (_e, args: { projectId: number }) => {
    return listMembers(args.projectId)
  })
  ipcMain.handle('member:create', (_e, args: MemberCreateArgs) => {
    return createMember(args)
  })
  ipcMain.handle('member:update', (_e, args: MemberUpdateArgs) => {
    return updateMember(args)
  })
  ipcMain.handle('member:delete', (_e, args: { id: number }) => {
    return deleteMember(args.id)
  })
}
