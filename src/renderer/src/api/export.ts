import type { ExportSaveArgs } from '@shared/types/ipc'

/** Excel ファイルを保存ダイアログ経由で書き出す */
export function saveExcel(args: ExportSaveArgs): Promise<{ canceled: boolean; filePath?: string }> {
  return window.api.export.saveExcel(args)
}
