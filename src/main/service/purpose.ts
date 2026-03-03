import type { PurposeSaveArgs } from '../../shared/types/ipc'
import type { Purpose, PurposeHistory } from '../../shared/types/models'
import { getDatabase } from '../database'

/** プロジェクトの目的を取得する */
export function getPurpose(projectId: number): Purpose | null {
  const db = getDatabase()
  return (
    (db.prepare('SELECT * FROM purpose WHERE project_id = ?').get(projectId) as
      | Purpose
      | undefined) ?? null
  )
}

/** プロジェクトの目的を保存する（UPSERT）+ 履歴を記録 */
export function savePurpose(args: PurposeSaveArgs): Purpose {
  const db = getDatabase()
  const purpose = db
    .prepare(
      `INSERT INTO purpose (project_id, background, objective, scope, out_of_scope, assumption)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(project_id) DO UPDATE SET
         background = excluded.background,
         objective = excluded.objective,
         scope = excluded.scope,
         out_of_scope = excluded.out_of_scope,
         assumption = excluded.assumption,
         updated_at = datetime('now')
       RETURNING *`
    )
    .get(
      args.projectId,
      args.background ?? null,
      args.objective ?? null,
      args.scope ?? null,
      args.out_of_scope ?? null,
      args.assumption ?? null
    ) as Purpose

  db.prepare(
    `INSERT INTO purpose_history (purpose_id, background, objective, scope, out_of_scope, assumption)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    purpose.id,
    purpose.background,
    purpose.objective,
    purpose.scope,
    purpose.out_of_scope,
    purpose.assumption
  )

  return purpose
}

/** 目的の変更履歴を取得する（最新50件） */
export function getPurposeHistory(projectId: number): PurposeHistory[] {
  const db = getDatabase()
  return db
    .prepare(
      `SELECT h.* FROM purpose_history h
       JOIN purpose p ON p.id = h.purpose_id
       WHERE p.project_id = ?
       ORDER BY h.saved_at DESC
       LIMIT 50`
    )
    .all(projectId) as PurposeHistory[]
}
