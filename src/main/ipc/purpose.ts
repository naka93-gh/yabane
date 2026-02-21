import { ipcMain } from 'electron'
import { getDatabase } from '../database'

export function registerPurposeHandlers(): void {
  const db = getDatabase()

  ipcMain.handle('purpose:get', (_e, args: { projectId: number }) => {
    return db.prepare('SELECT * FROM purpose WHERE project_id = ?').get(args.projectId) ?? null
  })

  ipcMain.handle(
    'purpose:save',
    (
      _e,
      args: {
        projectId: number
        background?: string
        objective?: string
        scope?: string
        out_of_scope?: string
        assumption?: string
      }
    ) => {
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
        )
    }
  )
}
