CREATE TABLE IF NOT EXISTS player_pve_battles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_game_id INTEGER NOT NULL REFERENCES game_players(id),
  monster_id TEXT NOT NULL,
  rounds_committed INTEGER NOT NULL,
  rounds_won INTEGER NOT NULL DEFAULT 0,
  army_committed INTEGER NOT NULL,
  army_survived INTEGER NOT NULL DEFAULT 0,
  food_loot INTEGER NOT NULL DEFAULT 0,
  wood_loot INTEGER NOT NULL DEFAULT 0,
  metal_loot INTEGER NOT NULL DEFAULT 0,
  pop_loot INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
