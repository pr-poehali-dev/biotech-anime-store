
-- Дипломатия
CREATE TABLE IF NOT EXISTS t_p83915249_biotech_anime_store.empire_diplomacy (
  id           SERIAL PRIMARY KEY,
  player_id    INTEGER NOT NULL REFERENCES t_p83915249_biotech_anime_store.empire_players(id),
  target_id    INTEGER NOT NULL,
  target_type  TEXT    NOT NULL DEFAULT 'player',
  relation_type TEXT   NOT NULL DEFAULT 'neutral',
  message      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(player_id, target_id, target_type)
);

-- Магазин — история покупок (таблица уже может существовать, добавляем поля если нет)
ALTER TABLE t_p83915249_biotech_anime_store.shop_purchases
  ADD COLUMN IF NOT EXISTS package_id   TEXT,
  ADD COLUMN IF NOT EXISTS package_name TEXT,
  ADD COLUMN IF NOT EXISTS price_rub    INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rewards      JSONB;

-- Добавляем галактики рас — новые звёздные системы (центральная ИИ + по одной на расу)
INSERT INTO t_p83915249_biotech_anime_store.empire_systems (name, pos_x, pos_y, star_type, star_size, sector, planet_count)
SELECT name, pos_x, pos_y, star_type, star_size, sector, planet_count FROM (VALUES
  ('Солнечное Ядро',   400, 400, 'neutron',   10, 'core',       6),
  ('Галактика Солярин',100,  80, 'yellow',     7, 'solarians',  5),
  ('Тёмная Бездна',   700,  80, 'neutron',    6, 'voidstalkers',4),
  ('Кузница Железа',  100, 700, 'red_giant',  8, 'ironborn',   5),
  ('Лесной Мир',      700, 700, 'yellow',     6, 'arboreals',  5),
  ('Глубины Океана',  100, 400, 'blue',       7, 'deepones',   4),
  ('Призрачная Мгла', 700, 400, 'white',      5, 'wraithkin',  4),
  ('Разум Пустоты',   400, 100, 'blue',       8, 'psionic',    4),
  ('Рой Улья',        400, 700, 'red_dwarf',  4, 'hiveborn',   6),
  ('Ядро Титанов',    250, 250, 'red_giant',  9, 'titanforge', 5)
) AS v(name, pos_x, pos_y, star_type, star_size, sector, planet_count)
WHERE NOT EXISTS (
  SELECT 1 FROM t_p83915249_biotech_anime_store.empire_systems WHERE sector IN ('core','solarians','voidstalkers','ironborn','arboreals','deepones','wraithkin','psionic','hiveborn','titanforge')
);

-- Планеты для центральной системы ИИ (богатые ресурсами)
INSERT INTO t_p83915249_biotech_anime_store.empire_planets
  (name, star_system_id, pos_x, pos_y, orbit_slot, planet_type, biome, size,
   metal_richness, energy_richness, crystal_richness, special_resource,
   is_ai_controlled, ai_fleet_tier, is_colonizable)
SELECT
  name, sys.id, pos_x, pos_y, orbit_slot, planet_type, biome, size,
  metal_r, energy_r, crystal_r, special_resource,
  TRUE, ai_tier, TRUE
FROM (VALUES
  ('Нексус Альфа',   350, 370, 1, 'terrestrial','volcanic',  8, 5.0, 4.0, 3.0, 'rare_ore',        5),
  ('Кристальный Гигант',420,380,2,'crystal',    'crystal',   9, 2.0, 3.0, 8.0, 'pure_crystals',   6),
  ('Магма Прайм',    400, 420, 3, 'lava',       'volcanic', 10, 7.0, 6.0, 2.0, 'dark_ore',        7),
  ('Нейтрон-7',      380, 400, 4, 'gas_giant',  'plasma',    9, 3.0, 9.0, 1.0, 'plasma_energy',   6),
  ('Тёмный Сингуляр',415, 395, 5, 'ice',        'frozen',    7, 2.0, 2.0, 5.0, 'dark_matter_vein', 8),
  ('Артефакт X',     390, 415, 6, 'terrestrial','ancient',  10, 4.0, 5.0, 6.0, 'ancient_tech',    9)
) AS v(name, pos_x, pos_y, orbit_slot, planet_type, biome, size, metal_r, energy_r, crystal_r, special_resource, ai_tier)
CROSS JOIN (
  SELECT id FROM t_p83915249_biotech_anime_store.empire_systems WHERE sector='core' LIMIT 1
) AS sys
WHERE NOT EXISTS (
  SELECT 1 FROM t_p83915249_biotech_anime_store.empire_planets WHERE special_resource='rare_ore' AND star_system_id = sys.id
);
