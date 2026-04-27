"""
Галактическая Империя — Орбитальные станции, склады, переработка руды.
GET  action=get       &planet_id=N  — состояние станции, склада, завода
POST action=build                   — построить орбитальную станцию {planet_id}
POST action=upgrade  {planet_id, module}  — прокачать модуль (shipyard/defense/hangar/lab)
POST action=warehouse_deposit {planet_id, resource, amount} — загрузить с корабля
POST action=warehouse_withdraw {planet_id, resource, amount} — выгрузить на планету
POST action=process_ore {planet_id}  — запустить переработку руды → сплавы/компоненты
POST action=build_ship_station {planet_id, ship_type, count} — строить корабль на верфи
"""
import json, os, psycopg2

S = os.environ.get('MAIN_DB_SCHEMA', 't_p83915249_biotech_anime_store')

# 15 кораблей: 3 шахтёра, 5 грузовозов-сборщиков, 7 военных
SHIPS = {
    # ── Шахтёры (3 шт) ────────────────────────────────────────────────────
    'miner_small': {
        'name': 'Шахтёр-М', 'icon': '⛏️', 'cat': 'miner',
        'atk': 0, 'def': 10, 'mining': 50, 'cargo': 200,
        'tech_req': None,
        'cost': {'metal': 300, 'energy': 100, 'crystals': 50},
        'desc': 'Малый шахтёр. Добывает 50 руды за вылет, груз 200т'
    },
    'miner_medium': {
        'name': 'Шахтёр-С', 'icon': '⛏️', 'cat': 'miner',
        'atk': 0, 'def': 25, 'mining': 150, 'cargo': 600,
        'tech_req': 'mining_tech_2',
        'cost': {'metal': 900, 'energy': 300, 'crystals': 150},
        'desc': 'Средний шахтёр. 150 руды, груз 600т'
    },
    'miner_large': {
        'name': 'Шахтёр-Б', 'icon': '⛏️', 'cat': 'miner',
        'atk': 0, 'def': 60, 'mining': 400, 'cargo': 2000,
        'tech_req': 'mining_tech_3',
        'cost': {'metal': 2500, 'energy': 800, 'crystals': 400},
        'desc': 'Большой шахтёр. 400 руды, груз 2000т'
    },
    # ── Грузовозы-сборщики обломков (5 шт) ────────────────────────────────
    'salvager_drone': {
        'name': 'Сборщик-дрон', 'icon': '🤖', 'cat': 'salvager',
        'atk': 0, 'def': 5, 'mining': 0, 'cargo': 100,
        'salvage': 80,
        'tech_req': None,
        'cost': {'metal': 200, 'energy': 150, 'crystals': 80},
        'desc': 'Автономный дрон. Собирает 80% ресурсов из обломков'
    },
    'salvager_light': {
        'name': 'Лёгкий сборщик', 'icon': '🚜', 'cat': 'salvager',
        'atk': 5, 'def': 15, 'mining': 0, 'cargo': 300,
        'salvage': 120,
        'tech_req': 'salvage_tech_1',
        'cost': {'metal': 500, 'energy': 200, 'crystals': 100},
        'desc': 'Собирает обломки и уклоняется от угроз. Груз 300т'
    },
    'salvager_medium': {
        'name': 'Сборщик-М', 'icon': '🚜', 'cat': 'salvager',
        'atk': 10, 'def': 30, 'mining': 0, 'cargo': 800,
        'salvage': 250,
        'tech_req': 'salvage_tech_2',
        'cost': {'metal': 1200, 'energy': 400, 'crystals': 200},
        'desc': 'Средний сборщик. Может защититься. Груз 800т'
    },
    'salvager_heavy': {
        'name': 'Тяжёлый сборщик', 'icon': '🏗️', 'cat': 'salvager',
        'atk': 20, 'def': 80, 'mining': 0, 'cargo': 2500,
        'salvage': 600,
        'tech_req': 'salvage_tech_3',
        'cost': {'metal': 3000, 'energy': 1000, 'crystals': 500},
        'desc': 'Тяжёлый сборщик с защитой. Груз 2500т'
    },
    'salvager_titan': {
        'name': 'Титан-сборщик', 'icon': '🏗️', 'cat': 'salvager',
        'atk': 50, 'def': 200, 'mining': 100, 'cargo': 6000,
        'salvage': 1500,
        'tech_req': 'salvage_tech_4',
        'cost': {'metal': 7000, 'energy': 2500, 'crystals': 1200},
        'desc': 'Гигантский сборщик. Может и добывать руду. Груз 6000т'
    },
    # ── Военные (7 шт) ─────────────────────────────────────────────────────
    'interceptor': {
        'name': 'Перехватчик', 'icon': '✈️', 'cat': 'military',
        'atk': 35, 'def': 20, 'mining': 0, 'cargo': 0,
        'tech_req': None,
        'cost': {'metal': 400, 'energy': 200, 'crystals': 100},
        'desc': 'Быстрый истребитель. Высокая атака, слабая броня'
    },
    'destroyer': {
        'name': 'Эсминец', 'icon': '🚀', 'cat': 'military',
        'atk': 80, 'def': 60, 'mining': 0, 'cargo': 50,
        'tech_req': 'military_tech_2',
        'cost': {'metal': 900, 'energy': 350, 'crystals': 180},
        'desc': 'Универсальный боевой корабль'
    },
    'cruiser_heavy': {
        'name': 'Тяжёлый крейсер', 'icon': '🛡️', 'cat': 'military',
        'atk': 150, 'def': 180, 'mining': 0, 'cargo': 100,
        'tech_req': 'military_tech_3',
        'cost': {'metal': 2000, 'energy': 700, 'crystals': 350},
        'desc': 'Мощная броня, высокий урон'
    },
    'carrier': {
        'name': 'Авианосец', 'icon': '🛸', 'cat': 'military',
        'atk': 100, 'def': 250, 'mining': 0, 'cargo': 200,
        'tech_req': 'military_tech_4',
        'cost': {'metal': 4000, 'energy': 1500, 'crystals': 800},
        'desc': 'Несёт дроны атаки. Высокая защита'
    },
    'battlecruiser': {
        'name': 'Линейный крейсер', 'icon': '⚔️', 'cat': 'military',
        'atk': 280, 'def': 220, 'mining': 0, 'cargo': 150,
        'tech_req': 'military_tech_5',
        'cost': {'metal': 7000, 'energy': 2500, 'crystals': 1500},
        'desc': 'Смертоносный рейдер, баланс атаки и защиты'
    },
    'dreadnought_mk2': {
        'name': 'Дредноут Mk.II', 'icon': '💀', 'cat': 'military',
        'atk': 500, 'def': 400, 'mining': 0, 'cargo': 300,
        'tech_req': 'military_tech_6',
        'cost': {'metal': 15000, 'energy': 5000, 'crystals': 3000},
        'desc': 'Флагман флота. Уничтожает целые армады'
    },
    'stealth_corvette': {
        'name': 'Корвет-невидимка', 'icon': '👁️', 'cat': 'military',
        'atk': 120, 'def': 40, 'mining': 0, 'cargo': 0,
        'tech_req': 'stealth_tech',
        'cost': {'metal': 1800, 'energy': 1200, 'crystals': 900},
        'desc': 'Невидимый для обнаружения. Идеален для шпионажа и рейдов'
    },
}

