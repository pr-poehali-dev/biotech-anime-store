"""
Галактическая Империя — ИИ-система (пираты + ядро).
GET  action=tick            — главный тик: пираты строят флот, атакуют, ядро защищает
GET  action=my_events       — оповещения игрока (атаки пиратов, помощь ядра)
POST action=read_events     — отметить события прочитанными
GET  action=pirates         — все активные пиратские флоты (для карты)
GET  action=wrecks          — обломки на карте
POST action=salvage {wreck_id} — собрать обломки
GET  action=core_status     — статус союза с ядром ИИ
POST action=core_ally       — запросить союз с ядром ИИ
POST action=core_break      — разорвать союз с ядром
"""
import json, os, psycopg2, datetime, random, math

S = os.environ.get('MAIN_DB_SCHEMA', 't_p83915249_biotech_anime_store')

# Корабли пиратов — те же типы что у игроков + названия
PIRATE_SHIPS = {
    'scout':       {'atk': 8,   'def': 5,   'name': 'Разведчик'},
    'fighter':     {'atk': 20,  'def': 15,  'name': 'Истребитель'},
    'cruiser':     {'atk': 55,  'def': 45,  'name': 'Крейсер'},
    'battleship':  {'atk': 140, 'def': 110, 'name': 'Линкор'},
    'dreadnought': {'atk': 350, 'def': 280, 'name': 'Дредноут'},
    'stealth':     {'atk': 80,  'def': 30,  'name': 'Невидимка'},
    'carrier':     {'atk': 200, 'def': 350, 'name': 'Авианосец'},
}

# Флот золотого ядра ИИ (всегда у него есть)
CORE_FLEET = {
    'dreadnought': 5,
    'battleship':  8,
    'carrier':     3,
    'cruiser':     10,
}
CORE_ATK = sum(PIRATE_SHIPS[s]['atk'] * n for s, n in CORE_FLEET.items())
CORE_DEF = sum(PIRATE_SHIPS[s]['def'] * n for s, n in CORE_FLEET.items())

# Технологии пиратов (повышают атаку/защиту)
PIRATE_TECH_BONUS = {1: 1.0, 2: 1.15, 3: 1.30, 4: 1.50, 5: 1.75}

