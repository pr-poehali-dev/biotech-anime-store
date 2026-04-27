"""
Галактическая Империя — Пираты и Ядро ИИ.
GET  action=state          — состояние пиратских флотов и Ядра (для карты)
GET  action=events         — оповещения игрока (атаки, помощь Ядра, обломки)
POST action=read_event {event_id}  — прочитать оповещение
GET  action=wrecks         — доступные обломки пиратов
POST action=salvage {wreck_id}     — добыть ресурсы из обломков
POST action=tick           — тик ИИ (вызывается фронтом каждые 30 сек)
POST action=request_core_help      — попросить помощь Ядра
"""
import json, os, psycopg2, math, random, datetime

S = os.environ.get('MAIN_DB_SCHEMA', 't_p83915249_biotech_anime_store')

SHIPS = {
    'scout':       {'atk': 8,   'def': 5,   'cost': {'metal': 60,   'energy': 20,  'fuel': 10}},
    'fighter':     {'atk': 20,  'def': 15,  'cost': {'metal': 150,  'energy': 50,  'fuel': 20}},
    'cruiser':     {'atk': 55,  'def': 45,  'cost': {'metal': 400,  'energy': 120, 'fuel': 40}},
    'battleship':  {'atk': 140, 'def': 110, 'cost': {'metal': 800,  'energy': 250, 'fuel': 80}},
    'dreadnought': {'atk': 350, 'def': 280, 'cost': {'metal': 1800, 'energy': 500, 'fuel': 150}},
    'titan':       {'atk': 900, 'def': 750, 'cost': {'metal': 4000, 'energy': 1200,'fuel': 300}},
}

