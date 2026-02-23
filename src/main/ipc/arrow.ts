import { ipcMain } from 'electron'
import { listArrows, createArrow, updateArrow, deleteArrow, reorderArrows } from '../service/arrow'
import type { ArrowCreateArgs, ArrowUpdateArgs } from '../../shared/types/ipc'

/** 矢羽関連の IPC ハンドラを登録する */
export function registerArrowHandlers(): void {
  ipcMain.handle('arrow:list', (_e, args: { projectId: number }) => {
    return listArrows(args.projectId)
  })

  ipcMain.handle('arrow:create', (_e, args: ArrowCreateArgs) => {
    return createArrow(args)
  })

  ipcMain.handle('arrow:update', (_e, args: ArrowUpdateArgs) => {
    return updateArrow(args)
  })

  ipcMain.handle('arrow:delete', (_e, args: { id: number }) => {
    return deleteArrow(args.id)
  })

  ipcMain.handle('arrow:reorder', (_e, args: { ids: number[] }) => {
    reorderArrows(args.ids)
  })
}
