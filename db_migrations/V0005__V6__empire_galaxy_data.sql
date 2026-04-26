
-- Добавляем звёздные системы для игры Империя Космоса
INSERT INTO t_p83915249_biotech_anime_store.empire_systems (name, pos_x, pos_y, star_type, star_size, sector, planet_count) VALUES
('Солнечная',       200, 200, 'yellow',    6,  'alpha', 4),
('Альфа Центавра',  380, 150, 'yellow',    5,  'alpha', 3),
('Сириус',          550, 250, 'blue',      8,  'alpha', 2),
('Проксима',        120, 380, 'red_dwarf', 3,  'beta',  5),
('Вега',            650, 380, 'blue',      7,  'beta',  3),
('Арктур',          300, 520, 'red_giant', 9,  'beta',  4),
('Ригель',          500, 550, 'blue',      10, 'gamma', 2),
('Денеб',           700, 500, 'blue',      9,  'gamma', 3),
('Процион',         150, 650, 'yellow',    5,  'gamma', 4),
('Спика',           450, 700, 'blue',      8,  'delta', 3),
('Фомальгаут',      750, 700, 'yellow',    6,  'delta', 4),
('Бетельгейзе',     600, 800, 'red_giant', 12, 'omega', 2),
('Поллукс',         350, 900, 'red_giant', 7,  'omega', 4),
('Мирах',           800, 850, 'red_giant', 8,  'omega', 3)
ON CONFLICT DO NOTHING;

