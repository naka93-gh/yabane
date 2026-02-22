import { ipcMain } from 'electron'
import {
  listWbsItems,
  createWbsItem,
  updateWbsItem,
  deleteWbsItem,
  reorderWbsItems
} from '../service/wbs'
import type { WbsItem } from '../../shared/types/models'

/** WBS 関連の IPC ハンドラを登録する */
export function registerWbsHandlers(): void {
  ipcMain.handle('wbs:list', (_e, args: { projectId: number }) => {
    return listWbsItems(args.projectId)
  })

  ipcMain.handle(
    'wbs:create',
    (
      _e,
      args: {
        arrowId: number
        name: string
        startDate?: string
        endDate?: string
        owner?: string
        status?: WbsItem['status']
        progress?: number
        estimatedHours?: number
      }
    ) => {
      return createWbsItem(args)
    }
  )

  ipcMain.handle(
    'wbs:update',
    (
      _e,
      args: {
        id: number
        arrowId?: number
        name?: string
        startDate?: string
        endDate?: string
        owner?: string
        status?: WbsItem['status']
        progress?: number
        estimatedHours?: number
        actualHours?: number
      }
    ) => {
      return updateWbsItem(args)
    }
  )

  ipcMain.handle('wbs:delete', (_e, args: { id: number }) => {
    return deleteWbsItem(args.id)
  })

  ipcMain.handle('wbs:reorder', (_e, args: { ids: number[] }) => {
    reorderWbsItems(args.ids)
  })
}
