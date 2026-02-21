import { ipcMain } from 'electron'
import {
  listMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  reorderMilestones
} from '../service/milestone'

export function registerMilestoneHandlers(): void {
  ipcMain.handle('milestone:list', (_e, args: { projectId: number }) => {
    return listMilestones(args.projectId)
  })

  ipcMain.handle(
    'milestone:create',
    (
      _e,
      args: {
        projectId: number
        name: string
        description?: string
        dueDate?: string
        color?: string
      }
    ) => {
      return createMilestone(args)
    }
  )

  ipcMain.handle(
    'milestone:update',
    (
      _e,
      args: {
        id: number
        name?: string
        description?: string
        dueDate?: string
        color?: string
      }
    ) => {
      return updateMilestone(args)
    }
  )

  ipcMain.handle('milestone:delete', (_e, args: { id: number }) => {
    return deleteMilestone(args.id)
  })

  ipcMain.handle('milestone:reorder', (_e, args: { ids: number[] }) => {
    reorderMilestones(args.ids)
  })
}
