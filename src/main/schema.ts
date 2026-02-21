/** 全テーブルの CREATE TABLE 文 */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS project (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'active',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS purpose (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id   INTEGER NOT NULL UNIQUE REFERENCES project(id) ON DELETE CASCADE,
  background   TEXT,
  objective    TEXT,
  scope        TEXT,
  out_of_scope TEXT,
  assumption   TEXT,
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS milestone (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id  INTEGER NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  due_date    TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS arrow (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id  INTEGER NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  parent_id   INTEGER REFERENCES arrow(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  start_date  TEXT,
  end_date    TEXT,
  owner       TEXT,
  status      TEXT NOT NULL DEFAULT 'not_started',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wbs_item (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  arrow_id        INTEGER NOT NULL REFERENCES arrow(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  start_date      TEXT,
  end_date        TEXT,
  owner           TEXT,
  status          TEXT NOT NULL DEFAULT 'not_started',
  progress        INTEGER NOT NULL DEFAULT 0,
  estimated_hours REAL,
  actual_hours    REAL,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS issue (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id  INTEGER NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  owner       TEXT,
  priority    TEXT NOT NULL DEFAULT 'medium',
  status      TEXT NOT NULL DEFAULT 'open',
  due_date    TEXT,
  resolution  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
`
