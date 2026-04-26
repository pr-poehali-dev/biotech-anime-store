"""
Империя Космоса — Боевая система.
POST action=attack       {fleet_id, planet_id} — атаковать планету
POST action=colonize     {fleet_id, planet_id} — колонизировать пустую планету
GET  action=battle_reports&page=N — мои боевые отчёты
POST action=check_fleets — проверить прилетевшие флоты и провести бои
"""
import json, os, psycopg2, random

S = os.environ.get('MAIN_DB_SCHEMA', 't_p83915249_biotech_anime_store')

SHIPS = {
    'scout':      {'atk':8,   'def':5,   'hp':60},
    'fighter':    {'atk':20,  'def':15,  'hp':120},
    'cruiser':    {'atk':55,  'def':45,  'hp':350},
    'battleship': {'atk':140, 'def':110, 'hp':900},
    'dreadnought':{'atk':350, 'def':280, 'hp':2200},
    'titan':      {'atk':900, 'def':750, 'hp':6000},
    'carrier':    {'atk':200, 'def':350, 'hp':1800},
    'stealth':    {'atk':80,  'def':30,  'hp':400},
}

AI_SHIPS_BY_TIER = {
    0: {'scout': 2, 'fighter': 2},
    1: {'scout': 3, 'fighter': 5},
    2: {'fighter': 5, 'cruiser': 3},
    3: {'cruiser': 4, 'battleship': 3},
    4: {'battleship': 5, 'dreadnought': 3},
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
        SELECT id, nickname, race, metal, energy, crystals, fuel, dark_matter, score,
               battles_won, battles_lost, planets_conquered
        FROM {S}.empire_players WHERE session_token=%s
    """, (token,))
    r = cur.fetchone()
    if not r:
        return None
    return {'id':r[0],'nickname':r[1],'race':r[2],'metal':r[3],'energy':r[4],
            'crystals':r[5],'fuel':r[6],'dark_matter':r[7],'score':r[8],
            'battles_won':r[9],'battles_lost':r[10],'planets_conquered':r[11]}

def calc_power(ships_dict):
    atk = sum(SHIPS.get(st, {}).get('atk', 0) * n for st, n in ships_dict.items())
    deff = sum(SHIPS.get(st, {}).get('def', 0) * n for st, n in ships_dict.items())
    return atk, deff

def apply_tech_bonuses(cur, player_id, atk, deff):
    cur.execute(f"SELECT tech_id, level FROM {S}.empire_techs WHERE player_id=%s", (player_id,))
    techs = {r[0]: r[1] for r in cur.fetchall()}
    if 'plasma_cannons' in techs:
        atk  *= (1 + techs['plasma_cannons'] * 0.15)
    if 'ion_shields' in techs:
        deff *= (1 + techs['ion_shields'] * 0.15)
    if 'dark_matter_weapon' in techs:
        atk  *= (1 + techs['dark_matter_weapon'] * 0.50)
    if 'ancient_tech' in techs:
        atk  *= (1 + techs['ancient_tech'] * 0.40)
        deff *= (1 + techs['ancient_tech'] * 0.40)
    return atk, deff

def simulate_battle(atk_ships, def_ships, atk_bonus=1.0, def_bonus=1.0):
    atk_total_atk, atk_total_def = calc_power(atk_ships)
    def_total_atk, def_total_def = calc_power(def_ships)
    atk_total_atk *= atk_bonus
    atk_total_def *= atk_bonus
    def_total_atk *= def_bonus
    def_total_def *= def_bonus

    roll = random.uniform(0.85, 1.15)
    attacker_score = (atk_total_atk * 0.65 + atk_total_def * 0.35) * roll
    defender_score = (def_total_atk * 0.65 + def_total_def * 0.35)

    attacker_wins = attacker_score > defender_score
    log = [
        f"Атакующий: ATK={int(atk_total_atk)} DEF={int(atk_total_def)} → Сила={int(attacker_score)}",
        f"Защитник:  ATK={int(def_total_atk)} DEF={int(def_total_def)} → Сила={int(defender_score)}",
    ]

    if attacker_wins:
        ratio = min(0.9, max(0.1, defender_score / attacker_score))
        atk_losses  = {st: max(0, int(n * ratio * 0.5)) for st, n in atk_ships.items()}
        def_losses  = {st: n for st, n in def_ships.items()}
        log.append(f"✅ Атакующий ПОБЕДИЛ! Потери: {sum(atk_losses.values())} кор.")
    else:
        ratio = min(0.95, max(0.3, attacker_score / defender_score))
        atk_losses  = {st: max(0, int(n * ratio * 0.7)) for st, n in atk_ships.items()}
        def_losses  = {st: max(0, int(n * ratio * 0.3)) for st, n in def_ships.items()}
        log.append(f"❌ Атакующий ПРОИГРАЛ! Потери: {sum(atk_losses.values())} кор.")

    return attacker_wins, atk_losses, def_losses, log

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    body = {}
    if event.get('body'):
        body = json.loads(event['body'])
    action = body.get('action') if method == 'POST' else params.get('action', 'battle_reports')
    token = get_token(event)

    conn = db()
    cur = conn.cursor()

    try:
        player = get_player(cur, token) if token else None

        # ── АТАКА ПЛАНЕТЫ ───────────────────────────────────────────────────────
        if action == 'attack' and method == 'POST':
            if not player:
                return err('Не авторизован', 401)
            fleet_id = body.get('fleet_id')
            planet_id = body.get('planet_id')

            # Проверяем флот
            cur.execute(f"SELECT id, ships, total_attack, total_defense, current_planet_id, status FROM {S}.empire_fleets WHERE id=%s AND owner_id=%s", (fleet_id, player['id']))
            fleet = cur.fetchone()
            if not fleet:
                return err('Флот не найден')
            if fleet[5] != 'orbit':
                return err('Флот не на орбите')
            if fleet[4] != int(planet_id):
                return err('Флот не на орбите этой планеты')

            atk_ships = fleet[1] or {}
            if not atk_ships or sum(atk_ships.values()) == 0:
                return err('Флот пуст')

            # Получаем планету
            cur.execute(f"""
                SELECT id, owner_id, is_ai_controlled, ai_fleet_tier, ai_ships,
                       metal_richness, energy_richness, crystal_richness
                FROM {S}.empire_planets WHERE id=%s
            """, (planet_id,))
            planet = cur.fetchone()
            if not planet:
                return err('Планета не найдена')

            if planet[1] == player['id']:
                return err('Нельзя атаковать свою планету')

            # Определяем защитников
            if planet[2]:  # ИИ
                tier = planet[3]
                def_ships = AI_SHIPS_BY_TIER.get(tier, AI_SHIPS_BY_TIER[0]).copy()
                def_ships.update(planet[4] or {})
                def_bonus = 1.2  # ИИ немного сильнее в обороне
                atk_bonus = 1.0
            else:
                # Флоты владельца на орбите
                cur.execute(f"""
                    SELECT ships FROM {S}.empire_fleets
                    WHERE current_planet_id=%s AND owner_id=%s AND status='orbit'
                """, (planet_id, planet[1]))
                def_fleet_rows = cur.fetchall()
                def_ships = {}
                for df_row in def_fleet_rows:
                    for st, cnt in (df_row[0] or {}).items():
                        def_ships[st] = def_ships.get(st, 0) + cnt
                if not def_ships:
                    def_ships = {'fighter': 2}
                def_bonus = 1.0
                atk_bonus = 1.0

            # Применяем технологии
            p_atk, p_def = calc_power(atk_ships)
            p_atk, p_def = apply_tech_bonuses(cur, player['id'], p_atk, p_def)
            atk_bonus *= p_atk / max(1, sum(SHIPS.get(st, {}).get('atk', 0) * n for st, n in atk_ships.items()))

            attacker_wins, atk_losses, def_losses, log = simulate_battle(atk_ships, def_ships, atk_bonus, def_bonus)

            # Считаем оставшиеся корабли
            surviving_atk = {st: max(0, n - atk_losses.get(st, 0)) for st, n in atk_ships.items()}
            surviving_def = {st: max(0, n - def_losses.get(st, 0)) for st, n in def_ships.items()}

            looted = {}
            if attacker_wins:
                # Грабим ресурсы
                loot_pct = 0.3 if planet[2] else 0.2
                looted = {
                    'metal':    int(2000 * planet[5] * loot_pct),
                    'energy':   int(1500 * planet[6] * loot_pct),
                    'crystals': int(800  * planet[7] * loot_pct),
                }
                cur.execute(f"""
                    UPDATE {S}.empire_players
                    SET metal=metal+%s, energy=energy+%s, crystals=crystals+%s,
                        score=score+%s, battles_won=battles_won+1
                    WHERE id=%s
                """, (looted['metal'], looted['energy'], looted['crystals'],
                      500 + planet[3] * 200, player['id']))

                if planet[2]:  # ИИ-планета захвачена
                    log.append(f"🏴 Планета захвачена! Получено {looted}")
                    # Создаём новую колонию
                    cur.execute(f"""
                        INSERT INTO {S}.empire_colonies (player_id, planet_id, colony_name, mine_level, solar_level)
                        VALUES (%s,%s,%s,0,0) RETURNING id
                    """, (player['id'], planet_id, f'Колония-{planet_id}'))
                    col_id = cur.fetchone()[0]
                    cur.execute(f"""
                        UPDATE {S}.empire_planets
                        SET owner_id=%s, owner_race=%s, colony_id=%s, is_ai_controlled=false,
                            ai_ships=%s
                        WHERE id=%s
                    """, (player['id'], player['race'], col_id, json.dumps(surviving_def), planet_id))
                    cur.execute(f"""
                        UPDATE {S}.empire_players
                        SET colonies_count=colonies_count+1, planets_conquered=planets_conquered+1
                        WHERE id=%s
                    """, (player['id'],))
                else:
                    # Изгоняем флоты врага с орбиты
                    cur.execute(f"""
                        UPDATE {S}.empire_fleets SET ships=%s WHERE current_planet_id=%s AND owner_id=%s
                    """, (json.dumps(surviving_def), planet_id, planet[1]))
                    log.append(f"🏴 Вражеский флот разгромлен!")
            else:
                cur.execute(f"UPDATE {S}.empire_players SET battles_lost=battles_lost+1 WHERE id=%s", (player['id'],))
                if not planet[2]:
                    cur.execute(f"UPDATE {S}.empire_players SET battles_won=battles_won+1 WHERE id=%s", (planet[1],))

            # Обновляем потери атакующего флота
            new_fleet_ships = {st: max(0, n - atk_losses.get(st, 0)) for st, n in atk_ships.items()}
            new_fleet_ships = {k: v for k, v in new_fleet_ships.items() if v > 0}
            new_atk = sum(SHIPS.get(st, {}).get('atk', 0) * n for st, n in new_fleet_ships.items())
            new_def = sum(SHIPS.get(st, {}).get('def', 0) * n for st, n in new_fleet_ships.items())
            cur.execute(f"""
                UPDATE {S}.empire_fleets SET ships=%s, total_attack=%s, total_defense=%s
                WHERE id=%s
            """, (json.dumps(new_fleet_ships), new_atk, new_def, fleet_id))

            # Сохраняем боевой отчёт
            cur.execute(f"""
                INSERT INTO {S}.empire_battles
                  (attacker_id, defender_id, planet_id, attacker_ships, defender_ships,
                   attacker_losses, defender_losses, battle_result, battle_log, resources_looted)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, (player['id'], planet[1], planet_id,
                  json.dumps(atk_ships), json.dumps(def_ships),
                  json.dumps(atk_losses), json.dumps(def_losses),
                  'victory' if attacker_wins else 'defeat',
                  json.dumps(log), json.dumps(looted)))

            conn.commit()
            return ok({
                'result': 'victory' if attacker_wins else 'defeat',
                'log': log, 'looted': looted,
                'attacker_losses': atk_losses, 'defender_losses': def_losses,
                'surviving_ships': new_fleet_ships,
                'planet_conquered': attacker_wins and planet[2],
            })

        # ── КОЛОНИЗАЦИЯ ─────────────────────────────────────────────────────────
        if action == 'colonize' and method == 'POST':
            if not player:
                return err('Не авторизован', 401)
            fleet_id  = body.get('fleet_id')
            planet_id = body.get('planet_id')

            cur.execute(f"SELECT ships, current_planet_id, status FROM {S}.empire_fleets WHERE id=%s AND owner_id=%s", (fleet_id, player['id']))
            fleet = cur.fetchone()
            if not fleet or fleet[2] != 'orbit' or int(fleet[1]) != int(planet_id):
                return err('Флот не на орбите этой планеты')

            cur.execute(f"SELECT owner_id, is_ai_controlled, is_colonizable, ai_fleet_tier FROM {S}.empire_planets WHERE id=%s", (planet_id,))
            planet = cur.fetchone()
            if not planet:
                return err('Планета не найдена')
            if planet[0] is not None:
                return err('Планета уже занята')
            if not planet[2]:
                return err('Планета не колонизируема')
            if planet[3] > 0:
                return err('Сначала уничтожьте флот ИИ (используйте атаку)')

            # Нужны ресурсы и технология колонизации
            cur.execute(f"SELECT level FROM {S}.empire_techs WHERE player_id=%s AND tech_id='colonization'", (player['id'],))
            tech = cur.fetchone()
            col_limit = 1 + (tech[0] if tech else 0)
            cur.execute(f"SELECT COUNT(*) FROM {S}.empire_colonies WHERE player_id=%s", (player['id'],))
            cur_cols = cur.fetchone()[0]
            if cur_cols >= col_limit:
                return err(f'Достигнут лимит колоний ({col_limit}). Исследуйте технологию Колонизации!')

            col_cost = {'metal': 2000, 'energy': 1000, 'crystals': 500}
            for res, val in col_cost.items():
                if player.get(res, 0) < val:
                    return err(f'Нужно для колонизации: {col_cost}')

            cur.execute(f"UPDATE {S}.empire_players SET metal=metal-2000, energy=energy-1000, crystals=crystals-500 WHERE id=%s", (player['id'],))
            cur.execute(f"""
                INSERT INTO {S}.empire_colonies (player_id, planet_id, colony_name, mine_level, solar_level)
                VALUES (%s,%s,%s,1,1) RETURNING id
            """, (player['id'], planet_id, f'Колония {planet_id}'))
            col_id = cur.fetchone()[0]
            cur.execute(f"""
                UPDATE {S}.empire_planets SET owner_id=%s, owner_race=%s, colony_id=%s, is_ai_controlled=false
                WHERE id=%s
            """, (player['id'], player['race'], col_id, planet_id))
            cur.execute(f"UPDATE {S}.empire_players SET colonies_count=colonies_count+1 WHERE id=%s", (player['id'],))
            conn.commit()
            return ok({'colonized': True, 'colony_id': col_id, 'planet_id': planet_id})

        # ── БОЕВЫЕ ОТЧЁТЫ ───────────────────────────────────────────────────────
        if action == 'battle_reports':
            if not player:
                return err('Не авторизован', 401)
            page = int(params.get('page', 1))
            offset = (page - 1) * 20
            cur.execute(f"""
                SELECT b.id, b.battle_result, b.battle_log, b.resources_looted,
                       b.attacker_ships, b.defender_ships, b.attacker_losses, b.defender_losses,
                       b.planet_id, p.name, b.battle_at,
                       CASE WHEN b.attacker_id=%s THEN 'attacker' ELSE 'defender' END
                FROM {S}.empire_battles b
                LEFT JOIN {S}.empire_planets p ON p.id = b.planet_id
                WHERE b.attacker_id=%s OR b.defender_id=%s
                ORDER BY b.battle_at DESC LIMIT 20 OFFSET %s
            """, (player['id'], player['id'], player['id'], offset))
            cols_list = ['id','result','log','looted','atk_ships','def_ships','atk_losses','def_losses',
                    'planet_id','planet_name','battle_at','role']
            return ok({'reports': [dict(zip(cols_list, r)) for r in cur.fetchall()]})

        return err('Неизвестное действие', 404)

    finally:
        cur.close()
        conn.close()
