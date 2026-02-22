import { getDatabase } from '../database'
import type { Purpose } from '../../shared/types/models'

/** プロジェクトの目的を取得する */
export function getPurpose(projectId: number): Purpose | null {
  const db = getDatabase()
  return (
    (db.prepare('SELECT * FROM purpose WHERE project_id = ?').get(projectId) as
      | Purpose
      | undefined) ?? null
  )
}

/** プロジェクトの目的を保存する（UPSERT） */
export function savePurpose(args: {
  projectId: number
  background?: string
  objective?: string
  scope?: string
  out_of_scope?: string
  assumption?: string
}): Purpose {
  const db = getDatabase()
  return db
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
}