# Пираты апгрейдятся по тиру — новые корабли каждые N тиков
PIRATE_UPGRADES = {
    1: {'scout': 3, 'fighter': 4},
    2: {'fighter': 8, 'cruiser': 3},
    3: {'fighter': 6, 'cruiser': 5, 'battleship': 1},
    4: {'cruiser': 4, 'battleship': 4, 'dreadnought': 1},
    5: {'battleship': 6, 'dreadnought': 3},
    6: {'battleship': 8, 'dreadnought': 4, 'titan': 1},
    7: {'dreadnought': 5, 'titan': 2},
    8: {'dreadnought': 6, 'titan': 3},
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
        SELECT id, nickname, race, metal, energy, crystals, fuel, dark_matter,
               score, home_planet_id, colonies_count, is_online, alliance_id
        FROM {S}.empire_players WHERE session_token=%s
    """, (token,))
    r = cur.fetchone()
    if not r: return None
    return {'id':r[0],'nickname':r[1],'race':r[2],'metal':r[3],'energy':r[4],
            'crystals':r[5],'fuel':r[6],'dark_matter':r[7],'score':r[8],
            'home_planet_id':r[9],'colonies_count':r[10],'is_online':r[11],'alliance_id':r[12]}

def calc_fleet_power(ships):
    atk = sum(SHIPS.get(k, {}).get('atk', 0) * v for k, v in ships.items())
    df  = sum(SHIPS.get(k, {}).get('def', 0) * v for k, v in ships.items())
    return atk, df

def notify(cur, player_id, event_type, title, message, data=None):
    cur.execute(f"""
        INSERT INTO {S}.ai_events (player_id, event_type, title, message, event_data)
        VALUES (%s, %s, %s, %s, %s)
    """, (player_id, event_type, title, message, json.dumps(data or {})))

def handler(event: dict, context) -> dict:
    """Пираты ИИ и Ядро — атаки, обломки, флот защитников."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    body   = {}
    if event.get('body'):
        body = json.loads(event['body'])
    action = body.get('action') if method == 'POST' else params.get('action', 'state')
    token  = get_token(event)

    conn = db()
    cur  = conn.cursor()

    try:
        player = get_player(cur, token) if token else None

        # ── СОСТОЯНИЕ ПИРАТОВ И ЯДРА (для карты) ────────────────────────────
        if action == 'state':
            cur.execute(f"""
                SELECT id, name, tier, ships, total_attack, total_defense,
                       pos_x, pos_y, status, target_player_id, tech_level
                FROM {S}.pirate_fleets ORDER BY id
            """)
            pirates = []
            for r in cur.fetchall():
                ships = r[3] if isinstance(r[3], dict) else json.loads(r[3] or '{}')
                pirates.append({
                    'id':r[0],'name':r[1],'tier':r[2],'ships':ships,
                    'attack':r[4],'defense':r[5],
                    'pos_x':float(r[6]),'pos_y':float(r[7]),
                    'status':r[8],'target_player_id':r[9],'tech_level':r[10],
                })

            cur.execute(f"""
                SELECT id, name, ships, total_attack, total_defense,
                       pos_x, pos_y, status, target_player_id, tech_level
                FROM {S}.core_fleet LIMIT 1
            """)
            cf = cur.fetchone()
            core = None
            if cf:
                ships_c = cf[2] if isinstance(cf[2], dict) else json.loads(cf[2] or '{}')
                core = {'id':cf[0],'name':cf[1],'ships':ships_c,
                        'attack':cf[3],'defense':cf[4],
                        'pos_x':float(cf[5]),'pos_y':float(cf[6]),
                        'status':cf[7],'target_player_id':cf[8],'tech_level':cf[9]}

            # Обломки
            cur.execute(f"""
                SELECT id, pos_x, pos_y, metal, energy, crystals, fuel
                FROM {S}.pirate_wrecks
                WHERE salvaged_by IS NULL AND expires_at > NOW()
            """)
            wrecks = [{'id':r[0],'pos_x':float(r[1]),'pos_y':float(r[2]),
                       'metal':r[3],'energy':r[4],'crystals':r[5],'fuel':r[6]}
                      for r in cur.fetchall()]

            # Непрочитанные события игрока
            unread = 0
            if player:
                cur.execute(f"SELECT COUNT(*) FROM {S}.ai_events WHERE player_id=%s AND is_read=false", (player['id'],))
                unread = cur.fetchone()[0]

            return ok({'pirates': pirates, 'core': core, 'wrecks': wrecks, 'unread_events': unread})

        # ── СОБЫТИЯ ИГРОКА ───────────────────────────────────────────────────
        if action == 'events':
            if not player: return err('Не авторизован', 401)
            cur.execute(f"""
                SELECT id, event_type, title, message, event_data, is_read, created_at
                FROM {S}.ai_events WHERE player_id=%s
                ORDER BY created_at DESC LIMIT 20
            """, (player['id'],))
            events = [{'id':r[0],'type':r[1],'title':r[2],'message':r[3],
                       'data':r[4],'read':r[5],'date':str(r[6])}
                      for r in cur.fetchall()]
            return ok({'events': events})

        if action == 'read_event' and method == 'POST':
            if not player: return err('Не авторизован', 401)
            eid = body.get('event_id')
            if eid:
                cur.execute(f"UPDATE {S}.ai_events SET is_read=true WHERE id=%s AND player_id=%s", (eid, player['id']))
            else:
                cur.execute(f"UPDATE {S}.ai_events SET is_read=true WHERE player_id=%s", (player['id'],))
            conn.commit()
            return ok({'read': True})

        # ── ОБЛОМКИ ──────────────────────────────────────────────────────────
        if action == 'wrecks':
            cur.execute(f"""
                SELECT id, pos_x, pos_y, metal, energy, crystals, fuel, expires_at
                FROM {S}.pirate_wrecks
                WHERE salvaged_by IS NULL AND expires_at > NOW()
                ORDER BY created_at DESC
            """)
            wrecks = [{'id':r[0],'pos_x':float(r[1]),'pos_y':float(r[2]),
                       'metal':r[3],'energy':r[4],'crystals':r[5],'fuel':r[6],'expires':str(r[7])}
                      for r in cur.fetchall()]
            return ok({'wrecks': wrecks})

        if action == 'salvage' and method == 'POST':
            if not player: return err('Не авторизован', 401)
            wreck_id = body.get('wreck_id')
            if not wreck_id: return err('Укажите wreck_id')
            cur.execute(f"""
                SELECT id, metal, energy, crystals, fuel
                FROM {S}.pirate_wrecks
                WHERE id=%s AND salvaged_by IS NULL AND expires_at > NOW()
            """, (wreck_id,))
            w = cur.fetchone()
            if not w: return err('Обломки не найдены или уже собраны')
            cur.execute(f"""
                UPDATE {S}.empire_players
                SET metal=metal+%s, energy=energy+%s, crystals=crystals+%s, fuel=fuel+%s
                WHERE id=%s
            """, (w[1], w[2], w[3], w[4], player['id']))
            cur.execute(f"UPDATE {S}.pirate_wrecks SET salvaged_by=%s WHERE id=%s", (player['id'], w[0]))
            conn.commit()
            return ok({'salvaged': True, 'metal': w[1], 'energy': w[2], 'crystals': w[3], 'fuel': w[4],
                       'message': f'Собрано с обломков: ⛏️{w[1]} ⚡{w[2]} 💎{w[3]} ⛽{w[4]}'})

        # ── ЗАПРОС ПОМОЩИ ЯДРА ───────────────────────────────────────────────
        if action == 'request_core_help' and method == 'POST':
            if not player: return err('Не авторизован', 401)
            # Проверяем: нет альянса с другими игроками
            if player['alliance_id']:
                return err('Ядро помогает только одиноким командорам без альянса')
            # Нет активного союза с игроками через дипломатию
            cur.execute(f"""
                SELECT COUNT(*) FROM {S}.empire_diplomacy
                WHERE (player_id=%s OR target_id=%s)
                AND relation_type IN ('accepted','trade_union_proposed')
            """, (player['id'], player['id']))
            diplo_count = cur.fetchone()[0]
            if diplo_count > 0:
                return err('У вас есть дипломатические союзы. Ядро помогает только независимым')
            # Есть ли активные атаки пиратов на игрока
            cur.execute(f"""
                SELECT id, name, pos_x, pos_y FROM {S}.pirate_fleets
                WHERE target_player_id=%s AND status='attacking'
            """, (player['id'],))
            attackers = cur.fetchall()
            if not attackers:
                return err('Нет активных пиратских атак на вас')
            # Направляем Ядро
            atk = attackers[0]
            cur.execute(f"""
                UPDATE {S}.core_fleet
                SET status='en_route', target_player_id=%s, pos_x=%s, pos_y=%s, updated_at=NOW()
                WHERE status IN ('guarding','returning')
            """, (player['id'], atk[2], atk[3]))
            if cur.rowcount:
                notify(cur, player['id'], 'core_help',
                       '👑 Стражи Ядра выдвигаются!',
                       f'Флот Ядра летит на помощь против {atk[1]}. Держитесь, командор!',
                       {'pirate_name': atk[1], 'pirate_id': atk[0]})
                conn.commit()
                return ok({'help_sent': True, 'message': 'Стражи Ядра выдвигаются на помощь!'})
            return err('Флот Ядра уже занят другой миссией')

        # ── ТИК ИИ (30 сек) ──────────────────────────────────────────────────
        if action == 'tick' and method == 'POST':
            now = datetime.datetime.now(datetime.timezone.utc)

            # 1. Апгрейд пиратских флотов (раз в 10 тиков случайно)
            if random.random() < 0.1:
                cur.execute(f"SELECT id, tier, tech_level FROM {S}.pirate_fleets WHERE status != 'wrecked'")
                for pf in cur.fetchall():
                    pid, tier, tech = pf
                    new_tech = min(10, tech + 1)
                    new_tier = min(8, tier + (1 if new_tech % 3 == 0 else 0))
                    new_ships = json.dumps(PIRATE_UPGRADES.get(new_tier, PIRATE_UPGRADES[1]))
                    atk, df = calc_fleet_power(PIRATE_UPGRADES.get(new_tier, {}))
                    tech_bonus = 1 + new_tech * 0.1
                    cur.execute(f"""
                        UPDATE {S}.pirate_fleets
                        SET tech_level=%s, tier=%s, ships=%s::jsonb,
                            total_attack=%s, total_defense=%s, updated_at=NOW()
                        WHERE id=%s
                    """, (new_tech, new_tier, new_ships,
                          int(atk * tech_bonus), int(df * tech_bonus), pid))

            # 2. Патрулирующие пираты ищут цель — игрока онлайн с колонией и флотом
            cur.execute(f"""
                SELECT id, pos_x, pos_y, tier, total_attack FROM {S}.pirate_fleets
                WHERE status = 'idle' OR status = 'patrol'
                ORDER BY RANDOM() LIMIT 3
            """)
            idle_pirates = cur.fetchall()

            if idle_pirates:
                # Ищем уязвимых игроков: онлайн, есть колония, есть боевой флот
                cur.execute(f"""
                    SELECT p.id, p.nickname, p.home_planet_id, pl.pos_x, pl.pos_y,
                           p.metal + p.energy + p.crystals as wealth
                    FROM {S}.empire_players p
                    JOIN {S}.empire_planets pl ON pl.id = p.home_planet_id
                    WHERE p.is_online = true
                      AND p.colonies_count > 0
                      AND EXISTS (
                          SELECT 1 FROM {S}.empire_fleets f
                          WHERE f.owner_id = p.id
                            AND f.total_attack > 0
                      )
                      AND NOT EXISTS (
                          SELECT 1 FROM {S}.pirate_fleets pf
                          WHERE pf.target_player_id = p.id AND pf.status = 'attacking'
                      )
                    ORDER BY RANDOM() LIMIT 3
                """)
                targets = cur.fetchall()

                for pirate in idle_pirates:
                    if not targets: break
                    target = random.choice(targets)
                    pid, pname, planet_id, tx, ty, wealth = target
                    ppid, ppx, ppy, tier, p_atk = pirate

                    # Пираты атакуют только если достаточно сильны
                    # Получаем мощь флота игрока
                    cur.execute(f"SELECT SUM(total_defense) FROM {S}.empire_fleets WHERE owner_id=%s", (pid,))
                    player_def = cur.fetchone()[0] or 0

                    if p_atk > player_def * 0.3:  # атакуют если хотя бы 30% от защиты
                        cur.execute(f"""
                            UPDATE {S}.pirate_fleets
                            SET status='attacking', target_player_id=%s,
                                target_planet_id=%s, last_action_at=NOW()
                            WHERE id=%s
                        """, (pid, planet_id, ppid))

                        # Уведомление игроку
                        pirate_name = ['Красный Коготь','Теневые Клинки','Железный Кулак',
                                       'Тёмная Стая','Налётчики Небытия','Армада Хаоса',
                                       'Пожиратели Миров','Флот Апокалипсиса'][ppid-1] if ppid <= 8 else f'Пираты #{ppid}'
                        notify(cur, pid, 'pirate_attack',
                               f'🚨 Пиратская атака! {pirate_name}',
                               f'Пиратский флот "{pirate_name}" (тир {tier}) летит к вашей колонии! '
                               f'Сила атаки: {p_atk}. Укрепите оборону или запросите помощь Ядра!',
                               {'pirate_id': ppid, 'pirate_name': pirate_name,
                                'pirate_attack': p_atk, 'tier': tier})
                        targets.remove(target)

            # 3. Атакующие пираты движутся к цели и сражаются
            cur.execute(f"""
                SELECT pf.id, pf.total_attack, pf.total_defense, pf.tier,
                       pf.target_player_id, pf.pos_x, pf.pos_y,
                       pl.pos_x as tx, pl.pos_y as ty, pf.home_x, pf.home_y,
                       pf.target_planet_id
                FROM {S}.pirate_fleets pf
                LEFT JOIN {S}.empire_fleets ef ON ef.owner_id = pf.target_player_id
                LEFT JOIN {S}.empire_planets pl ON pl.id = pf.target_planet_id
                WHERE pf.status = 'attacking' AND pf.target_player_id IS NOT NULL
            """)
            for atk_row in cur.fetchall():
                pf_id, p_atk, p_def, tier, tgt_pid = atk_row[0], atk_row[1], atk_row[2], atk_row[3], atk_row[4]
                px, py, tx, ty = float(atk_row[5]), float(atk_row[6]), float(atk_row[7] or 0), float(atk_row[8] or 0)
                home_x, home_y = float(atk_row[9]), float(atk_row[10])
                planet_id = atk_row[11]

                if tx == 0 and ty == 0: continue

                dist = math.sqrt((tx-px)**2 + (ty-py)**2)
                speed = 20  # пикселей за тик

                if dist > speed:
                    # Движемся к цели
                    nx = px + (tx-px)/dist*speed
                    ny = py + (ty-py)/dist*speed
                    cur.execute(f"UPDATE {S}.pirate_fleets SET pos_x=%s, pos_y=%s, updated_at=NOW() WHERE id=%s",
                                (nx, ny, pf_id))
                else:
                    # Достигли цели — бой!
                    cur.execute(f"""
                        SELECT SUM(total_attack), SUM(total_defense)
                        FROM {S}.empire_fleets WHERE owner_id=%s
                    """, (tgt_pid,))
                    fleet_row = cur.fetchone()
                    player_atk = fleet_row[0] or 0
                    player_def = fleet_row[1] or 0

                    loot_metal    = random.randint(200, 800) * tier
                    loot_energy   = random.randint(100, 500) * tier
                    loot_crystals = random.randint(50,  300) * tier

                    if p_atk > player_def:
                        # Пираты победили — грабят
                        cur.execute(f"""
                            UPDATE {S}.empire_players
                            SET metal=GREATEST(0,metal-%s), energy=GREATEST(0,energy-%s),
                                crystals=GREATEST(0,crystals-%s)
                            WHERE id=%s
                        """, (loot_metal, loot_energy, loot_crystals, tgt_pid))
                        notify(cur, tgt_pid, 'pirate_attack',
                               f'💀 Пираты ограбили вас!',
                               f'Пиратский флот прорвал оборону и похитил ресурсы: '
                               f'⛏️{loot_metal} ⚡{loot_energy} 💎{loot_crystals}. Укрепляйте флот!',
                               {'loot_metal':loot_metal,'loot_energy':loot_energy,'loot_crystals':loot_crystals})
                        # Пираты отступают домой
                        cur.execute(f"""
                            UPDATE {S}.pirate_fleets
                            SET status='patrol', target_player_id=NULL, target_planet_id=NULL,
                                pos_x=home_x, pos_y=home_y, updated_at=NOW()
                            WHERE id=%s
                        """, (pf_id,))
                    else:
                        # Игрок победил — пираты становятся обломками
                        # Удаляем пиратский флот на время (статус wrecked)
                        cur.execute(f"""
                            UPDATE {S}.pirate_fleets
                            SET status='wrecked', target_player_id=NULL, target_planet_id=NULL, updated_at=NOW()
                            WHERE id=%s
                        """, (pf_id,))
                        # Создаём обломки
                        expires = now + datetime.timedelta(hours=2)
                        wreck_metal    = loot_metal * 2
                        wreck_energy   = loot_energy * 2
                        wreck_crystals = loot_crystals * 2
                        wreck_fuel     = random.randint(50, 200) * tier
                        cur.execute(f"""
                            INSERT INTO {S}.pirate_wrecks (pos_x, pos_y, metal, energy, crystals, fuel, expires_at)
                            VALUES (%s, %s, %s, %s, %s, %s, %s)
                        """, (tx, ty, wreck_metal, wreck_energy, wreck_crystals, wreck_fuel, expires))
                        notify(cur, tgt_pid, 'pirate_defeated',
                               '🏆 Пираты разбиты!',
                               f'Ваш флот уничтожил пиратов! На месте боя остались обломки с ресурсами: '
                               f'⛏️{wreck_metal} ⚡{wreck_energy} 💎{wreck_crystals} ⛽{wreck_fuel}. '
                               f'Собирайте обломки через вкладку Карта!',
                               {'wreck_metal':wreck_metal,'wreck_energy':wreck_energy,
                                'wreck_crystals':wreck_crystals,'wreck_fuel':wreck_fuel,
                                'pos_x':tx,'pos_y':ty})

                        # Восстанавливаем пиратский флот через 5 минут (просто меняем позицию на дом)
                        cur.execute(f"""
                            UPDATE {S}.pirate_fleets
                            SET pos_x=home_x, pos_y=home_y,
                                ships=(%s::jsonb), updated_at=NOW()
                            WHERE id=%s
                        """, (json.dumps(PIRATE_UPGRADES.get(max(1,tier-1), PIRATE_UPGRADES[1])), pf_id))

            # 4. Флот Ядра в пути
            cur.execute(f"""
                SELECT id, pos_x, pos_y, target_player_id, total_attack, total_defense
                FROM {S}.core_fleet WHERE status='en_route' LIMIT 1
            """)
            cf = cur.fetchone()
            if cf:
                cf_id, cx, cy, tgt_pid, c_atk, c_def = cf
                cx, cy = float(cx), float(cy)
                # Находим пирата атакующего цель
                cur.execute(f"""
                    SELECT pf.id, pf.pos_x, pf.pos_y, pf.total_attack
                    FROM {S}.pirate_fleets pf
                    WHERE pf.target_player_id=%s AND pf.status='attacking'
                    LIMIT 1
                """, (tgt_pid,))
                pirate_target = cur.fetchone()
                if pirate_target:
                    pid2, px2, py2, p_atk2 = pirate_target
                    px2, py2 = float(px2), float(py2)
                    dist2 = math.sqrt((px2-cx)**2 + (py2-cy)**2)
                    speed_core = 40
                    if dist2 > speed_core:
                        nx = cx + (px2-cx)/dist2*speed_core
                        ny = cy + (py2-cy)/dist2*speed_core
                        cur.execute(f"UPDATE {S}.core_fleet SET pos_x=%s, pos_y=%s, updated_at=NOW() WHERE id=%s",
                                    (nx, ny, cf_id))
                    else:
                        # Ядро уничтожает пиратов мгновенно
                        expires = now + datetime.timedelta(hours=2)
                        wm = random.randint(500,1500)*3
                        we = random.randint(300,1000)*3
                        wc = random.randint(200,600)*3
                        wf = random.randint(200,500)*3
                        cur.execute(f"""
                            INSERT INTO {S}.pirate_wrecks (pos_x, pos_y, metal, energy, crystals, fuel, expires_at)
                            VALUES (%s,%s,%s,%s,%s,%s,%s)
                        """, (px2, py2, wm, we, wc, wf, expires))
                        cur.execute(f"""
                            UPDATE {S}.pirate_fleets
                            SET status='wrecked', target_player_id=NULL, updated_at=NOW()
                            WHERE id=%s
                        """, (pid2,))
                        notify(cur, tgt_pid, 'core_help',
                               '👑 Стражи Ядра спасли вас!',
                               f'Золотой флот Ядра уничтожил пиратов! Обломки остались на поле боя. '
                               f'Соберите трофеи: ⛏️{wm} ⚡{we} 💎{wc} ⛽{wf}',
                               {'pos_x':px2,'pos_y':py2,'wm':wm,'we':we,'wc':wc,'wf':wf})
                        cur.execute(f"""
                            UPDATE {S}.core_fleet
                            SET status='returning', target_player_id=NULL, updated_at=NOW()
                            WHERE id=%s
                        """, (cf_id,))
                else:
                    # Пиратов нет — возвращаемся
                    cur.execute(f"UPDATE {S}.core_fleet SET status='returning', target_player_id=NULL, updated_at=NOW() WHERE id=%s", (cf_id,))

            # Возвращение Ядра домой
            cur.execute(f"SELECT id, pos_x, pos_y FROM {S}.core_fleet WHERE status='returning' LIMIT 1")
            cf_ret = cur.fetchone()
            if cf_ret:
                cf_id, cx, cy = cf_ret; cx, cy = float(cx), float(cy)
                home_cx, home_cy = 1200.0, 1200.0
                dist_home = math.sqrt((home_cx-cx)**2 + (home_cy-cy)**2)
                if dist_home > 40:
                    nx = cx + (home_cx-cx)/dist_home*40
                    ny = cy + (home_cy-cy)/dist_home*40
                    cur.execute(f"UPDATE {S}.core_fleet SET pos_x=%s, pos_y=%s, updated_at=NOW() WHERE id=%s", (nx, ny, cf_id))
                else:
                    cur.execute(f"UPDATE {S}.core_fleet SET pos_x=1200, pos_y=1200, status='guarding', updated_at=NOW() WHERE id=%s", (cf_id,))

            # Восстановление wrecked пиратов
            cur.execute(f"""
                UPDATE {S}.pirate_fleets
                SET status='patrol', updated_at=NOW()
                WHERE status='wrecked'
                  AND updated_at < NOW() - INTERVAL '5 minutes'
            """)

            conn.commit()
            return ok({'ticked': True})

        return err('Неизвестное действие', 404)

    finally:
        cur.close()
        conn.close()