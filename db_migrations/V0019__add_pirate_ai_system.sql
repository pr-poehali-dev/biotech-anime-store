
-- Флоты пиратов (ИИ-управляемые)
CREATE TABLE IF NOT EXISTS t_p83915249_biotech_anime_store.pirate_fleets (
  id            SERIAL PRIMARY KEY,
  name          TEXT    NOT NULL DEFAULT 'Пиратский флот',
  tier          INTEGER NOT NULL DEFAULT 1,       -- уровень пирата 1-10
  ships         JSONB   NOT NULL DEFAULT '{}',
  total_attack  INTEGER NOT NULL DEFAULT 0,
  total_defense INTEGER NOT NULL DEFAULT 0,
  pos_x         INTEGER NOT NULL DEFAULT 400,
  pos_y         INTEGER NOT NULL DEFAULT 400,
  status        TEXT    NOT NULL DEFAULT 'idle',  -- idle|attacking|retreating|wrecked
  target_player_id INTEGER NULL,
  target_planet_id  INTEGER NULL,
  wreck_metal   INTEGER NOT NULL DEFAULT 0,
  wreck_energy  INTEGER NOT NULL DEFAULT 0,
  wreck_crystals INTEGER NOT NULL DEFAULT 0,
  tech_level    INTEGER NOT NULL DEFAULT 1,       -- уровень технологий пирата
  last_action_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Событие ИИ (атаки, оповещения, помощь ядра)
CREATE TABLE IF NOT EXISTS t_p83915249_biotech_anime_store.ai_events (
  id            SERIAL PRIMARY KEY,
  event_type    TEXT    NOT NULL,  -- pirate_attack|core_help|pirate_wrecked|core_victory
  player_id     INTEGER NOT NULL REFERENCES t_p83915249_biotech_anime_store.empire_players(id),
  pirate_fleet_id INTEGER NULL,
  message       TEXT    NOT NULL,
  data          JSONB   NOT NULL DEFAULT '{}',
  is_read       BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Союзы с ядром ИИ (для защиты)
CREATE TABLE IF NOT EXISTS t_p83915249_biotech_anime_store.core_diplomacy (
  id           SERIAL PRIMARY KEY,
  player_id    INTEGER NOT NULL UNIQUE REFERENCES t_p83915249_biotech_anime_store.empire_players(id),
  status       TEXT    NOT NULL DEFAULT 'none',  -- none|allied|hostile
  core_fleet_active BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Обломки (после уничтожения пиратского флота)
CREATE TABLE IF NOT EXISTS t_p83915249_biotech_anime_store.wrecks (
  id           SERIAL PRIMARY KEY,
  pos_x        INTEGER NOT NULL,
  pos_y        INTEGER NOT NULL,
  metal        INTEGER NOT NULL DEFAULT 0,
  energy       INTEGER NOT NULL DEFAULT 0,
  crystals     INTEGER NOT NULL DEFAULT 0,
  fuel         INTEGER NOT NULL DEFAULT 0,
  salvaged_by  INTEGER NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '2 hours'
);

CREATE INDEX IF NOT EXISTS idx_ai_events_player ON t_p83915249_biotech_anime_store.ai_events(player_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pirate_fleets_status ON t_p83915249_biotech_anime_store.pirate_fleets(status);

-- Стартовые пиратские флоты разного уровня
INSERT INTO t_p83915249_biotech_anime_store.pirate_fleets
  (name, tier, ships, total_attack, total_defense, pos_x, pos_y, status, tech_level)
VALUES
  ('Клинок Пустоты',    1, '{"fighter":3,"scout":2}',                          76,  55,  600, 600, 'idle', 1),
  ('Ржавый Коготь',     2, '{"fighter":5,"cruiser":1}',                        155, 145, 1800, 200, 'idle', 1),
  ('Тёмная Стая',       3, '{"cruiser":3,"fighter":4}',                        245, 235, 200, 1800, 'idle', 2),
  ('Железная Чума',     4, '{"cruiser":4,"battleship":1}',                     360, 330, 1800,1800, 'idle', 2),
  ('Налётчики Небытия', 5, '{"battleship":2,"cruiser":3,"stealth":1}',         558, 450, 600, 1800, 'idle', 3),
  ('Армада Хаоса',      6, '{"battleship":3,"dreadnought":1,"cruiser":2}',     835, 670, 1800, 600, 'idle', 3),
  ('Пожиратели Миров',  7, '{"dreadnought":2,"battleship":3,"stealth":2}',    1120, 920, 1200, 300, 'idle', 4),
  ('Флот Апокалипсиса', 8, '{"dreadnought":3,"battleship":4,"carrier":1}',   1620,1350, 300,1200, 'idle', 4);
