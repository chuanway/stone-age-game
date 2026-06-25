CREATE TABLE IF NOT EXISTS player_buildings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_game_id INTEGER NOT NULL REFERENCES game_players(id),
  type TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_player_buildings_player_game ON player_buildings(player_game_id);
