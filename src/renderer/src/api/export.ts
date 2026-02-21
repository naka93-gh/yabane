export function saveExcel(args: {
  buffer: number[]
  defaultName: string
}): Promise<{ canceled: boolean; filePath?: string }> {
  return window.api.export.saveExcel(args)
}
