
-- Расширяем карту до 2400x2400.
-- Каждая раса получает зону 700x700, системы в сетке 3x4 с шагом 300px.
-- Минимальное расстояние между центрами систем = 300px >> радиус орбит (~220px).

-- core
UPDATE t_p83915249_biotech_anime_store.empire_systems
SET pos_x = 1200, pos_y = 1200
WHERE sector = 'core';

-- solarians: угол СЗ, центр зоны (250, 250)
UPDATE t_p83915249_biotech_anime_store.empire_systems s
SET pos_x = v.x, pos_y = v.y
FROM (
  SELECT id,
    80  + ((ROW_NUMBER() OVER (ORDER BY id) - 1) % 3) * 300 AS x,
    80  + ((ROW_NUMBER() OVER (ORDER BY id) - 1) / 3) * 300 AS y
  FROM t_p83915249_biotech_anime_store.empire_systems WHERE sector = 'solarians'
) v WHERE s.id = v.id;

-- voidstalkers: СВ, центр (2150, 250)
UPDATE t_p83915249_biotech_anime_store.empire_systems s
SET pos_x = v.x, pos_y = v.y
FROM (
  SELECT id,
    1980 + ((ROW_NUMBER() OVER (ORDER BY id) - 1) % 3) * 300 AS x,
    80   + ((ROW_NUMBER() OVER (ORDER BY id) - 1) / 3) * 300 AS y
  FROM t_p83915249_biotech_anime_store.empire_systems WHERE sector = 'voidstalkers'
) v WHERE s.id = v.id;

-- ironborn: ЮЗ, центр (250, 2150)
UPDATE t_p83915249_biotech_anime_store.empire_systems s
SET pos_x = v.x, pos_y = v.y
FROM (
  SELECT id,
    80   + ((ROW_NUMBER() OVER (ORDER BY id) - 1) % 3) * 300 AS x,
    1980 + ((ROW_NUMBER() OVER (ORDER BY id) - 1) / 3) * 300 AS y
  FROM t_p83915249_biotech_anime_store.empire_systems WHERE sector = 'ironborn'
) v WHERE s.id = v.id;

-- arboreals: ЮВ, центр (2150, 2150)
UPDATE t_p83915249_biotech_anime_store.empire_systems s
SET pos_x = v.x, pos_y = v.y
FROM (
  SELECT id,
    1980 + ((ROW_NUMBER() OVER (ORDER BY id) - 1) % 3) * 300 AS x,
    1980 + ((ROW_NUMBER() OVER (ORDER BY id) - 1) / 3) * 300 AS y
  FROM t_p83915249_biotech_anime_store.empire_systems WHERE sector = 'arboreals'
) v WHERE s.id = v.id;

-- deepones: З, центр (250, 1200)
UPDATE t_p83915249_biotech_anime_store.empire_systems s
SET pos_x = v.x, pos_y = v.y
FROM (
  SELECT id,
    80   + ((ROW_NUMBER() OVER (ORDER BY id) - 1) % 3) * 300 AS x,
    980  + ((ROW_NUMBER() OVER (ORDER BY id) - 1) / 3) * 300 AS y
  FROM t_p83915249_biotech_anime_store.empire_systems WHERE sector = 'deepones'
) v WHERE s.id = v.id;

-- wraithkin: В, центр (2150, 1200)
UPDATE t_p83915249_biotech_anime_store.empire_systems s
SET pos_x = v.x, pos_y = v.y
FROM (
  SELECT id,
    1980 + ((ROW_NUMBER() OVER (ORDER BY id) - 1) % 3) * 300 AS x,
    980  + ((ROW_NUMBER() OVER (ORDER BY id) - 1) / 3) * 300 AS y
  FROM t_p83915249_biotech_anime_store.empire_systems WHERE sector = 'wraithkin'
) v WHERE s.id = v.id;

-- psionic: С, центр (1200, 250)
UPDATE t_p83915249_biotech_anime_store.empire_systems s
SET pos_x = v.x, pos_y = v.y
FROM (
  SELECT id,
    980  + ((ROW_NUMBER() OVER (ORDER BY id) - 1) % 3) * 300 AS x,
    80   + ((ROW_NUMBER() OVER (ORDER BY id) - 1) / 3) * 300 AS y
  FROM t_p83915249_biotech_anime_store.empire_systems WHERE sector = 'psionic'
) v WHERE s.id = v.id;

-- hiveborn: Ю, центр (1200, 2150)
UPDATE t_p83915249_biotech_anime_store.empire_systems s
SET pos_x = v.x, pos_y = v.y
FROM (
  SELECT id,
    980  + ((ROW_NUMBER() OVER (ORDER BY id) - 1) % 3) * 300 AS x,
    1980 + ((ROW_NUMBER() OVER (ORDER BY id) - 1) / 3) * 300 AS y
  FROM t_p83915249_biotech_anime_store.empire_systems WHERE sector = 'hiveborn'
) v WHERE s.id = v.id;

-- titanforge: центро-запад, центр (700, 700)
UPDATE t_p83915249_biotech_anime_store.empire_systems s
SET pos_x = v.x, pos_y = v.y
FROM (
  SELECT id,
    580  + ((ROW_NUMBER() OVER (ORDER BY id) - 1) % 3) * 300 AS x,
    580  + ((ROW_NUMBER() OVER (ORDER BY id) - 1) / 3) * 300 AS y
  FROM t_p83915249_biotech_anime_store.empire_systems WHERE sector = 'titanforge'
) v WHERE s.id = v.id;

-- alpha/beta/gamma/delta/omega — в центре карты кластером
UPDATE t_p83915249_biotech_anime_store.empire_systems s
SET pos_x = v.x, pos_y = v.y
FROM (
  SELECT id,
    950  + ((ROW_NUMBER() OVER (ORDER BY id) - 1) % 4) * 200 AS x,
    950  + ((ROW_NUMBER() OVER (ORDER BY id) - 1) / 4) * 200 AS y
  FROM t_p83915249_biotech_anime_store.empire_systems
  WHERE sector IN ('alpha','beta','gamma','delta','omega')
) v WHERE s.id = v.id;

-- Пересчёт орбит планет под новые позиции систем
UPDATE t_p83915249_biotech_anime_store.empire_planets p
SET
  pos_x = ROUND(s.pos_x + (40.0 + (r.rn - 1) * 28.0) * COS(-1.5708 + 6.2832 * (r.rn - 1) / NULLIF(r.total, 0)))::int,
  pos_y = ROUND(s.pos_y + (40.0 + (r.rn - 1) * 28.0) * SIN(-1.5708 + 6.2832 * (r.rn - 1) / NULLIF(r.total, 0)))::int
FROM (
  SELECT id, star_system_id,
    ROW_NUMBER() OVER (PARTITION BY star_system_id ORDER BY orbit_slot, id) AS rn,
    COUNT(*) OVER (PARTITION BY star_system_id) AS total
  FROM t_p83915249_biotech_anime_store.empire_planets
) r
JOIN t_p83915249_biotech_anime_store.empire_systems s ON s.id = r.star_system_id
WHERE p.id = r.id;
