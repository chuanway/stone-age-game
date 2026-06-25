CREATE TABLE IF NOT EXISTS clan_buildings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clan_id INTEGER NOT NULL REFERENCES clans(id),
  type TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  contributed_wood INTEGER NOT NULL DEFAULT 0,
  contributed_food INTEGER NOT NULL DEFAULT 0,
  contributed_metal INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(clan_id, type)
);
