/** 全テーブルの CREATE TABLE 文 */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS project (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  description TEXT,
  start_date  TEXT,
  end_date    TEXT,
  status      TEXT NOT NULL DEFAULT 'planning',
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

CREATE TABLE IF NOT EXISTS purpose_history (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  purpose_id   INTEGER NOT NULL REFERENCES purpose(id) ON DELETE CASCADE,
  background   TEXT,
  objective    TEXT,
  scope        TEXT,
  out_of_scope TEXT,
  assumption   TEXT,
  saved_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS milestone (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id  INTEGER NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  due_date    TEXT,
  color       TEXT NOT NULL DEFAULT '#6366f1',
  completed   INTEGER NOT NULL DEFAULT 0,
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
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id   INTEGER NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  issue_number INTEGER NOT NULL DEFAULT 0,
  title        TEXT NOT NULL,
  description TEXT,
  owner       TEXT,
  priority    TEXT NOT NULL DEFAULT 'medium',
  status      TEXT NOT NULL DEFAULT 'open',
  due_date    TEXT,
  resolution  TEXT,
  resolved_at TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS issue_comment (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  issue_id   INTEGER NOT NULL REFERENCES issue(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS issue_tag (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  color      TEXT NOT NULL DEFAULT '#6366f1',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS issue_tag_map (
  issue_id INTEGER NOT NULL REFERENCES issue(id) ON DELETE CASCADE,
  tag_id   INTEGER NOT NULL REFERENCES issue_tag(id) ON DELETE CASCADE,
  PRIMARY KEY (issue_id, tag_id)
);

CREATE TABLE IF NOT EXISTS member (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id   INTEGER NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  role         TEXT,
  organization TEXT,
  email        TEXT,
  note         TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
`