# Технологии кораблей
SHIP_TECHS = {
    'mining_tech_2':   {'name': 'Горнодобыча II',    'icon': '⛏️', 'cost': {'metal':500,'energy':200,'crystals':100}, 'unlocks': 'miner_medium'},
    'mining_tech_3':   {'name': 'Горнодобыча III',   'icon': '⛏️', 'cost': {'metal':1500,'energy':600,'crystals':300}, 'unlocks': 'miner_large'},
    'salvage_tech_1':  {'name': 'Сборка I',           'icon': '🚜', 'cost': {'metal':400,'energy':200,'crystals':100}, 'unlocks': 'salvager_light'},
    'salvage_tech_2':  {'name': 'Сборка II',          'icon': '🚜', 'cost': {'metal':1000,'energy':400,'crystals':200}, 'unlocks': 'salvager_medium'},
    'salvage_tech_3':  {'name': 'Сборка III',         'icon': '🏗️', 'cost': {'metal':2500,'energy':1000,'crystals':500}, 'unlocks': 'salvager_heavy'},
    'salvage_tech_4':  {'name': 'Сборка IV',          'icon': '🏗️', 'cost': {'metal':6000,'energy':2000,'crystals':1000}, 'unlocks': 'salvager_titan'},
    'military_tech_2': {'name': 'Военфлот II',        'icon': '🚀', 'cost': {'metal':600,'energy':300,'crystals':150}, 'unlocks': 'destroyer'},
    'military_tech_3': {'name': 'Военфлот III',       'icon': '🛡️', 'cost': {'metal':1800,'energy':700,'crystals':350}, 'unlocks': 'cruiser_heavy'},
    'military_tech_4': {'name': 'Военфлот IV',        'icon': '🛸', 'cost': {'metal':3500,'energy':1500,'crystals':700}, 'unlocks': 'carrier'},
    'military_tech_5': {'name': 'Военфлот V',         'icon': '⚔️', 'cost': {'metal':6000,'energy':2500,'crystals':1200}, 'unlocks': 'battlecruiser'},
    'military_tech_6': {'name': 'Военфлот VI',        'icon': '💀', 'cost': {'metal':12000,'energy':5000,'crystals':2500}, 'unlocks': 'dreadnought_mk2'},
    'stealth_tech':    {'name': 'Технология стелс',   'icon': '👁️', 'cost': {'metal':2000,'energy':1500,'crystals':1000}, 'unlocks': 'stealth_corvette'},
}

