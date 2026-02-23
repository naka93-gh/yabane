import { getDatabase } from '../database'

/** 指定テーブルの行を ID 順に並び替える */
export function reorderRows(table: string, ids: number[]): void {
  const db = getDatabase()
  const update = db.prepare(`UPDATE ${table} SET sort_order = ? WHERE id = ?`)
  db.transaction(() => {
    ids.forEach((id, index) => {
      update.run(index, id)
    })
  })()
}

/** 指定テーブル・条件下での次の sort_order を取得する */
export function nextSortOrder(table: string, where: string, params: unknown[]): number {
  const db = getDatabase()
  const row = db
    .prepare(`SELECT COALESCE(MAX(sort_order), -1) as max_order FROM ${table} WHERE ${where}`)
    .get(...params) as { max_order: number }
  return row.max_order + 1
}
