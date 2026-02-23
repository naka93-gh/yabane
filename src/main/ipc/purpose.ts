import { ipcMain } from 'electron'
import { getPurpose, savePurpose } from '../service/purpose'
import type { PurposeSaveArgs } from '../../shared/types/ipc'

/** 目的関連の IPC ハンドラを登録する */
export function registerPurposeHandlers(): void {
  ipcMain.handle('purpose:get', (_e, args: { projectId: number }) => {
    return getPurpose(args.projectId)
  })

  ipcMain.handle('purpose:save', (_e, args: PurposeSaveArgs) => {
    return savePurpose(args)
  })
}
