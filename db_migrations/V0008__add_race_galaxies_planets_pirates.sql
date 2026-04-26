
-- ── Добавляем поле payment_id и payment_status в shop_purchases ──────────────
ALTER TABLE t_p83915249_biotech_anime_store.shop_purchases
  ADD COLUMN IF NOT EXISTS payment_id     TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'test';

-- ── Добавляем colonizer в empire_fleets (поле ships уже JSONB/TEXT) ──────────
-- empire_fleets уже есть, nothing to alter

-- ══════════════════════════════════════════════════════════════════════════════
-- НОВЫЕ ЗВЁЗДНЫЕ СИСТЕМЫ: по 10 на каждую расу + 3 пиратских
-- ══════════════════════════════════════════════════════════════════════════════
INSERT INTO t_p83915249_biotech_anime_store.empire_systems
  (name, pos_x, pos_y, star_type, star_size, sector, planet_count)
VALUES
-- SOLARIANS (☀️) — зона 80-160 по X, 60-140 по Y
  ('Солнечный Трон',   90,  65, 'yellow',   8, 'solarians', 10),
  ('Корона Звезды',   115,  90, 'yellow',   7, 'solarians', 10),
  ('Ярило-Прайм',     140,  65, 'yellow',   6, 'solarians', 10),
  ('Световой Страж',   90, 115, 'yellow',   7, 'solarians', 10),
  ('Сол-7',           130, 110, 'yellow',   6, 'solarians', 10),
  ('Протуберанец',    155,  90, 'yellow',   5, 'solarians', 10),
  ('Золотой Нексус',  105,  75, 'yellow',   7, 'solarians', 10),
  ('Хромосфера',       75, 100, 'yellow',   6, 'solarians', 10),
  ('Фотон-3',         145, 130, 'yellow',   5, 'solarians', 10),
  ('Гелиос Минор',    165, 115, 'blue',     6, 'solarians', 10),
-- VOIDSTALKERS (🌑) — зона 640-720 по X, 60-140 по Y
  ('Бездна Тьмы',    645,  65, 'neutron',   8, 'voidstalkers', 10),
  ('Пожиратель Света',670,  90, 'neutron',   7, 'voidstalkers', 10),
  ('Мрак Абсолют',   695,  65, 'neutron',   6, 'voidstalkers', 10),
  ('Нуль-Пространство',645,115, 'neutron',  7, 'voidstalkers', 10),
  ('Тёмный Пульсар', 685, 110, 'neutron',   6, 'voidstalkers', 10),
  ('Ворот Пустоты',  715,  90, 'neutron',   5, 'voidstalkers', 10),
  ('Обсидиановый Страж',660,75, 'neutron',  7, 'voidstalkers', 10),
  ('Чёрный Горизонт',630, 100, 'neutron',   6, 'voidstalkers', 10),
  ('Анти-Свет',      705, 130, 'neutron',   5, 'voidstalkers', 10),
  ('Войд Минор',     725, 115, 'white',     4, 'voidstalkers', 10),
-- IRONBORN (⚙️) — зона 80-160 по X, 640-720 по Y
  ('Кузница Мира',    90, 645, 'red_giant', 8, 'ironborn', 10),
  ('Стальной Трон',  115, 670, 'red_giant', 7, 'ironborn', 10),
  ('Железный Пик',   140, 645, 'red_giant', 6, 'ironborn', 10),
  ('Наковальня',      90, 715, 'red_giant', 7, 'ironborn', 10),
  ('Шлак-Прайм',     130, 710, 'red_giant', 6, 'ironborn', 10),
  ('Горн Вечный',    155, 690, 'red_giant', 5, 'ironborn', 10),
  ('Рудный Нексус',  105, 675, 'red_giant', 7, 'ironborn', 10),
  ('Металлург',       75, 700, 'red_giant', 6, 'ironborn', 10),
  ('Сплав-7',        145, 730, 'red_giant', 5, 'ironborn', 10),
  ('Феррум Минор',   165, 715, 'red_dwarf', 4, 'ironborn', 10),
-- ARBOREALS (🌿) — зона 640-720 по X, 640-720 по Y
  ('Лесной Трон',    645, 645, 'yellow',   8, 'arboreals', 10),
  ('Древо Жизни',    670, 670, 'yellow',   7, 'arboreals', 10),
  ('Зелёный Рай',    695, 645, 'yellow',   6, 'arboreals', 10),
  ('Корень Мира',    645, 715, 'yellow',   7, 'arboreals', 10),
  ('Флора-7',        685, 710, 'yellow',   6, 'arboreals', 10),
  ('Фотосинтез',     715, 690, 'yellow',   5, 'arboreals', 10),
  ('Биосфера-1',     660, 675, 'yellow',   7, 'arboreals', 10),
  ('Джунгли Космоса', 630,700, 'yellow',   6, 'arboreals', 10),
  ('Хлорофилл-3',    705, 730, 'yellow',   5, 'arboreals', 10),
  ('Арбор Минор',    725, 715, 'yellow',   4, 'arboreals', 10),
