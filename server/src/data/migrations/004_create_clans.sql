CREATE TABLE IF NOT EXISTS clans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL REFERENCES game_players(id),
  game_id INTEGER NOT NULL REFERENCES games(id),
  name TEXT NOT NULL,
  clan_attack_level INTEGER NOT NULL DEFAULT 1,
  clan_defense_level INTEGER NOT NULL DEFAULT 1,
  clan_attack_progress INTEGER NOT NULL DEFAULT 0,
  clan_defense_progress INTEGER NOT NULL DEFAULT 0,
  last_attack_at TEXT,
  last_defended_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(name, game_id)
);

CREATE TABLE IF NOT EXISTS clan_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clan_id INTEGER NOT NULL REFERENCES clans(id),
  player_game_id INTEGER NOT NULL UNIQUE REFERENCES game_players(id),
  role TEXT NOT NULL DEFAULT 'member',
  contributed_civilians INTEGER NOT NULL DEFAULT 0,
  clan_energy INTEGER NOT NULL DEFAULT 100,
  clan_max_energy INTEGER NOT NULL DEFAULT 100,
  clan_last_energy_at TEXT,
  joined_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS clan_wars (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  attacker_clan_id INTEGER NOT NULL REFERENCES clans(id),
  defender_clan_id INTEGER NOT NULL REFERENCES clans(id),
  attacker_army INTEGER NOT NULL,
  defender_army INTEGER NOT NULL,
  rounds_committed INTEGER NOT NULL,
  rounds_won INTEGER NOT NULL DEFAULT 0,
  rounds_lost INTEGER NOT NULL DEFAULT 0,
  enslaved INTEGER NOT NULL DEFAULT 0,
  winner_clan_id INTEGER REFERENCES clans(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS clan_pve_battles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clan_id INTEGER NOT NULL REFERENCES clans(id),
  monster_id TEXT NOT NULL,
  total_hp INTEGER NOT NULL,
  current_hp INTEGER NOT NULL,
  state TEXT NOT NULL DEFAULT 'active',
  leader_id INTEGER NOT NULL REFERENCES game_players(id),
  loot_per_member TEXT NOT NULL,
  collected TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS clan_pve_contributions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pve_battle_id INTEGER NOT NULL REFERENCES clan_pve_battles(id),
  player_game_id INTEGER NOT NULL REFERENCES game_players(id),
  soldiers_spent INTEGER NOT NULL,
  damage_dealt INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(pve_battle_id, player_game_id)
);

CREATE TABLE IF NOT EXISTS clan_war_participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  war_id INTEGER NOT NULL REFERENCES clan_wars(id),
  player_game_id INTEGER NOT NULL REFERENCES game_players(id),
  UNIQUE(war_id, player_game_id)
);