# Модули орбитальной станции
STATION_MODULES = {
    'shipyard': {'name': 'Верфь',           'icon': '🏭', 'max_level': 5,
                 'cost_base': {'metal': 800, 'energy': 400, 'crystals': 200},
                 'desc': 'Строительство кораблей. Скорость ×уровень'},
    'defense':  {'name': 'Щит обороны',     'icon': '🛡️', 'max_level': 5,
                 'cost_base': {'metal': 600, 'energy': 500, 'crystals': 300},
                 'desc': 'Защита станции от атак пиратов'},
    'hangar':   {'name': 'Ангар',           'icon': '🚀', 'max_level': 5,
                 'cost_base': {'metal': 500, 'energy': 300, 'crystals': 150},
                 'desc': 'Стоянка флотов, ремонт кораблей'},
    'lab':      {'name': 'Научная лаборатория','icon': '🔬', 'max_level': 3,
                 'cost_base': {'metal': 1000, 'energy': 800, 'crystals': 500},
                 'desc': 'Исследование технологий кораблей'},
}

def db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def cors():
    return {'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token'}

def ok(d):
    return {'statusCode': 200, 'headers': cors(), 'body': json.dumps(d, default=str)}

def err(msg, code=400):
    return {'statusCode': code, 'headers': cors(), 'body': json.dumps({'error': msg})}

def get_token(event):
    h = event.get('headers') or {}
    return h.get('X-Auth-Token') or h.get('x-auth-token', '')

def get_player(cur, token):
    if not token: return None
    cur.execute(f"""
        SELECT id, nickname, race, metal, energy, crystals, fuel, dark_matter, home_planet_id
        FROM {S}.empire_players WHERE session_token=%s
    """, (token,))
    r = cur.fetchone()
    if not r: return None
    return {'id':r[0],'nickname':r[1],'race':r[2],'metal':r[3],'energy':r[4],
            'crystals':r[5],'fuel':r[6],'dark_matter':r[7],'home_planet_id':r[8]}