-- DEEPONES (🐙) — зона 60-140 по X, 340-420 по Y
  ('Глубина Бездны',  65, 345, 'blue',     8, 'deepones', 10),
  ('Морская Бездна',  90, 370, 'blue',     7, 'deepones', 10),
  ('Осьминог-Прайм', 115, 345, 'blue',     6, 'deepones', 10),
  ('Псионик Океан',   65, 415, 'blue',     7, 'deepones', 10),
  ('Глубоководный',  105, 410, 'blue',     6, 'deepones', 10),
  ('Абиссаль',       130, 390, 'blue',     5, 'deepones', 10),
  ('Нейрон-7',        80, 375, 'blue',     7, 'deepones', 10),
  ('Телепат',         50, 400, 'blue',     6, 'deepones', 10),
  ('Сифон-3',        120, 430, 'blue',     5, 'deepones', 10),
  ('Дип Минор',      140, 415, 'blue',     4, 'deepones', 10),
-- WRAITHKIN (👻) — зона 660-740 по X, 340-420 по Y
  ('Призрачный Трон', 665,345, 'white',    8, 'wraithkin', 10),
  ('Туман Смерти',   690, 370, 'white',    7, 'wraithkin', 10),
  ('Эфир-Прайм',     715, 345, 'white',    6, 'wraithkin', 10),
  ('Полупрозрачность',665,415, 'white',    7, 'wraithkin', 10),
  ('Нематериальный', 705, 410, 'white',    6, 'wraithkin', 10),
  ('Призрак Вечный', 730, 390, 'white',    5, 'wraithkin', 10),
  ('Астральный',     680, 375, 'white',    7, 'wraithkin', 10),
  ('Фантом-7',       650, 400, 'white',    6, 'wraithkin', 10),
  ('Мираж-3',        720, 430, 'white',    5, 'wraithkin', 10),
  ('Врэйт Минор',    740, 415, 'white',    4, 'wraithkin', 10),
-- PSIONIC (🔮) — зона 340-420 по X, 60-140 по Y
  ('Разум Вселенной',345,  65, 'blue',     8, 'psionic', 10),
  ('Телепатический', 370,  90, 'blue',     7, 'psionic', 10),
  ('Псионик-Прайм',  395,  65, 'blue',     6, 'psionic', 10),
  ('Ментал-7',       345, 115, 'blue',     7, 'psionic', 10),
  ('Предсказатель',  385, 110, 'blue',     6, 'psionic', 10),
  ('Телекинез',      415,  90, 'blue',     5, 'psionic', 10),
  ('Нейро-Нексус',   360,  75, 'blue',     7, 'psionic', 10),
  ('Эмпат',          330, 100, 'blue',     6, 'psionic', 10),
  ('Псих-3',         405, 130, 'blue',     5, 'psionic', 10),
  ('Псион Минор',    425, 115, 'blue',     4, 'psionic', 10),
-- HIVEBORN (🐝) — зона 340-420 по X, 640-720 по Y
  ('Улей Матка',     345, 645, 'red_dwarf',8, 'hiveborn', 10),
  ('Рой Бесконечный',370, 670, 'red_dwarf',7, 'hiveborn', 10),
  ('Колония-Прайм',  395, 645, 'red_dwarf',6, 'hiveborn', 10),
  ('Единый Разум',   345, 715, 'red_dwarf',7, 'hiveborn', 10),
  ('Рабочий-7',      385, 710, 'red_dwarf',6, 'hiveborn', 10),
  ('Феромон',        415, 690, 'red_dwarf',5, 'hiveborn', 10),
  ('Роевой Нексус',  360, 675, 'red_dwarf',7, 'hiveborn', 10),
  ('Матка-3',        330, 700, 'red_dwarf',6, 'hiveborn', 10),
  ('Личинка',        405, 730, 'red_dwarf',5, 'hiveborn', 10),
  ('Хайв Минор',     425, 715, 'red_dwarf',4, 'hiveborn', 10),
-- TITANFORGE (🔥) — зона 200-280 по X, 200-280 по Y
  ('Ядро Магмы',     205, 205, 'red_giant',9, 'titanforge', 10),
  ('Кратер Титана',  230, 230, 'red_giant',8, 'titanforge', 10),
  ('Расплав-Прайм',  255, 205, 'red_giant',7, 'titanforge', 10),
  ('Вулкан Вечный',  205, 275, 'red_giant',8, 'titanforge', 10),
  ('Лава-7',         245, 270, 'red_giant',7, 'titanforge', 10),
  ('Геотермаль',     275, 250, 'red_giant',6, 'titanforge', 10),
  ('Плазменный Трон',220, 215, 'red_giant',8, 'titanforge', 10),
  ('Тектоник',       190, 240, 'red_giant',7, 'titanforge', 10),
  ('Пирокласт-3',    265, 285, 'red_giant',6, 'titanforge', 10),
  ('Титан Минор',    285, 270, 'red_giant',5, 'titanforge', 10),
