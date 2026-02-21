import { ipcMain } from 'electron'
import { getPurpose, savePurpose } from '../service/purpose'

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
