import { ipcMain, dialog, BrowserWindow } from 'electron'
import { writeFileSync } from 'fs'

/** Excel エクスポート関連の IPC ハンドラを登録する */
export function registerExportHandlers(): void {
  ipcMain.handle(
    'export:saveExcel',
    async (_e, args: { buffer: number[]; defaultName: string }) => {
      const win = BrowserWindow.getFocusedWindow()
      if (!win) return { canceled: true }

      const result = await dialog.showSaveDialog(win, {
        defaultPath: args.defaultName,
        filters: [{ name: 'Excel', extensions: ['xlsx'] }]
      })

      if (result.canceled || !result.filePath) return { canceled: true }

      writeFileSync(result.filePath, Buffer.from(args.buffer))
      return { canceled: false, filePath: result.filePath }
    }
  )
}
