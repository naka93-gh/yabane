import { ipcMain, dialog, BrowserWindow } from 'electron'
import { readFileSync } from 'fs'
import type { CsvOpenResult } from '../../shared/types/ipc'

/** インポート関連の IPC ハンドラを登録する */
export function registerImportHandlers(): void {
  ipcMain.handle('import:openCsv', async (): Promise<CsvOpenResult> => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return { canceled: true }

    const result = await dialog.showOpenDialog(win, {
      filters: [{ name: 'CSV', extensions: ['csv'] }],
      properties: ['openFile']
    })

    if (result.canceled || result.filePaths.length === 0) return { canceled: true }

    const raw = readFileSync(result.filePaths[0], 'utf-8')
    // BOM 除去
    const content = raw.replace(/^\uFEFF/, '')
    return { canceled: false, content }
  })
}