def handler(event: dict, context) -> dict:
    """Орбитальные станции, склады, переработка руды, новые корабли."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    body = {}
    if event.get('body'):
        body = json.loads(event['body'])
    action = body.get('action') or params.get('action', 'get')
    token = get_token(event)

    conn = db()
    cur = conn.cursor()
    try:
        player = get_player(cur, token)
        if not player:
            return err('Не авторизован', 401)
        pid = player['id']

        # ── СОСТОЯНИЕ СТАНЦИИ, СКЛАДА, ЗАВОДА ────────────────────────────────
        if action == 'get':
            planet_id = params.get('planet_id') or body.get('planet_id')
            if not planet_id:
                return err('planet_id required')

            cur.execute(f"""
                SELECT id, level, shipyard_level, defense_level, hangar_level, lab_level,
                       hull_hp, max_hull_hp, docked_ships
                FROM {S}.orbital_stations
                WHERE planet_id=%s AND player_id=%s
            """, (planet_id, pid))
            st = cur.fetchone()
            station = None
            if st:
                ships = st[8] if isinstance(st[8], dict) else json.loads(st[8] or '{}')
                station = {'id':st[0],'level':st[1],'shipyard':st[2],'defense':st[3],
                           'hangar':st[4],'lab':st[5],'hull_hp':st[6],'max_hull_hp':st[7],
                           'docked_ships':ships}

            cur.execute(f"""
                SELECT id, metal_stored, energy_stored, crystals_stored, fuel_stored,
                       ore_stored, alloy_stored, components_stored, max_capacity, warehouse_level
                FROM {S}.planet_warehouses WHERE planet_id=%s AND player_id=%s
            """, (planet_id, pid))
            wh = cur.fetchone()
            warehouse = None
            if wh:
                warehouse = {'id':wh[0],'metal':wh[1],'energy':wh[2],'crystals':wh[3],
                             'fuel':wh[4],'ore':wh[5],'alloy':wh[6],'components':wh[7],
                             'capacity':wh[8],'level':wh[9]}

            cur.execute(f"""
                SELECT id, factory_level, ore_input, alloy_output, components_output, processing_speed
                FROM {S}.ore_processing WHERE planet_id=%s AND player_id=%s
            """, (planet_id, pid))
            fp = cur.fetchone()
            factory = None
            if fp:
                factory = {'id':fp[0],'level':fp[1],'ore_input':fp[2],'alloy_output':fp[3],
                           'components_output':fp[4],'speed':fp[5]}

            # Исследованные технологии
            cur.execute(f"SELECT tech_id, level FROM {S}.empire_techs WHERE player_id=%s", (pid,))
            techs = {r[0]:r[1] for r in cur.fetchall()}
            unlocked_ships = [k for k,v in SHIPS.items() if not v['tech_req'] or v['tech_req'] in techs]

            return ok({
                'station': station, 'warehouse': warehouse, 'factory': factory,
                'ships': SHIPS, 'unlocked_ships': unlocked_ships,
                'modules': STATION_MODULES, 'ship_techs': SHIP_TECHS,
                'researched_techs': techs,
            })

        # ── ПОСТРОИТЬ ОРБИТАЛЬНУЮ СТАНЦИЮ ─────────────────────────────────────
        if action == 'build' and method == 'POST':
            planet_id = body.get('planet_id')
            if not planet_id: return err('planet_id required')

            # Проверяем что планета наша
            cur.execute(f"SELECT id FROM {S}.empire_colonies WHERE planet_id=%s AND player_id=%s", (planet_id, pid))
            if not cur.fetchone(): return err('Это не ваша колония')

            cur.execute(f"SELECT id FROM {S}.orbital_stations WHERE planet_id=%s", (planet_id,))
            if cur.fetchone(): return err('Станция уже построена')

            cost = {'metal': 2000, 'energy': 1000, 'crystals': 500}
            if player['metal'] < cost['metal'] or player['energy'] < cost['energy'] or player['crystals'] < cost['crystals']:
                return err(f'Недостаточно ресурсов: ⛏️{cost["metal"]} ⚡{cost["energy"]} 💎{cost["crystals"]}')

            cur.execute(f"""
                UPDATE {S}.empire_players
                SET metal=metal-%s, energy=energy-%s, crystals=crystals-%s WHERE id=%s
            """, (cost['metal'], cost['energy'], cost['crystals'], pid))
            cur.execute(f"""
                INSERT INTO {S}.orbital_stations (planet_id, player_id) VALUES (%s,%s)
            """, (planet_id, pid))

            # Создаём склад автоматически
            cur.execute(f"SELECT id FROM {S}.planet_warehouses WHERE planet_id=%s AND player_id=%s", (planet_id, pid))
            if not cur.fetchone():
                cur.execute(f"INSERT INTO {S}.planet_warehouses (planet_id, player_id) VALUES (%s,%s)", (planet_id, pid))

            conn.commit()
            return ok({'built': True, 'message': '🛸 Орбитальная станция построена!'})

        # ── ПРОКАЧАТЬ МОДУЛЬ СТАНЦИИ ──────────────────────────────────────────
        if action == 'upgrade' and method == 'POST':
            planet_id = body.get('planet_id')
            module = body.get('module')
            if not planet_id or not module: return err('planet_id и module обязательны')
            if module not in STATION_MODULES: return err('Неизвестный модуль')

            cur.execute(f"""
                SELECT id, shipyard_level, defense_level, hangar_level, lab_level
                FROM {S}.orbital_stations WHERE planet_id=%s AND player_id=%s
            """, (planet_id, pid))
            st = cur.fetchone()
            if not st: return err('Станция не построена')

            col_map = {'shipyard': st[1], 'defense': st[2], 'hangar': st[3], 'lab': st[4]}
            cur_lvl = col_map[module]
            max_lvl = STATION_MODULES[module]['max_level']
            if cur_lvl >= max_lvl: return err(f'Модуль уже максимального уровня ({max_lvl})')

            base = STATION_MODULES[module]['cost_base']
            mult = cur_lvl + 1
            cost = {k: v * mult for k, v in base.items()}
            if player['metal'] < cost['metal'] or player['energy'] < cost['energy'] or player['crystals'] < cost['crystals']:
                return err(f'Нужно: ⛏️{cost["metal"]} ⚡{cost["energy"]} 💎{cost["crystals"]}')

            cur.execute(f"""
                UPDATE {S}.empire_players SET metal=metal-%s, energy=energy-%s, crystals=crystals-%s WHERE id=%s
            """, (cost['metal'], cost['energy'], cost['crystals'], pid))
            cur.execute(f"""
                UPDATE {S}.orbital_stations SET {module}_level={module}_level+1, updated_at=NOW()
                WHERE planet_id=%s AND player_id=%s
            """, (planet_id, pid))
            conn.commit()
            return ok({'upgraded': True, 'module': module, 'new_level': cur_lvl + 1,
                       'message': f'✅ {STATION_MODULES[module]["name"]} улучшен до ур.{cur_lvl+1}'})

        # ── СТРОИТЬ КОРАБЛЬ НА ВЕРФИ СТАНЦИИ ─────────────────────────────────
        if action == 'build_ship_station' and method == 'POST':
            planet_id = body.get('planet_id')
            ship_type = body.get('ship_type')
            count = int(body.get('count', 1))
            if not planet_id or not ship_type: return err('planet_id и ship_type обязательны')
            if ship_type not in SHIPS: return err('Неизвестный тип корабля')
            if count < 1 or count > 50: return err('Количество 1-50')

            cur.execute(f"SELECT shipyard_level FROM {S}.orbital_stations WHERE planet_id=%s AND player_id=%s", (planet_id, pid))
            st = cur.fetchone()
            if not st: return err('Нет орбитальной станции')
            if st[0] < 1: return err('Нужна верфь на станции (upgrade module=shipyard)')

            sh = SHIPS[ship_type]
            if sh['tech_req']:
                cur.execute(f"SELECT level FROM {S}.empire_techs WHERE player_id=%s AND tech_id=%s", (pid, sh['tech_req']))
                if not cur.fetchone(): return err(f'Нужна технология: {sh["tech_req"]}')

            cost = {k: v * count for k, v in sh['cost'].items()}
            if player['metal'] < cost.get('metal',0) or player['energy'] < cost.get('energy',0) or player['crystals'] < cost.get('crystals',0):
                return err(f'Нужно: ⛏️{cost.get("metal",0)} ⚡{cost.get("energy",0)} 💎{cost.get("crystals",0)}')

            cur.execute(f"""
                UPDATE {S}.empire_players
                SET metal=metal-%s, energy=energy-%s, crystals=crystals-%s WHERE id=%s
            """, (cost.get('metal',0), cost.get('energy',0), cost.get('crystals',0), pid))

            # Добавляем в ангар станции или в флот на орбите
            cur.execute(f"SELECT id, docked_ships FROM {S}.orbital_stations WHERE planet_id=%s AND player_id=%s", (planet_id, pid))
            row = cur.fetchone()
            docked = row[1] if isinstance(row[1], dict) else json.loads(row[1] or '{}')
            docked[ship_type] = docked.get(ship_type, 0) + count
            cur.execute(f"UPDATE {S}.orbital_stations SET docked_ships=%s WHERE id=%s",
                        (json.dumps(docked), row[0]))

            # Обновляем флот игрока (или создаём)
            atk = sh['atk'] * count; df = sh['def'] * count
            cur.execute(f"SELECT id, ships, total_attack, total_defense FROM {S}.empire_fleets WHERE owner_id=%s AND current_planet_id=%s AND status='orbit'", (pid, planet_id))
            fleet = cur.fetchone()
            if fleet:
                fs = fleet[1] if isinstance(fleet[1], dict) else json.loads(fleet[1] or '{}')
                fs[ship_type] = fs.get(ship_type, 0) + count
                cur.execute(f"UPDATE {S}.empire_fleets SET ships=%s::jsonb, total_attack=%s, total_defense=%s WHERE id=%s",
                            (json.dumps(fs), fleet[2]+atk, fleet[3]+df, fleet[0]))
            else:
                cur.execute(f"""
                    INSERT INTO {S}.empire_fleets (owner_id, name, ships, total_attack, total_defense, current_planet_id, status, mission)
                    VALUES (%s,%s,%s::jsonb,%s,%s,%s,'orbit','defend')
                """, (pid, f'{sh["name"]} эскадра', json.dumps({ship_type: count}), atk, df, planet_id))

            conn.commit()
            return ok({'built': True, 'ship': sh['name'], 'count': count,
                       'message': f'✅ Построено {count}× {sh["name"]} на верфи!'})

        # ── ЗАГРУЗИТЬ РЕСУРСЫ НА СКЛАД ────────────────────────────────────────
        if action == 'warehouse_deposit' and method == 'POST':
            planet_id = body.get('planet_id')
            resource = body.get('resource')  # metal/energy/crystals/fuel/ore
            amount = int(body.get('amount', 0))
            if not planet_id or not resource or amount <= 0: return err('Укажите planet_id, resource, amount')

            cur.execute(f"SELECT id, {resource}_stored, max_capacity FROM {S}.planet_warehouses WHERE planet_id=%s AND player_id=%s", (planet_id, pid))
            wh = cur.fetchone()
            if not wh:
                cur.execute(f"INSERT INTO {S}.planet_warehouses (planet_id, player_id) VALUES (%s,%s) RETURNING id, 0, 5000", (planet_id, pid))
                wh = cur.fetchone()
            stored, cap = wh[1], wh[2]
            space = cap - stored
            deposit = min(amount, space)
            if deposit <= 0: return err('Склад заполнен')

            # Снимаем с игрока
            cur.execute(f"SELECT {resource} FROM {S}.empire_players WHERE id=%s", (pid,))
            avail = cur.fetchone()[0]
            deposit = min(deposit, avail)
            if deposit <= 0: return err('Недостаточно ресурсов')

            cur.execute(f"UPDATE {S}.empire_players SET {resource}={resource}-%s WHERE id=%s", (deposit, pid))
            cur.execute(f"UPDATE {S}.planet_warehouses SET {resource}_stored={resource}_stored+%s WHERE id=%s", (deposit, wh[0]))
            conn.commit()
            return ok({'deposited': deposit, 'resource': resource, 'message': f'✅ Загружено {deposit} {resource} на склад'})

        # ── ПЕРЕРАБОТКА РУДЫ ──────────────────────────────────────────────────
        if action == 'process_ore' and method == 'POST':
            planet_id = body.get('planet_id')
            if not planet_id: return err('planet_id required')

            cur.execute(f"""
                SELECT id, factory_level, processing_speed
                FROM {S}.ore_processing WHERE planet_id=%s AND player_id=%s
            """, (planet_id, pid))
            fp = cur.fetchone()
            if not fp:
                # Строим завод автоматически если есть станция
                cur.execute(f"SELECT id FROM {S}.orbital_stations WHERE planet_id=%s AND player_id=%s", (planet_id, pid))
                if not cur.fetchone(): return err('Нужна орбитальная станция')
                cur.execute(f"INSERT INTO {S}.ore_processing (planet_id, player_id) VALUES (%s,%s) RETURNING id, 1, 10", (planet_id, pid))
                fp = cur.fetchone()

            cur.execute(f"SELECT ore_stored, id FROM {S}.planet_warehouses WHERE planet_id=%s AND player_id=%s", (planet_id, pid))
            wh = cur.fetchone()
            if not wh or wh[0] == 0: return err('Нет руды на складе')

            ore_used = min(wh[0], fp[2] * 10)
            alloys = ore_used // 2
            components = ore_used // 5

            cur.execute(f"UPDATE {S}.planet_warehouses SET ore_stored=ore_stored-%s, alloy_stored=alloy_stored+%s, components_stored=components_stored+%s WHERE id=%s",
                        (ore_used, alloys, components, wh[1]))
            cur.execute(f"UPDATE {S}.ore_processing SET last_processed_at=NOW() WHERE id=%s", (fp[0],))
            conn.commit()
            return ok({'processed': True, 'ore_used': ore_used, 'alloys': alloys, 'components': components,
                       'message': f'✅ Переработано {ore_used} руды → ⚙️{alloys} сплавов, 🔩{components} компонентов'})

        # ── ИССЛЕДОВАТЬ ТЕХНОЛОГИЮ КОРАБЛЯ ───────────────────────────────────
        if action == 'research_ship_tech' and method == 'POST':
            tech_id = body.get('tech_id')
            if not tech_id or tech_id not in SHIP_TECHS: return err('Неизвестная технология')

            cur.execute(f"SELECT level FROM {S}.empire_techs WHERE player_id=%s AND tech_id=%s", (pid, tech_id))
            if cur.fetchone(): return err('Уже исследовано')

            # Нужна лаборатория на станции
            cur.execute(f"""
                SELECT lab_level FROM {S}.orbital_stations
                WHERE player_id=%s AND lab_level >= 1
                LIMIT 1
            """, (pid,))
            if not cur.fetchone(): return err('Нужна Лаборатория на орбитальной станции')

            t = SHIP_TECHS[tech_id]
            cost = t['cost']
            if player['metal'] < cost.get('metal',0) or player['energy'] < cost.get('energy',0) or player['crystals'] < cost.get('crystals',0):
                return err(f'Нужно: ⛏️{cost.get("metal",0)} ⚡{cost.get("energy",0)} 💎{cost.get("crystals",0)}')

            cur.execute(f"UPDATE {S}.empire_players SET metal=metal-%s, energy=energy-%s, crystals=crystals-%s WHERE id=%s",
                        (cost.get('metal',0), cost.get('energy',0), cost.get('crystals',0), pid))
            cur.execute(f"INSERT INTO {S}.empire_techs (player_id, tech_id, level) VALUES (%s,%s,1)", (pid, tech_id))
            conn.commit()
            return ok({'researched': True, 'tech': t['name'], 'unlocks': t['unlocks'],
                       'message': f'✅ Изучено: {t["name"]}! Разблокирован {SHIPS[t["unlocks"]]["name"]}'})

        return err('Неизвестное действие', 404)

    finally:
        cur.close()
        conn.close()
