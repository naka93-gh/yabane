import { ipcMain } from 'electron'
import {
  listArrows,
  createArrow,
  updateArrow,
  deleteArrow,
  reorderArrows
} from '../service/arrow'

/** 矢羽関連の IPC ハンドラを登録する */
export function registerArrowHandlers(): void {
  ipcMain.handle('arrow:list', (_e, args: { projectId: number }) => {
    return listArrows(args.projectId)
  })

  ipcMain.handle(
    'arrow:create',
    (
      _e,
      args: {
        projectId: number
        parentId?: number
        name: string
        startDate?: string
        endDate?: string
        owner?: string
        status?: string
      }
    ) => {
      return createArrow(args)
    }
  )

  ipcMain.handle(
    'arrow:update',
    (
      _e,
      args: {
        id: number
        name?: string
        startDate?: string
        endDate?: string
        owner?: string
        status?: string
        parentId?: number | null
      }
    ) => {
      return updateArrow(args)
    }
  )

  ipcMain.handle('arrow:delete', (_e, args: { id: number }) => {
    return deleteArrow(args.id)
  })

  ipcMain.handle('arrow:reorder', (_e, args: { ids: number[] }) => {
    reorderArrows(args.ids)
  })
}
