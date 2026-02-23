import XLSX from 'xlsx-js-style'

type CellStyle = XLSX.CellStyle

/** 細線の罫線スタイルを返す */
export function thinBorder(): CellStyle['border'] {
  const side = { style: 'thin' as const, color: { rgb: 'B4C6E7' } }
  return { top: side, bottom: side, left: side, right: side }
}

/** ヘッダー行のスタイル（白文字・青背景） */
export const HEADER_STYLE: CellStyle = {
  font: { bold: true, color: { rgb: 'FFFFFF' } },
  fill: { fgColor: { rgb: '4472C4' } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: thinBorder()
}

/** ラベル列のスタイル（太字・薄青背景） */
export const LABEL_STYLE: CellStyle = {
  font: { bold: true },
  fill: { fgColor: { rgb: 'D9E2F3' } },
  alignment: { vertical: 'top', wrapText: true },
  border: thinBorder()
}

/** 通常データセルのスタイル */
export const CELL_STYLE: CellStyle = {
  alignment: { vertical: 'top', wrapText: true },
  border: thinBorder()
}

/** 通常セルを生成する */
export function cell(v: string | number | null, style: CellStyle = CELL_STYLE): XLSX.CellObject {
  return { v: v ?? '', t: typeof v === 'number' ? 'n' : 's', s: style }
}

/** ヘッダーセルを生成する */
export function headerCell(v: string): XLSX.CellObject {
  return { v, t: 's', s: HEADER_STYLE }
}

/** ラベルセル（背景色付き）を生成する */
export function labelCell(v: string): XLSX.CellObject {
  return { v, t: 's', s: LABEL_STYLE }
}

/** Excel ガントバー用のステータスカラー */
export const BAR_COLORS: Record<string, string> = {
  not_started: 'BFBFBF',
  in_progress: '4472C4',
  done: '70AD47'
}
