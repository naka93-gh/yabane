import { ipcMain } from 'electron'
import {
  listWbsItems,
  createWbsItem,
  updateWbsItem,
  deleteWbsItem,
  reorderWbsItems
} from '../service/wbs'
import type { WbsCreateArgs, WbsUpdateArgs } from '../../shared/types/ipc'

/** WBS 関連の IPC ハンドラを登録する */
export function registerWbsHandlers(): void {
  ipcMain.handle('wbs:list', (_e, args: { projectId: number }) => {
    return listWbsItems(args.projectId)
  })

  ipcMain.handle('wbs:create', (_e, args: WbsCreateArgs) => {
    return createWbsItem(args)
  })

  ipcMain.handle('wbs:update', (_e, args: WbsUpdateArgs) => {
    return updateWbsItem(args)
  })

  ipcMain.handle('wbs:delete', (_e, args: { id: number }) => {
    return deleteWbsItem(args.id)
  })

  ipcMain.handle('wbs:reorder', (_e, args: { ids: number[] }) => {
    reorderWbsItems(args.ids)
  })
}
