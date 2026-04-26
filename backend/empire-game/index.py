"""
Галактическая Империя — Игровые данные.
GET  action=galaxy          — все системы и планеты для карты
GET  action=system&id=N     — детали системы + планеты
GET  action=planet&id=N     — детали планеты
GET  action=colonies        — мои колонии
GET  action=colony&id=N     — детали колонии
POST action=upgrade_building {colony_id, building}
GET  action=techs           — мои исследования
POST action=research        {tech_id}
GET  action=fleets          — мои флоты
POST action=build_ship      {colony_id, ship_type, count}
POST action=create_fleet    {colony_id, ships, name}
POST action=send_fleet      {fleet_id, target_planet_id, mission}
POST action=colonize        {fleet_id, planet_id}
POST action=tick            — обновить производство ресурсов
"""
import json, os, psycopg2

S = os.environ.get('MAIN_DB_SCHEMA', 't_p83915249_biotech_anime_store')

BUILDINGS = {
    'mine':          {'name':'Шахта металла',      'max_level':15, 'base_cost':{'metal':100,'energy':30},  'prod':{'metal':1}},
    'solar':         {'name':'Солнечный реактор',   'max_level':15, 'base_cost':{'energy':50,'crystals':10},'prod':{'energy':1}},
    'lab':           {'name':'Исследовательская лаб','max_level':10,'base_cost':{'metal':150,'energy':60,'crystals':30},'prod':{'crystals':1}},
    'shipyard':      {'name':'Звёздная верфь',      'max_level':12, 'base_cost':{'metal':200,'energy':80},  'prod':{}},
    'barracks':      {'name':'Казармы пилотов',     'max_level':10, 'base_cost':{'metal':120,'energy':40},  'prod':{'population':1}},
    'crystal_mine':  {'name':'Добытчик кристаллов', 'max_level':12, 'base_cost':{'metal':180,'energy':70},  'prod':{'crystals':2}},
    'shield':        {'name':'Планетарный щит',     'max_level':8,  'base_cost':{'metal':300,'energy':150,'crystals':80},'prod':{}},
    'market':        {'name':'Торговый хаб',        'max_level':8,  'base_cost':{'metal':100,'crystals':50},'prod':{'metal':1,'crystals':1}},
    'fuel_refinery': {'name':'Топливный завод',     'max_level':10, 'base_cost':{'metal':250,'energy':100}, 'prod':{'fuel':1}},
    'dark_matter_lab':{'name':'Лаб. тёмной материи','max_level':5,  'base_cost':{'crystals':400,'energy':300},'prod':{'dark_matter':1}},
}

SHIPS = {
    'scout':      {'name':'Разведчик',    'atk':8,   'def':5,   'cost':{'metal':60,'energy':20,'fuel':10},         'speed':150},
    'fighter':    {'name':'Истребитель',  'atk':20,  'def':15,  'cost':{'metal':150,'energy':50,'fuel':20},         'speed':120},
    'cruiser':    {'name':'Крейсер',      'atk':55,  'def':45,  'cost':{'metal':400,'energy':120,'crystals':60,'fuel':40},'speed':90},
    'battleship': {'name':'Линкор',       'atk':140, 'def':110, 'cost':{'metal':800,'energy':250,'crystals':180,'fuel':80},'speed':70},
    'dreadnought':{'name':'Дредноут',     'atk':350, 'def':280, 'cost':{'metal':1800,'energy':500,'crystals':400,'fuel':150},'speed':50},
    'titan':      {'name':'Титан',        'atk':900, 'def':750, 'cost':{'metal':4000,'energy':1200,'crystals':1000,'dark_matter':50,'fuel':300},'speed':30},
    'carrier':    {'name':'Авианосец',    'atk':200, 'def':350, 'cost':{'metal':2000,'energy':800,'crystals':500,'fuel':200},'speed':60},
    'stealth':    {'name':'Невидимка',    'atk':80,  'def':30,  'cost':{'metal':600,'energy':300,'crystals':200,'dark_matter':20,'fuel':50},'speed':180},
}