-- PIRATES (💀) — зона 520-600 по X, 340-420 по Y (центр карты)
  ('Логово Пиратов', 525, 350, 'red_dwarf',5, 'pirates',  6),
  ('Убежище Корсаров',555,375, 'red_dwarf',4, 'pirates',  6),
  ('Пиратская Бухта',525, 410, 'red_dwarf',6, 'pirates',  6)
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════════════════════════
-- Функция для генерации планет по системам расы
-- ══════════════════════════════════════════════════════════════════════════════

-- Генерируем планеты для всех новых систем где их нет
-- По 10 планет на каждую систему каждой расы, по 6 на пиратские
INSERT INTO t_p83915249_biotech_anime_store.empire_planets
  (name, star_system_id, pos_x, pos_y, orbit_slot, planet_type, biome, size,
   metal_richness, energy_richness, crystal_richness, special_resource,
   is_ai_controlled, ai_fleet_tier, is_colonizable, owner_race)
SELECT
  sys.name || '-' || slot AS name,
  sys.id AS star_system_id,
  sys.pos_x + (slot * 15 - 80) AS pos_x,
  sys.pos_y + (slot * 12 - 60) AS pos_y,
  slot AS orbit_slot,
  CASE slot % 8
    WHEN 0 THEN 'terrestrial' WHEN 1 THEN 'gas_giant'
    WHEN 2 THEN 'ice'         WHEN 3 THEN 'desert'
    WHEN 4 THEN 'ocean'       WHEN 5 THEN 'lava'
    WHEN 6 THEN 'crystal'     ELSE 'toxic'
  END AS planet_type,
  CASE sys.sector
    WHEN 'solarians'    THEN 'volcanic'
    WHEN 'voidstalkers' THEN 'dark'
    WHEN 'ironborn'     THEN 'industrial'
    WHEN 'arboreals'    THEN 'jungle'
    WHEN 'deepones'     THEN 'ocean'
    WHEN 'wraithkin'    THEN 'haunted'
    WHEN 'psionic'      THEN 'crystal'
    WHEN 'hiveborn'     THEN 'hive'
    WHEN 'titanforge'   THEN 'volcanic'
    WHEN 'pirates'      THEN 'barren'
    ELSE 'temperate'
  END AS biome,
  3 + (slot % 8) AS size,
  -- richness зависит от расы
  CASE sys.sector
    WHEN 'ironborn'   THEN 3.0 + (slot % 3) * 0.5
    WHEN 'titanforge' THEN 2.5 + (slot % 4) * 0.4
    ELSE 1.0 + (slot % 5) * 0.3
  END AS metal_richness,
  CASE sys.sector
    WHEN 'solarians'  THEN 3.0 + (slot % 3) * 0.5
    WHEN 'psionic'    THEN 2.5 + (slot % 4) * 0.4
    ELSE 1.0 + (slot % 5) * 0.3
  END AS energy_richness,
  CASE sys.sector
    WHEN 'psionic'    THEN 3.5 + (slot % 3) * 0.5
    WHEN 'deepones'   THEN 2.5 + (slot % 4) * 0.4
    ELSE 1.0 + (slot % 5) * 0.3
  END AS crystal_richness,
  CASE WHEN slot % 7 = 0 THEN 'rare_ore'
       WHEN slot % 7 = 1 THEN NULL
       WHEN slot % 7 = 2 THEN NULL
       WHEN slot % 7 = 3 THEN 'crystals'
       ELSE NULL
  END AS special_resource,
  CASE WHEN sys.sector = 'pirates' THEN TRUE ELSE FALSE END AS is_ai_controlled,
  CASE WHEN sys.sector = 'pirates' THEN 3 + (slot % 4) ELSE 0 END AS ai_fleet_tier,
  TRUE AS is_colonizable,
  CASE sys.sector
    WHEN 'pirates' THEN 'pirates'
    ELSE sys.sector
  END AS owner_race
FROM t_p83915249_biotech_anime_store.empire_systems sys
CROSS JOIN generate_series(1, 10) AS slot
WHERE sys.sector IN ('solarians','voidstalkers','ironborn','arboreals','deepones','wraithkin','psionic','hiveborn','titanforge','pirates')
  AND NOT EXISTS (
    SELECT 1 FROM t_p83915249_biotech_anime_store.empire_planets ep
    WHERE ep.star_system_id = sys.id
  );
