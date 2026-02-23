import { ipcMain } from 'electron'
import {
  listMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  reorderMilestones
} from '../service/milestone'
import type { MilestoneCreateArgs, MilestoneUpdateArgs } from '../../shared/types/ipc'

/** マイルストーン関連の IPC ハンドラを登録する */
export function registerMilestoneHandlers(): void {
  ipcMain.handle('milestone:list', (_e, args: { projectId: number }) => {
    return listMilestones(args.projectId)
  })

  ipcMain.handle('milestone:create', (_e, args: MilestoneCreateArgs) => {
    return createMilestone(args)
  })

  ipcMain.handle('milestone:update', (_e, args: MilestoneUpdateArgs) => {
    return updateMilestone(args)
  })

  ipcMain.handle('milestone:delete', (_e, args: { id: number }) => {
    return deleteMilestone(args.id)
  })

  ipcMain.handle('milestone:reorder', (_e, args: { ids: number[] }) => {
    reorderMilestones(args.ids)
  })
}
