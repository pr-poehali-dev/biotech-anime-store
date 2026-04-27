
-- Карта 4200x4200. Центры галактик рас на расстоянии 1400px друг от друга.
-- Сетка 3x3: позиции центров (700,700),(2100,700),(3500,700),(700,2100)...
-- Системы внутри каждой зоны: сетка 3x4, шаг 200px, начало смещено от центра на -200,-300
-- Итого spread = 400x600, maxDist ≈ sqrt(200^2+300^2)≈360, haloR≈360+200=560
-- Расстояние между центрами = 1400px >> 560*2=1120px → ореолы не касаются ✓

-- CORE — центр карты (2100, 2100)
UPDATE t_p83915249_biotech_anime_store.empire_systems
SET pos_x = 2100, pos_y = 2100
WHERE sector = 'core';

-- SOLARIANS — СЗ угол, центр (700, 700)
UPDATE t_p83915249_biotech_anime_store.empire_systems s
SET pos_x = v.x, pos_y = v.y
FROM (
  SELECT id,
    500 + ((ROW_NUMBER() OVER (ORDER BY id) - 1) % 3) * 200 AS x,
    500 + ((ROW_NUMBER() OVER (ORDER BY id) - 1) / 3) * 200 AS y
  FROM t_p83915249_biotech_anime_store.empire_systems WHERE sector = 'solarians'
) v WHERE s.id = v.id;

-- PSIONIC — С, центр (2100, 700)
UPDATE t_p83915249_biotech_anime_store.empire_systems s
SET pos_x = v.x, pos_y = v.y
FROM (
  SELECT id,
    1900 + ((ROW_NUMBER() OVER (ORDER BY id) - 1) % 3) * 200 AS x,
    500  + ((ROW_NUMBER() OVER (ORDER BY id) - 1) / 3) * 200 AS y
  FROM t_p83915249_biotech_anime_store.empire_systems WHERE sector = 'psionic'
) v WHERE s.id = v.id;

-- VOIDSTALKERS — СВ, центр (3500, 700)
UPDATE t_p83915249_biotech_anime_store.empire_systems s
SET pos_x = v.x, pos_y = v.y
FROM (
  SELECT id,
    3300 + ((ROW_NUMBER() OVER (ORDER BY id) - 1) % 3) * 200 AS x,
    500  + ((ROW_NUMBER() OVER (ORDER BY id) - 1) / 3) * 200 AS y
  FROM t_p83915249_biotech_anime_store.empire_systems WHERE sector = 'voidstalkers'
) v WHERE s.id = v.id;

-- DEEPONES — З, центр (700, 2100)
UPDATE t_p83915249_biotech_anime_store.empire_systems s
SET pos_x = v.x, pos_y = v.y
FROM (
  SELECT id,
    500  + ((ROW_NUMBER() OVER (ORDER BY id) - 1) % 3) * 200 AS x,
    1900 + ((ROW_NUMBER() OVER (ORDER BY id) - 1) / 3) * 200 AS y
  FROM t_p83915249_biotech_anime_store.empire_systems WHERE sector = 'deepones'
) v WHERE s.id = v.id;

-- WRAITHKIN — В, центр (3500, 2100)
UPDATE t_p83915249_biotech_anime_store.empire_systems s
SET pos_x = v.x, pos_y = v.y
FROM (
  SELECT id,
    3300 + ((ROW_NUMBER() OVER (ORDER BY id) - 1) % 3) * 200 AS x,
    1900 + ((ROW_NUMBER() OVER (ORDER BY id) - 1) / 3) * 200 AS y
  FROM t_p83915249_biotech_anime_store.empire_systems WHERE sector = 'wraithkin'
) v WHERE s.id = v.id;

-- IRONBORN — ЮЗ, центр (700, 3500)
UPDATE t_p83915249_biotech_anime_store.empire_systems s
SET pos_x = v.x, pos_y = v.y
FROM (
  SELECT id,
    500  + ((ROW_NUMBER() OVER (ORDER BY id) - 1) % 3) * 200 AS x,
    3300 + ((ROW_NUMBER() OVER (ORDER BY id) - 1) / 3) * 200 AS y
  FROM t_p83915249_biotech_anime_store.empire_systems WHERE sector = 'ironborn'
) v WHERE s.id = v.id;

-- HIVEBORN — Ю, центр (2100, 3500)
UPDATE t_p83915249_biotech_anime_store.empire_systems s
SET pos_x = v.x, pos_y = v.y
FROM (
  SELECT id,
    1900 + ((ROW_NUMBER() OVER (ORDER BY id) - 1) % 3) * 200 AS x,
    3300 + ((ROW_NUMBER() OVER (ORDER BY id) - 1) / 3) * 200 AS y
  FROM t_p83915249_biotech_anime_store.empire_systems WHERE sector = 'hiveborn'
) v WHERE s.id = v.id;

-- ARBOREALS — ЮВ, центр (3500, 3500)
UPDATE t_p83915249_biotech_anime_store.empire_systems s
SET pos_x = v.x, pos_y = v.y
FROM (
  SELECT id,
    3300 + ((ROW_NUMBER() OVER (ORDER BY id) - 1) % 3) * 200 AS x,
    3300 + ((ROW_NUMBER() OVER (ORDER BY id) - 1) / 3) * 200 AS y
  FROM t_p83915249_biotech_anime_store.empire_systems WHERE sector = 'arboreals'
) v WHERE s.id = v.id;

-- TITANFORGE — центро-запад, центр (1400, 1400) (между core и углами)
UPDATE t_p83915249_biotech_anime_store.empire_systems s
SET pos_x = v.x, pos_y = v.y
FROM (
  SELECT id,
    1200 + ((ROW_NUMBER() OVER (ORDER BY id) - 1) % 3) * 200 AS x,
    1200 + ((ROW_NUMBER() OVER (ORDER BY id) - 1) / 3) * 200 AS y
  FROM t_p83915249_biotech_anime_store.empire_systems WHERE sector = 'titanforge'
) v WHERE s.id = v.id;

-- alpha/beta/gamma/delta/omega — вокруг core
UPDATE t_p83915249_biotech_anime_store.empire_systems s
SET pos_x = v.x, pos_y = v.y
FROM (
  SELECT id,
    1850 + ((ROW_NUMBER() OVER (ORDER BY id) - 1) % 4) * 180 AS x,
    1850 + ((ROW_NUMBER() OVER (ORDER BY id) - 1) / 4) * 180 AS y
  FROM t_p83915249_biotech_anime_store.empire_systems
  WHERE sector IN ('alpha','beta','gamma','delta','omega')
) v WHERE s.id = v.id;

-- Пересчёт координат планет
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
