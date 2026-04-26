
-- Пересчёт координат планет: каждая планета на своей орбите от центра системы.
-- Орбита 1-я = 40px, шаг +28px. Угол = -90° + (360°/N)*index.
-- Используем CTE с row_number() для определения индекса планеты в системе.

UPDATE t_p83915249_biotech_anime_store.empire_planets p
SET
  pos_x = ROUND(s.pos_x + (40.0 + (r.rn - 1) * 28.0) * COS(-1.5708 + 6.2832 * (r.rn - 1) / NULLIF(r.total, 0)))::int,
  pos_y = ROUND(s.pos_y + (40.0 + (r.rn - 1) * 28.0) * SIN(-1.5708 + 6.2832 * (r.rn - 1) / NULLIF(r.total, 0)))::int
FROM (
  SELECT
    id,
    star_system_id,
    ROW_NUMBER() OVER (PARTITION BY star_system_id ORDER BY orbit_slot, id) AS rn,
    COUNT(*) OVER (PARTITION BY star_system_id) AS total
  FROM t_p83915249_biotech_anime_store.empire_planets
) r
JOIN t_p83915249_biotech_anime_store.empire_systems s ON s.id = r.star_system_id
WHERE p.id = r.id;
