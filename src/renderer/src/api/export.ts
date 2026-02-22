/** Excel ファイルを保存ダイアログ経由で書き出す */
export function saveExcel(args: {
  buffer: number[]
  defaultName: string
}): Promise<{ canceled: boolean; filePath?: string }> {
  return window.api.export.saveExcel(args)
}