# Корабли которых может построить пират за тик (зависит от tier)
BUILD_BY_TIER = {
    1: {'fighter': 2, 'scout': 1},
    2: {'fighter': 3, 'cruiser': 1},
    3: {'cruiser': 2, 'fighter': 2},
    4: {'cruiser': 2, 'battleship': 1},
    5: {'battleship': 2, 'stealth': 1},
    6: {'battleship': 2, 'dreadnought': 1},
    7: {'dreadnought': 2, 'carrier': 1},
    8: {'dreadnought': 2, 'carrier': 2},
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
        SELECT id, nickname, race, score, alliance_id,
               colonies_count, total_fleet_power, is_online, metal, energy, crystals, fuel
        FROM {S}.empire_players WHERE session_token=%s
    """, (token,))
    r = cur.fetchone()
    if not r:
        return None
    return {'id':r[0],'nickname':r[1],'race':r[2],'score':r[3],'alliance_id':r[4],
            'colonies_count':r[5],'fleet_power':r[6],'is_online':r[7],
            'metal':r[8],'energy':r[9],'crystals':r[10],'fuel':r[11]}

def fleet_power(ships):
    atk = sum(PIRATE_SHIPS.get(s, {}).get('atk', 0) * n for s, n in ships.items())
    df  = sum(PIRATE_SHIPS.get(s, {}).get('def', 0) * n for s, n in ships.items())
    return atk, df

def add_event(cur, player_id, event_type, message, data=None):
    cur.execute(f"""
        INSERT INTO {S}.ai_events (player_id, event_type, message, data)
        VALUES (%s, %s, %s, %s)
    """, (player_id, event_type, message, json.dumps(data or {})))

def handler(event: dict, context) -> dict:
    """ИИ-система: пираты атакуют игроков, ядро защищает союзников."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    body = {}
    if event.get('body'):
        body = json.loads(event['body'])
    action = body.get('action') if method == 'POST' else params.get('action', 'pirates')
    token  = get_token(event)

    conn = db()
    cur  = conn.cursor()

    try:
        player = get_player(cur, token) if token else None

        # ── МОИ ОПОВЕЩЕНИЯ ───────────────────────────────────────────────────
        if action == 'my_events':
            if not player:
                return err('Не авторизован', 401)
            cur.execute(f"""
                SELECT id, event_type, message, data, is_read, created_at
                FROM {S}.ai_events
                WHERE player_id=%s ORDER BY created_at DESC LIMIT 30
            """, (player['id'],))
            events = [{'id':r[0],'type':r[1],'message':r[2],'data':r[3],
                       'read':r[4],'date':str(r[5])} for r in cur.fetchall()]
            unread = sum(1 for e in events if not e['read'])
            return ok({'events': events, 'unread': unread})

        # ── ПРОЧИТАТЬ СОБЫТИЯ ────────────────────────────────────────────────
        if action == 'read_events' and method == 'POST':
            if not player:
                return err('Не авторизован', 401)
            cur.execute(f"UPDATE {S}.ai_events SET is_read=true WHERE player_id=%s AND is_read=false",
                        (player['id'],))
            conn.commit()
            return ok({'done': True})

        # ── ПИРАТСКИЕ ФЛОТЫ (для карты) ──────────────────────────────────────
        if action == 'pirates':
            cur.execute(f"""
                SELECT id, name, tier, ships, total_attack, total_defense,
                       pos_x, pos_y, status, target_player_id, tech_level
                FROM {S}.pirate_fleets WHERE status != 'wrecked'
                ORDER BY tier DESC
            """)
            pirates = [{'id':r[0],'name':r[1],'tier':r[2],'ships':r[3],
                        'atk':r[4],'def':r[5],'x':r[6],'y':r[7],
                        'status':r[8],'target':r[9],'tech':r[10]}
                       for r in cur.fetchall()]
            return ok({'pirates': pirates})

        # ── ОБЛОМКИ ──────────────────────────────────────────────────────────
        if action == 'wrecks':
            cur.execute(f"""
                SELECT id, pos_x, pos_y, metal, energy, crystals, fuel
                FROM {S}.wrecks
                WHERE salvaged_by IS NULL AND expires_at > NOW()
                ORDER BY created_at DESC
            """)
            wrecks = [{'id':r[0],'x':r[1],'y':r[2],'metal':r[3],
                       'energy':r[4],'crystals':r[5],'fuel':r[6]}
                      for r in cur.fetchall()]
            return ok({'wrecks': wrecks})

        # ── СОБРАТЬ ОБЛОМКИ ──────────────────────────────────────────────────
        if action == 'salvage' and method == 'POST':
            if not player:
                return err('Не авторизован', 401)
            wreck_id = body.get('wreck_id')
            if not wreck_id:
                return err('Укажите wreck_id')
            cur.execute(f"""
                SELECT id, metal, energy, crystals, fuel, salvaged_by, expires_at
                FROM {S}.wrecks WHERE id=%s
            """, (wreck_id,))
            w = cur.fetchone()
            if not w:
                return err('Обломки не найдены')
            if w[5]:
                return err('Обломки уже собраны')
            if w[6] < datetime.datetime.now(datetime.timezone.utc):
                return err('Обломки рассыпались')
            cur.execute(f"""
                UPDATE {S}.empire_players
                SET metal=metal+%s, energy=energy+%s, crystals=crystals+%s, fuel=fuel+%s
                WHERE id=%s
            """, (w[1], w[2], w[3], w[4], player['id']))
            cur.execute(f"UPDATE {S}.wrecks SET salvaged_by=%s WHERE id=%s",
                        (player['id'], wreck_id))
            conn.commit()
            return ok({'salvaged': True, 'metal':w[1], 'energy':w[2],
                       'crystals':w[3], 'fuel':w[4]})

        # ── СТАТУС СОЮЗА С ЯДРОМ ─────────────────────────────────────────────
        if action == 'core_status':
            if not player:
                return err('Не авторизован', 401)
            cur.execute(f"SELECT status, core_fleet_active FROM {S}.core_diplomacy WHERE player_id=%s",
                        (player['id'],))
            row = cur.fetchone()
            status = row[0] if row else 'none'
            active = row[1] if row else False
            return ok({'status': status, 'core_fleet_active': active,
                       'core_fleet': CORE_FLEET,
                       'core_atk': CORE_ATK, 'core_def': CORE_DEF})

        # ── ЗАПРОСИТЬ СОЮЗ С ЯДРОМ ───────────────────────────────────────────
        if action == 'core_ally' and method == 'POST':
            if not player:
                return err('Не авторизован', 401)
            # Союз с ядром недоступен если игрок в альянсе с другими игроками
            if player['alliance_id']:
                return err('Ядро ИИ не вступает в союз с членами альянсов. Покиньте альянс.')
            cur.execute(f"""
                INSERT INTO {S}.core_diplomacy (player_id, status)
                VALUES (%s, 'allied')
                ON CONFLICT (player_id) DO UPDATE SET status='allied', updated_at=NOW()
            """, (player['id'],))
            add_event(cur, player['id'], 'core_help',
                '🤖 Ядро Галактики приняло ваш запрос союза. Золотой флот готов защищать вас.')
            conn.commit()
            return ok({'allied': True, 'message': 'Союз с Ядром Галактики установлен!'})

        # ── РАЗОРВАТЬ СОЮЗ С ЯДРОМ ───────────────────────────────────────────
        if action == 'core_break' and method == 'POST':
            if not player:
                return err('Не авторизован', 401)
            cur.execute(f"""
                INSERT INTO {S}.core_diplomacy (player_id, status)
                VALUES (%s, 'none')
                ON CONFLICT (player_id) DO UPDATE SET status='none', core_fleet_active=false, updated_at=NOW()
            """, (player['id'],))
            conn.commit()
            return ok({'done': True})

        # ── ГЛАВНЫЙ ТИК ИИ ───────────────────────────────────────────────────
        if action == 'tick':
            now = datetime.datetime.now(datetime.timezone.utc)
            results = {'pirates_built': 0, 'attacks': [], 'core_helps': [], 'wrecks_created': 0}

            # 1. Пираты строят корабли (раз в 5 минут)
            cur.execute(f"""
                SELECT id, tier, ships, total_attack, total_defense, tech_level, last_action_at
                FROM {S}.pirate_fleets WHERE status='idle'
            """)
            idle_pirates = cur.fetchall()

            for pf in idle_pirates:
                pid, tier, ships, atk, dfe, tech, last_act = pf
                ships = ships or {}
                mins_since = (now - last_act).total_seconds() / 60
                if mins_since < 5:
                    continue
                # Строим корабли по тиру
                new_ships = BUILD_BY_TIER.get(min(tier, 8), {})
                for stype, cnt in new_ships.items():
                    ships[stype] = ships.get(stype, 0) + cnt
                # Повышаем технологии пиратов раз в 20 минут
                if mins_since > 20 and tech < 5:
                    tech = min(5, tech + 1)
                # Пересчитываем силу с бонусом технологий
                tech_mult = PIRATE_TECH_BONUS.get(tech, 1.0)
                new_atk, new_def = fleet_power(ships)
                new_atk = int(new_atk * tech_mult)
                new_def = int(new_def * tech_mult)
                cur.execute(f"""
                    UPDATE {S}.pirate_fleets
                    SET ships=%s::jsonb, total_attack=%s, total_defense=%s,
                        tech_level=%s, last_action_at=%s
                    WHERE id=%s
                """, (json.dumps(ships), new_atk, new_def, tech, now, pid))
                results['pirates_built'] += 1

            # 2. Пираты атакуют подходящих игроков
            # Условия: игрок онлайн + имеет колонию + имеет боевой флот
            cur.execute(f"""
                SELECT p.id, p.nickname, p.score, p.metal, p.energy, p.crystals,
                       ep.id as planet_id, ep.pos_x, ep.pos_y, ep.name
                FROM {S}.empire_players p
                JOIN {S}.empire_colonies ec ON ec.player_id = p.id
                JOIN {S}.empire_planets ep ON ep.id = ec.planet_id AND ep.owner_id = p.id
                JOIN {S}.empire_fleets ef ON ef.owner_id = p.id AND ef.total_attack > 0
                WHERE p.is_online = true
                  AND p.last_seen_at > NOW() - INTERVAL '15 minutes'
                  AND p.colonies_count > 0
                GROUP BY p.id, p.nickname, p.score, p.metal, p.energy, p.crystals,
                         ep.id, ep.pos_x, ep.pos_y, ep.name
                ORDER BY RANDOM() LIMIT 5
            """)
            online_targets = cur.fetchall()

            # Свободные пираты которые давно не атаковали (>10 минут)
            cur.execute(f"""
                SELECT id, name, tier, ships, total_attack, total_defense, pos_x, pos_y, tech_level
                FROM {S}.pirate_fleets
                WHERE status='idle'
                  AND last_action_at < NOW() - INTERVAL '10 minutes'
                ORDER BY tier
            """)
            free_pirates = cur.fetchall()

            for target in online_targets:
                if not free_pirates:
                    break
                tid, tnick, tscore, tmetal, tenergy, tcrystals, tplanet_id, tpx, tpy, tpname = target

                # Выбираем пирата подходящего уровня (не слишком сильного)
                pirate = free_pirates.pop(0)
                ppid, ppname, pptier, ppships, ppatk, ppdef, ppx, ppy, pptech = pirate

                # Боёвка
                # Получаем суммарный флот игрока
                cur.execute(f"""
                    SELECT COALESCE(SUM(total_attack),0), COALESCE(SUM(total_defense),0)
                    FROM {S}.empire_fleets WHERE owner_id=%s
                """, (tid,))
                player_atk, player_def = cur.fetchone()

                pirate_wins = ppatk > player_def * 0.6  # пират побеждает при достаточной атаке

                if pirate_wins:
                    # Пират побеждает — грабит ресурсы
                    loot_metal    = min(int(tmetal * 0.1),    1000)
                    loot_energy   = min(int(tenergy * 0.1),   800)
                    loot_crystals = min(int(tcrystals * 0.1), 400)

                    add_event(cur, tid, 'pirate_attack',
                        f'🏴‍☠️ АТАКА! {ppname} (Тир {pptier}) напал на вашу колонию «{tpname}» и забрал ресурсы!',
                        {'pirate': ppname, 'tier': pptier, 'loot_metal': loot_metal,
                         'loot_energy': loot_energy, 'loot_crystals': loot_crystals,
                         'result': 'player_lost'})

                    cur.execute(f"""
                        UPDATE {S}.empire_players
                        SET metal=GREATEST(0,metal-%s), energy=GREATEST(0,energy-%s),
                            crystals=GREATEST(0,crystals-%s)
                        WHERE id=%s
                    """, (loot_metal, loot_energy, loot_crystals, tid))

                    # Пират отступает после грабежа
                    cur.execute(f"""
                        UPDATE {S}.pirate_fleets
                        SET status='retreating', target_player_id=%s,
                            target_planet_id=%s, last_action_at=%s
                        WHERE id=%s
                    """, (tid, tplanet_id, now, ppid))
                    results['attacks'].append({'pirate': ppname, 'target': tnick, 'result': 'pirate_won'})

                else:
                    # Игрок побеждает — пират становится обломками
                    add_event(cur, tid, 'pirate_attack',
                        f'⚔️ Пираты {ppname} атаковали «{tpname}»! Вы отразили атаку. Обломки можно собрать!',
                        {'pirate': ppname, 'tier': pptier, 'result': 'player_won'})

                    # Создаём обломки
                    wreck_metal    = ppatk * 3 + pptier * 200
                    wreck_energy   = ppdef * 2 + pptier * 150
                    wreck_crystals = pptier * 100
                    wreck_fuel     = pptier * 50

                    cur.execute(f"""
                        INSERT INTO {S}.wrecks (pos_x, pos_y, metal, energy, crystals, fuel)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """, (tpx + random.randint(-30,30), tpy + random.randint(-30,30),
                          wreck_metal, wreck_energy, wreck_crystals, wreck_fuel))
                    results['wrecks_created'] += 1

                    # Пиратский флот уничтожен — восстановится через 30 минут
                    cur.execute(f"""
                        UPDATE {S}.pirate_fleets
                        SET status='wrecked', target_player_id=%s,
                            wreck_metal=%s, wreck_energy=%s, wreck_crystals=%s,
                            last_action_at=%s
                        WHERE id=%s
                    """, (tid, wreck_metal, wreck_energy, wreck_crystals, now, ppid))
                    results['attacks'].append({'pirate': ppname, 'target': tnick, 'result': 'player_won'})

            # 3. Восстановление уничтоженных пиратских флотов (через 30 минут)
            cur.execute(f"""
                UPDATE {S}.pirate_fleets
                SET status='idle',
                    ships = CASE
                      WHEN tier <= 2 THEN '{{"fighter":2,"scout":1}}'::jsonb
                      WHEN tier <= 4 THEN '{{"cruiser":2,"fighter":3}}'::jsonb
                      ELSE '{{"battleship":2,"cruiser":3}}'::jsonb
                    END,
                    target_player_id = NULL,
                    target_planet_id = NULL,
                    last_action_at = NOW()
                WHERE status='wrecked'
                  AND last_action_at < NOW() - INTERVAL '30 minutes'
            """)

            # 4. Отступившие пираты возвращаются в режим idle
            cur.execute(f"""
                UPDATE {S}.pirate_fleets
                SET status='idle', target_player_id=NULL, last_action_at=NOW()
                WHERE status='retreating'
                  AND last_action_at < NOW() - INTERVAL '5 minutes'
            """)

            # 5. Ядро ИИ защищает союзников (только если союзник один и не в альянсе)
            cur.execute(f"""
                SELECT cd.player_id, p.nickname, p.alliance_id
                FROM {S}.core_diplomacy cd
                JOIN {S}.empire_players p ON p.id = cd.player_id
                WHERE cd.status = 'allied' AND p.alliance_id IS NULL
            """)
            allied_players = cur.fetchall()

            for ap in allied_players:
                ap_id, ap_nick, _ = ap
                # Проверяем — есть ли атаки на этого игрока
                cur.execute(f"""
                    SELECT id FROM {S}.ai_events
                    WHERE player_id=%s AND event_type='pirate_attack'
                      AND is_read=false AND created_at > NOW() - INTERVAL '1 hour'
                    LIMIT 1
                """, (ap_id,))
                attack_evt = cur.fetchone()
                if not attack_evt:
                    continue

                # Ядро выдвигается на помощь
                cur.execute(f"""
                    UPDATE {S}.core_diplomacy SET core_fleet_active=true, updated_at=NOW()
                    WHERE player_id=%s
                """, (ap_id,))

                add_event(cur, ap_id, 'core_help',
                    f'🌟 Золотой флот Ядра Галактики выдвинулся на защиту {ap_nick}! '
                    f'Пираты уничтожены. Сила флота: ⚔️{CORE_ATK} 🛡️{CORE_DEF}',
                    {'core_atk': CORE_ATK, 'core_def': CORE_DEF, 'fleet': CORE_FLEET})

                results['core_helps'].append(ap_nick)

                # Убираем активных пиратов нацеленных на этого игрока
                cur.execute(f"""
                    UPDATE {S}.pirate_fleets
                    SET status='retreating', last_action_at=NOW()
                    WHERE target_player_id=%s AND status IN ('idle','attacking')
                """, (ap_id,))

            # Через 10 минут флот ядра возвращается
            cur.execute(f"""
                UPDATE {S}.core_diplomacy SET core_fleet_active=false, updated_at=NOW()
                WHERE core_fleet_active=true AND updated_at < NOW() - INTERVAL '10 minutes'
            """)

            conn.commit()
            return ok({'ticked': True, 'results': results,
                       'timestamp': str(now)})

        return err('Неизвестное действие', 404)

    finally:
        cur.close()
        conn.close()
