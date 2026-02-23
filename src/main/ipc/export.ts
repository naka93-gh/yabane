import { ipcMain, dialog, BrowserWindow } from 'electron'
import { writeFileSync } from 'fs'
import type { CsvSaveArgs } from '../../shared/types/ipc'

/** エクスポート関連の IPC ハンドラを登録する */
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

  ipcMain.handle('export:saveCsv', async (_e, args: CsvSaveArgs) => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return { canceled: true }

    const result = await dialog.showSaveDialog(win, {
      defaultPath: args.defaultName,
      filters: [{ name: 'CSV', extensions: ['csv'] }]
    })

    if (result.canceled || !result.filePath) return { canceled: true }

    writeFileSync(result.filePath, args.content, 'utf-8')
    return { canceled: false, filePath: result.filePath }
  })
}