-- Добавляем планеты для Империи Космоса
INSERT INTO t_p83915249_biotech_anime_store.empire_planets (name, star_system_id, pos_x, pos_y, orbit_slot, planet_type, biome, size, metal_richness, energy_richness, crystal_richness, special_resource, ai_fleet_tier, ai_ships, description)
SELECT v.n, s.id, v.px, v.py, v.sl, v.pt, v.bm, v.sz, v.mr, v.er, v.cr, v.sp, v.tier, v.ai::jsonb, v.ds
FROM t_p83915249_biotech_anime_store.empire_systems s
JOIN (VALUES
  ('Солнечная','Терра-Прима',      210,190,1,'terrestrial','temperate',150,1.2,1.0,0.5,NULL,0,             '{"scout":2,"fighter":2}',              'Богатая кислородная планета'),
  ('Солнечная','Терра-Секунда',    220,210,2,'terrestrial','arid',     100,1.5,0.8,0.4,NULL,1,             '{"scout":3,"fighter":4}',              'Засушливый мир с металлами'),
  ('Солнечная','Ледяная Терра',    195,215,3,'ice','frozen',            80,0.8,0.5,1.5,NULL,1,             '{"fighter":3,"cruiser":1}',            'Покрытый льдом мир с кристаллами'),
  ('Солнечная','Топливник',        230,195,4,'dead','barren',          120,2.0,0.3,0.3,'fuel_deposits',2,  '{"fighter":5,"cruiser":2}',            'Огромные залежи топлива'),
  ('Проксима','Джунглевая',        130,370,1,'terrestrial','jungle',   180,1.0,1.2,0.8,NULL,1,             '{"scout":4,"fighter":3}',              'Буйные тропические джунгли'),
  ('Проксима','Океания',           140,390,2,'ocean','ocean',          130,0.6,1.5,1.0,NULL,1,             '{"fighter":4,"cruiser":1}',            'Планета-океан'),
  ('Проксима','Тёмная',            150,360,3,'ice','frozen',            90,0.9,0.4,2.0,'dark_matter',2,    '{"fighter":5,"cruiser":2}',            'Источник тёмной материи'),
  ('Проксима','Вулкан',            125,400,4,'lava','volcanic',        110,2.5,0.2,0.2,NULL,2,             '{"cruiser":3,"battleship":1}',         'Вулканический металлический мир'),
  ('Проксима','Пустыня',           160,410,5,'desert','arid',          160,1.3,0.7,0.6,NULL,2,             '{"fighter":6,"cruiser":2}',            'Бескрайние пустынные равнины'),
  ('Сириус','Сириус-Гигант',       560,240,1,'gas_giant','gas',        250,0.3,2.5,0.5,NULL,2,             '{"cruiser":3,"battleship":1}',         'Газовый энергетический гигант'),
  ('Сириус','Сириус-Ядро',         540,260,2,'lava','volcanic',        100,3.0,0.1,0.1,NULL,3,             '{"cruiser":4,"battleship":2}',         'Расплавленное железное ядро'),
  ('Вега','Кристальная Вега',      660,370,1,'crystal','crystal',      140,0.5,0.8,3.0,'ancient_artifacts',3,'{"cruiser":4,"battleship":2}',       'Кристаллический мир с артефактами'),
  ('Вега','Вега-Эдем',             640,390,2,'terrestrial','temperate',160,1.1,1.1,1.1,NULL,2,             '{"fighter":5,"cruiser":3}',            'Идеальный мир для колонии'),
  ('Вега','Вега-Лёд',              670,400,3,'ice','frozen',            70,0.7,0.3,2.5,NULL,3,             '{"cruiser":3,"battleship":2}',         'Замороженные кристаллы'),
  ('Арктур','Арктур-Огонь',        310,510,1,'lava','volcanic',        200,1.8,0.5,0.8,NULL,2,             '{"fighter":5,"cruiser":3}',            'Огненная планета'),
  ('Арктур','Арктур-Рай',          290,530,2,'terrestrial','temperate',170,1.0,1.3,0.7,NULL,2,             '{"fighter":4,"cruiser":2}',            'Мягкий приятный климат'),
  ('Арктур','Арктур-Море',         320,540,3,'ocean','ocean',          140,0.5,1.8,1.2,NULL,3,             '{"cruiser":4,"battleship":2}',         'Глубокий океан'),
  ('Арктур','Арктур-Топливо',      300,550,4,'dead','barren',           90,2.2,0.2,0.4,'fuel_deposits',3,  '{"cruiser":3,"battleship":2,"dreadnought":1}','Огромные топливные запасы'),
  ('Ригель','Ригель-Пламя',        510,540,1,'lava','volcanic',        180,1.5,2.0,0.3,NULL,3,             '{"battleship":3,"dreadnought":1}',     'Раскалённая планета'),
  ('Ригель','Ригель-Кристалл',     490,560,2,'crystal','crystal',      120,0.3,0.5,4.0,'ancient_artifacts',4,'{"battleship":4,"dreadnought":2}',   'Кристаллы Предтечей'),
  ('Денеб','Денеб-Энергия',        710,490,1,'gas_giant','gas',        280,0.2,3.0,0.4,NULL,3,             '{"cruiser":5,"battleship":3}',         'Мощнейший газовый гигант'),
  ('Денеб','Денеб-Джунгли',        690,510,2,'terrestrial','jungle',   190,1.2,1.4,1.0,NULL,3,             '{"battleship":3,"dreadnought":1}',     'Густые джунгли'),
  ('Денеб','Денеб-Металл',         720,520,3,'lava','volcanic',        130,3.5,0.1,0.2,NULL,4,             '{"battleship":4,"dreadnought":2}',     'Богатейшие металлы'),
  ('Процион','Процион-Прима',      160,640,1,'terrestrial','temperate',160,1.1,1.1,1.0,NULL,1,             '{"scout":3,"fighter":5}',              'Гостеприимная планета'),
  ('Процион','Процион-Море',       145,660,2,'ocean','ocean',          145,0.7,1.6,1.3,NULL,2,             '{"fighter":4,"cruiser":2}',            'Водный мир'),
  ('Процион','Процион-Пески',      170,670,3,'desert','arid',          115,1.6,0.6,0.5,NULL,2,             '{"fighter":5,"cruiser":2}',            'Пески и металл'),
  ('Процион','Процион-Мрак',       155,650,4,'ice','frozen',            85,0.8,0.4,2.2,'dark_matter',3,    '{"cruiser":3,"battleship":2}',         'Источник тёмной материи'),
  ('Спика','Спика-Рай',            460,690,1,'terrestrial','temperate',175,1.0,1.2,0.9,NULL,2,             '{"fighter":5,"cruiser":3}',            'Великолепный климат'),
  ('Спика','Спика-Кристалл',       440,710,2,'crystal','crystal',      110,0.4,0.6,3.5,NULL,3,             '{"cruiser":4,"battleship":2}',         'Кристаллические горы'),
  ('Спика','Спика-Магма',          470,720,3,'lava','volcanic',        100,2.8,0.2,0.1,NULL,3,             '{"cruiser":3,"battleship":3}',         'Магматические пустоши'),
  ('Фомальгаут','Фомальгаут-Руды', 760,690,1,'terrestrial','arid',     165,1.4,0.9,0.6,NULL,3,             '{"battleship":3,"dreadnought":1}',     'Богатые руды'),
  ('Фомальгаут','Фомальгаут-Газ',  740,710,2,'gas_giant','gas',        240,0.2,2.8,0.3,NULL,3,             '{"battleship":3,"dreadnought":2}',     'Газовый великан'),
  ('Фомальгаут','Фомальгаут-Лёд',  770,720,3,'ice','frozen',            95,0.9,0.3,2.8,'ancient_artifacts',4,'{"battleship":5,"dreadnought":2}',   'Артефакты во льду'),
  ('Фомальгаут','Фомальгаут-Кристалл',755,700,4,'crystal','crystal',  130,0.5,0.7,4.5,NULL,4,             '{"battleship":4,"dreadnought":3}',     'Богатейший кристаллический мир'),
  ('Бетельгейзе','Бетельгейзе-Ад', 610,790,1,'lava','volcanic',       220,2.5,0.3,0.5,NULL,4,             '{"battleship":5,"dreadnought":3}',     'Адский огонь'),
  ('Бетельгейзе','Бетельгейзе-Руины',590,810,2,'dead','barren',       100,3.0,0.1,0.2,'fuel_deposits',4,  '{"battleship":4,"dreadnought":4}',     'Руины и топливо'),
  ('Поллукс','Поллукс-Джунгли',    360,890,1,'terrestrial','jungle',   180,1.2,1.3,0.9,NULL,3,             '{"battleship":3,"dreadnought":2}',     'Джунглевые просторы'),
  ('Поллукс','Поллукс-Океан',      340,910,2,'ocean','ocean',          150,0.6,1.7,1.4,NULL,3,             '{"cruiser":5,"battleship":3}',         'Безграничный океан'),
  ('Поллукс','Поллукс-Артефакты',  370,920,3,'crystal','crystal',      120,0.4,0.5,4.0,'ancient_artifacts',4,'{"battleship":5,"dreadnought":3}',   'Кристаллы Предтечей'),
  ('Поллукс','Поллукс-Металл',     355,895,4,'lava','volcanic',        110,3.2,0.2,0.3,NULL,4,             '{"battleship":5,"dreadnought":4}',     'Металлическое нутро'),
  ('Мирах','Мирах-Прима',          810,840,1,'terrestrial','temperate',185,1.1,1.1,1.2,NULL,4,             '{"dreadnought":4}',                    'Последний рубеж'),
  ('Мирах','Мирах-Кристалл',       790,860,2,'crystal','crystal',      140,0.3,0.6,5.0,'ancient_artifacts',4,'{"dreadnought":5}',                  'Сердце галактики'),
  ('Мирах','Мирах-Железо',         820,870,3,'dead','barren',           80,4.0,0.1,0.1,'fuel_deposits',4,  '{"dreadnought":5}',                    'Чистое железо')
) AS v(sname,n,px,py,sl,pt,bm,sz,mr,er,cr,sp,tier,ai,ds)
ON s.name = v.sname
ON CONFLICT DO NOTHING;