TECHS = {
    'metal_mining':     {'name':'Горное дело',       'cat':'economy',  'max_level':5, 'base_cost':{'crystals':100,'energy':50},   'effect':'metal_prod +15% per level'},
    'energy_cells':     {'name':'Энергоячейки',      'cat':'economy',  'max_level':5, 'base_cost':{'crystals':120,'metal':80},    'effect':'energy_prod +15% per level'},
    'crystal_synthesis':{'name':'Синтез кристаллов', 'cat':'economy',  'max_level':4, 'base_cost':{'crystals':150,'energy':100},  'effect':'crystal_prod +20% per level'},
    'colonization':     {'name':'Колонизация',       'cat':'expansion','max_level':3, 'base_cost':{'crystals':200,'metal':300},   'effect':'unlock colony ships, +1 colony slot'},
    'terraforming':     {'name':'Терраформирование', 'cat':'expansion','max_level':3, 'base_cost':{'crystals':400,'energy':300},  'effect':'colonize any planet type'},
    'warp_drive':       {'name':'Варп-двигатель',    'cat':'military', 'max_level':4, 'base_cost':{'crystals':300,'metal':200},   'effect':'fleet speed +25% per level'},
    'plasma_cannons':   {'name':'Плазменные пушки',  'cat':'military', 'max_level':5, 'base_cost':{'crystals':200,'energy':150},  'effect':'fleet attack +15% per level'},
    'ion_shields':      {'name':'Ионные щиты',       'cat':'military', 'max_level':5, 'base_cost':{'crystals':180,'energy':200},  'effect':'fleet defense +15% per level'},
    'nanobots':         {'name':'Нанороботы',        'cat':'military', 'max_level':3, 'base_cost':{'crystals':350,'energy':200},  'effect':'ship repair in battle +10%'},
    'dark_matter_weapon':{'name':'Оружие тёмной материи','cat':'military','max_level':3,'base_cost':{'dark_matter':30,'crystals':500,'energy':400},'effect':'fleet attack +50%, unlock titan'},
    'espionage':        {'name':'Шпионаж',           'cat':'special',  'max_level':4, 'base_cost':{'crystals':250,'energy':150},  'effect':'enable spy missions'},
    'diplomacy':        {'name':'Дипломатия',        'cat':'special',  'max_level':3, 'base_cost':{'crystals':200,'metal':100},   'effect':'better trade rates, alliances'},
    'quantum_computing':{'name':'Квантовые вычисления','cat':'special','max_level':3, 'base_cost':{'crystals':400,'energy':300},  'effect':'all production +20%'},
    'ancient_tech':     {'name':'Технологии Предтечей','cat':'special','max_level':2, 'base_cost':{'dark_matter':50,'crystals':800,'energy':600},'effect':'unlock titan, +40% all stats'},
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
    if not token:
        return None
    cur.execute(f"""
        SELECT id, nickname, race, metal, energy, crystals, population, fuel, dark_matter, score, alliance_id
        FROM {S}.empire_players WHERE session_token=%s
    """, (token,))
    r = cur.fetchone()
    if not r:
        return None
    return {'id':r[0],'nickname':r[1],'race':r[2],'metal':r[3],'energy':r[4],
            'crystals':r[5],'population':r[6],'fuel':r[7],'dark_matter':r[8],'score':r[9],'alliance_id':r[10]}

def building_cost(bld, level):
    base = BUILDINGS[bld]['base_cost']
    mult = 1.8 ** level
    return {k: int(v * mult) for k, v in base.items()}

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    body = {}
    if event.get('body'):
        body = json.loads(event['body'])
    action = body.get('action') if method == 'POST' else params.get('action', 'galaxy')
    token = get_token(event)

    conn = db()
    cur = conn.cursor()

    try:
        player = get_player(cur, token) if token else None

        # ── КАРТА ГАЛАКТИКИ ─────────────────────────────────────────────────────
        if action == 'galaxy':
            cur.execute(f"""
                SELECT id, name, pos_x, pos_y, star_type, star_size, sector, planet_count
                FROM {S}.empire_systems ORDER BY id
            """)
            systems = [{'id':r[0],'name':r[1],'pos_x':r[2],'pos_y':r[3],
                        'star_type':r[4],'star_size':r[5],'sector':r[6],'planet_count':r[7]}
                       for r in cur.fetchall()]

            cur.execute(f"""
                SELECT p.id, p.name, p.star_system_id, p.pos_x, p.pos_y, p.orbit_slot,
                       p.planet_type, p.biome, p.size, p.special_resource,
                       p.owner_id, p.owner_race, p.is_ai_controlled, p.ai_fleet_tier,
                       ep.nickname
                FROM {S}.empire_planets p
                LEFT JOIN {S}.empire_players ep ON ep.id = p.owner_id
                ORDER BY p.star_system_id, p.orbit_slot
            """)
            planets = [{'id':r[0],'name':r[1],'system_id':r[2],'pos_x':r[3],'pos_y':r[4],
                        'orbit':r[5],'type':r[6],'biome':r[7],'size':r[8],
                        'special':r[9],'owner_id':r[10],'owner_race':r[11],
                        'is_ai':r[12],'tier':r[13],'owner_name':r[14]}
                       for r in cur.fetchall()]
            return ok({'systems': systems, 'planets': planets})

        # ── ДЕТАЛИ ПЛАНЕТЫ ──────────────────────────────────────────────────────
        if action == 'planet':
            pid = params.get('id') or body.get('planet_id')
            if not pid:
                return err('id required')
            cur.execute(f"""
                SELECT p.id, p.name, p.star_system_id, p.planet_type, p.biome, p.size,
                       p.metal_richness, p.energy_richness, p.crystal_richness,
                       p.special_resource, p.owner_id, p.owner_race, p.is_ai_controlled,
                       p.ai_fleet_tier, p.ai_ships, p.description, p.is_colonizable,
                       ep.nickname, s.name
                FROM {S}.empire_planets p
                LEFT JOIN {S}.empire_players ep ON ep.id = p.owner_id
                LEFT JOIN {S}.empire_systems s ON s.id = p.star_system_id
                WHERE p.id=%s
            """, (pid,))
            r = cur.fetchone()
            if not r:
                return err('Планета не найдена', 404)

            # Флоты на орбите
            cur.execute(f"""
                SELECT f.id, f.fleet_name, f.ships, f.total_attack, f.total_defense,
                       ep.nickname, ep.race
                FROM {S}.empire_fleets f
                JOIN {S}.empire_players ep ON ep.id = f.owner_id
                WHERE f.current_planet_id=%s AND f.status='orbit'
            """, (pid,))
            fleets_on_orbit = [{'id':f[0],'name':f[1],'ships':f[2],'atk':f[3],'def':f[4],
                                 'owner':f[5],'race':f[6]} for f in cur.fetchall()]

            return ok({
                'id':r[0],'name':r[1],'system_id':r[2],'type':r[3],'biome':r[4],'size':r[5],
                'metal_r':float(r[6]),'energy_r':float(r[7]),'crystal_r':float(r[8]),
                'special':r[9],'owner_id':r[10],'owner_race':r[11],'is_ai':r[12],
                'ai_tier':r[13],'ai_ships':r[14],'description':r[15],'colonizable':r[16],
                'owner_name':r[17],'system_name':r[18],
                'fleets_on_orbit': fleets_on_orbit,
            })

        # ── МОИ КОЛОНИИ ─────────────────────────────────────────────────────────
        if action == 'colonies':
            if not player:
                return err('Не авторизован', 401)
            cur.execute(f"""
                SELECT c.id, c.colony_name, c.planet_id, c.is_capital,
                       c.mine_level, c.solar_level, c.lab_level, c.shipyard_level,
                       c.barracks_level, c.crystal_mine_level, c.shield_level,
                       c.market_level, c.fuel_refinery_level, c.dark_matter_lab_level,
                       c.metal, c.energy, c.crystals, c.population, c.fuel,
                       c.defense_hp, c.max_defense_hp, p.name, p.planet_type, p.biome
                FROM {S}.empire_colonies c
                JOIN {S}.empire_planets p ON p.id = c.planet_id
                WHERE c.player_id=%s ORDER BY c.is_capital DESC, c.id
            """, (player['id'],))
            cols_list = ['id','name','planet_id','is_capital','mine','solar','lab','shipyard',
                    'barracks','crystal_mine','shield','market','fuel_refinery','dark_matter_lab',
                    'metal','energy','crystals','population','fuel',
                    'defense_hp','max_defense_hp','planet_name','planet_type','planet_biome']
            return ok({'colonies': [dict(zip(cols_list, r)) for r in cur.fetchall()]})

        # ── УЛУЧШЕНИЕ ЗДАНИЯ ────────────────────────────────────────────────────
        if action == 'upgrade_building' and method == 'POST':
            if not player:
                return err('Не авторизован', 401)
            col_id = body.get('colony_id')
            bld    = body.get('building')
            if not col_id or bld not in BUILDINGS:
                return err('Укажите colony_id и здание')
            cur.execute(f"SELECT id, {bld}_level FROM {S}.empire_colonies WHERE id=%s AND player_id=%s", (col_id, player['id']))
            colony = cur.fetchone()
            if not colony:
                return err('Колония не найдена')
            cur_level = colony[1]
            max_level = BUILDINGS[bld]['max_level']
            if cur_level >= max_level:
                return err('Максимальный уровень')
            cost = building_cost(bld, cur_level + 1)
            for res, val in cost.items():
                if player.get(res, 0) < val:
                    return err(f'Недостаточно ресурсов. Нужно {res}: {val}')
            # Списываем ресурсы
            updates = ' '.join([f"{k}={k}-%s," for k in cost.keys()])[:-1]
            cur.execute(f"UPDATE {S}.empire_players SET {updates} WHERE id=%s",
                        list(cost.values()) + [player['id']])
            cur.execute(f"UPDATE {S}.empire_colonies SET {bld}_level={bld}_level+1 WHERE id=%s", (col_id,))
            conn.commit()
            return ok({'upgraded': True, 'building': bld, 'new_level': cur_level + 1, 'cost': cost})

        # ── ТЕХНОЛОГИИ ──────────────────────────────────────────────────────────
        if action == 'techs':
            if not player:
                return err('Не авторизован', 401)
            cur.execute(f"SELECT tech_id, level FROM {S}.empire_techs WHERE player_id=%s", (player['id'],))
            my_techs = {r[0]: r[1] for r in cur.fetchall()}
            result = []
            for tid, td in TECHS.items():
                level = my_techs.get(tid, 0)
                cost_mult = 1.8 ** level if level > 0 else 1
                cost = {k: int(v * cost_mult) for k, v in td['base_cost'].items()}
                result.append({
                    'id': tid, 'name': td['name'], 'category': td['cat'],
                    'level': level, 'max_level': td['max_level'],
                    'effect': td['effect'], 'cost': cost,
                    'researched': level > 0,
                })
            return ok({'techs': result, 'tech_definitions': TECHS})

        # ── ИССЛЕДОВАНИЕ ────────────────────────────────────────────────────────
        if action == 'research' and method == 'POST':
            if not player:
                return err('Не авторизован', 401)
            tid = body.get('tech_id')
            if tid not in TECHS:
                return err('Неизвестная технология')
            td = TECHS[tid]
            cur.execute(f"SELECT level FROM {S}.empire_techs WHERE player_id=%s AND tech_id=%s", (player['id'], tid))
            row = cur.fetchone()
            cur_level = row[0] if row else 0
            if cur_level >= td['max_level']:
                return err('Технология уже на максимальном уровне')
            cost_mult = 1.8 ** cur_level if cur_level > 0 else 1
            cost = {k: int(v * cost_mult) for k, v in td['base_cost'].items()}
            for res, val in cost.items():
                if player.get(res, 0) < val:
                    return err(f'Недостаточно ресурсов. Нужно {res}: {val}')
            updates = ' '.join([f"{k}={k}-%s," for k in cost.keys()])[:-1]
            cur.execute(f"UPDATE {S}.empire_players SET {updates} WHERE id=%s",
                        list(cost.values()) + [player['id']])
            if row:
                cur.execute(f"UPDATE {S}.empire_techs SET level=level+1 WHERE player_id=%s AND tech_id=%s", (player['id'], tid))
            else:
                cur.execute(f"INSERT INTO {S}.empire_techs (player_id, tech_id, level) VALUES (%s,%s,1)", (player['id'], tid))
            conn.commit()
            return ok({'researched': True, 'tech': tid, 'new_level': cur_level + 1, 'cost': cost})

        # ── МОИ ФЛОТЫ ───────────────────────────────────────────────────────────
        if action == 'fleets':
            if not player:
                return err('Не авторизован', 401)
            cur.execute(f"""
                SELECT f.id, f.fleet_name, f.ships, f.total_attack, f.total_defense,
                       f.current_planet_id, f.target_planet_id, f.status, f.mission,
                       f.arrive_at, f.fuel, p.name, tp.name
                FROM {S}.empire_fleets f
                LEFT JOIN {S}.empire_planets p ON p.id = f.current_planet_id
                LEFT JOIN {S}.empire_planets tp ON tp.id = f.target_planet_id
                WHERE f.owner_id=%s ORDER BY f.id
            """, (player['id'],))
            cols_list = ['id','name','ships','attack','defense','planet_id','target_id',
                    'status','mission','arrive_at','fuel','planet_name','target_name']
            return ok({'fleets': [dict(zip(cols_list, r)) for r in cur.fetchall()],
                       'ship_types': SHIPS})

        # ── СТРОИТЕЛЬСТВО КОРАБЛЕЙ ──────────────────────────────────────────────
        if action == 'build_ship' and method == 'POST':
            if not player:
                return err('Не авторизован', 401)
            col_id    = body.get('colony_id')
            ship_type = body.get('ship_type')
            count     = max(1, int(body.get('count', 1)))
            if ship_type not in SHIPS:
                return err('Неизвестный тип корабля')
            cur.execute(f"SELECT shipyard_level, planet_id FROM {S}.empire_colonies WHERE id=%s AND player_id=%s", (col_id, player['id']))
            col = cur.fetchone()
            if not col or col[0] < 1:
                return err('Нужна верфь уровень 1+')
            s = SHIPS[ship_type]
            total_cost = {k: v * count for k, v in s['cost'].items()}
            for res, val in total_cost.items():
                if player.get(res, 0) < val:
                    return err(f'Недостаточно ресурсов. Нужно {res}: {val}')
            updates = ' '.join([f"{k}={k}-%s," for k in total_cost.keys()])[:-1]
            cur.execute(f"UPDATE {S}.empire_players SET {updates} WHERE id=%s",
                        list(total_cost.values()) + [player['id']])
            # Проверяем, есть ли флот на этой колонии
            cur.execute(f"SELECT id, ships FROM {S}.empire_fleets WHERE owner_id=%s AND current_planet_id=%s AND status='orbit' LIMIT 1", (player['id'], col[1]))
            fleet = cur.fetchone()
            if fleet:
                fleet_ships = fleet[1] or {}
                fleet_ships[ship_type] = fleet_ships.get(ship_type, 0) + count
                new_atk = sum(SHIPS[st]['atk'] * n for st, n in fleet_ships.items() if st in SHIPS)
                new_def = sum(SHIPS[st]['def'] * n for st, n in fleet_ships.items() if st in SHIPS)
                cur.execute(f"UPDATE {S}.empire_fleets SET ships=%s, total_attack=%s, total_defense=%s WHERE id=%s",
                            (json.dumps(fleet_ships), new_atk, new_def, fleet[0]))
            else:
                init_ships = {ship_type: count}
                atk = SHIPS[ship_type]['atk'] * count
                df  = SHIPS[ship_type]['def'] * count
                cur.execute(f"""
                    INSERT INTO {S}.empire_fleets (owner_id, fleet_name, ships, total_attack, total_defense, current_planet_id, status, mission)
                    VALUES (%s,%s,%s,%s,%s,%s,'orbit','defend')
                """, (player['id'], f'Флот {player["nickname"]}', json.dumps(init_ships), atk, df, col[1]))
            cur.execute(f"UPDATE {S}.empire_players SET fleets_count=fleets_count+0 WHERE id=%s", (player['id'],))
            conn.commit()
            return ok({'built': True, 'ship_type': ship_type, 'count': count, 'cost': total_cost})

        # ── ОТПРАВИТЬ ФЛОТ ──────────────────────────────────────────────────────
        if action == 'send_fleet' and method == 'POST':
            if not player:
                return err('Не авторизован', 401)
            fleet_id  = body.get('fleet_id')
            target_pid = body.get('target_planet_id')
            mission   = body.get('mission', 'attack')
            cur.execute(f"SELECT id, ships, current_planet_id, status FROM {S}.empire_fleets WHERE id=%s AND owner_id=%s", (fleet_id, player['id']))
            fleet = cur.fetchone()
            if not fleet or fleet[3] != 'orbit':
                return err('Флот не найден или уже в пути')
            cur.execute(f"SELECT pos_x, pos_y FROM {S}.empire_planets WHERE id=%s", (fleet[2],))
            origin = cur.fetchone()
            cur.execute(f"SELECT pos_x, pos_y FROM {S}.empire_planets WHERE id=%s", (target_pid,))
            target = cur.fetchone()
            if not origin or not target:
                return err('Планета не найдена')
            import math, datetime
            dist = math.sqrt((origin[0]-target[0])**2 + (origin[1]-target[1])**2)
            travel_time = max(30, int(dist / 1.5))
            arrive = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(seconds=travel_time)
            cur.execute(f"""
                UPDATE {S}.empire_fleets SET status='traveling', mission=%s,
                  origin_planet_id=%s, target_planet_id=%s, arrive_at=%s
                WHERE id=%s
            """, (mission, fleet[2], target_pid, arrive, fleet_id))
            conn.commit()
            return ok({'sent': True, 'travel_seconds': travel_time, 'arrive_at': str(arrive)})

        # ── ТИК ПРОИЗВОДСТВА ────────────────────────────────────────────────────
        if action == 'tick' and method == 'POST':
            if not player:
                return err('Не авторизован', 401)
            import datetime
            cur.execute(f"""
                SELECT id, mine_level, solar_level, lab_level, barracks_level,
                       crystal_mine_level, market_level, fuel_refinery_level, dark_matter_lab_level,
                       last_tick_at
                FROM {S}.empire_colonies WHERE player_id=%s
            """, (player['id'],))
            colonies = cur.fetchall()
            total = {'metal': 0, 'energy': 0, 'crystals': 0, 'population': 0, 'fuel': 0, 'dark_matter': 0}
            now = datetime.datetime.now(datetime.timezone.utc)
            for col in colonies:
                last = col[9]
                mins = max(0, int((now - last).total_seconds() / 60))
                if mins == 0:
                    continue
                total['metal']       += col[1] * 15 * mins
                total['energy']      += col[2] * 12 * mins
                total['crystals']    += (col[3] * 5 + col[6] * 10) * mins
                total['population']  += col[4] * 2 * mins
                total['fuel']        += col[7] * 8 * mins
                total['dark_matter'] += col[8] * 3 * mins
                cur.execute(f"UPDATE {S}.empire_colonies SET last_tick_at=%s WHERE id=%s", (now, col[0]))

            # Прираст с бонусом технологий
            cur.execute(f"SELECT tech_id, level FROM {S}.empire_techs WHERE player_id=%s", (player['id'],))
            player_techs = {r[0]: r[1] for r in cur.fetchall()}

            mult = 1.0
            if 'quantum_computing' in player_techs:
                mult *= 1 + player_techs['quantum_computing'] * 0.20
            if 'ancient_tech' in player_techs:
                mult *= 1 + player_techs['ancient_tech'] * 0.40
            total['metal']    = int(total['metal']    * (1 + player_techs.get('metal_mining', 0) * 0.15) * mult)
            total['energy']   = int(total['energy']   * (1 + player_techs.get('energy_cells', 0) * 0.15) * mult)
            total['crystals'] = int(total['crystals'] * (1 + player_techs.get('crystal_synthesis', 0) * 0.20) * mult)
            total['fuel']     = int(total['fuel']     * mult)
            total['dark_matter'] = int(total['dark_matter'] * mult)

            new_score = player['score'] + sum(total.values()) // 100

            cur.execute(f"""
                UPDATE {S}.empire_players SET
                  metal=metal+%s, energy=energy+%s, crystals=crystals+%s,
                  population=LEAST(population+%s, 10000),
                  fuel=fuel+%s, dark_matter=dark_matter+%s,
                  score=%s
                WHERE id=%s
            """, (total['metal'], total['energy'], total['crystals'],
                  total['population'], total['fuel'], total['dark_matter'],
                  new_score, player['id']))
            conn.commit()
            return ok({'ticked': True, 'produced': total, 'score': new_score})

        # ── КАТАЛОГ КОРАБЛЕЙ И ЗДАНИЙ ───────────────────────────────────────────
        if action == 'catalog':
            return ok({'ships': SHIPS, 'buildings': BUILDINGS, 'techs': TECHS})

        return err('Неизвестное действие', 404)

    finally:
        cur.close()
        conn.close()