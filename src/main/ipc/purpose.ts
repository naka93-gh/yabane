import { ipcMain } from 'electron'
import { getPurpose, savePurpose } from '../service/purpose'

/** 目的関連の IPC ハンドラを登録する */
export function registerPurposeHandlers(): void {
  ipcMain.handle('purpose:get', (_e, args: { projectId: number }) => {
    return getPurpose(args.projectId)
  })

  ipcMain.handle(
    'purpose:save',
    (
      _e,
      args: {
        projectId: number
        background?: string
        objective?: string
        scope?: string
        out_of_scope?: string
        assumption?: string
      }
    ) => {
      return savePurpose(args)
    }
  )
}
