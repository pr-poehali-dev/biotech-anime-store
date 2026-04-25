"""
Получение игрового состояния. Маршрутизация через ?action=...
action=planets — список всех планет
action=planet&planet_id=N — детали планеты
action=bases — базы текущего игрока
action=units — юниты текущего игрока
action=alliances — список альянсов
action=leaderboard — топ игроков
"""
import json
import os
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p83915249_biotech_anime_store')

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def cors():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    }

def ok(data):
    return {'statusCode': 200, 'headers': cors(), 'body': json.dumps(data, default=str)}

def err(msg, code=400):
    return {'statusCode': code, 'headers': cors(), 'body': json.dumps({'error': msg})}

def get_player(cur, token):
    if not token:
        return None
    cur.execute(f"SELECT id, nickname, faction, energy, gold, metal, crystal, bio_matter, score, alliance_id, planet_id, pos_x, pos_y FROM {SCHEMA}.players WHERE session_token=%s", (token,))
    row = cur.fetchone()
    if not row:
        return None
    return {'id': row[0], 'nickname': row[1], 'faction': row[2], 'energy': row[3],
            'gold': row[4], 'metal': row[5], 'crystal': row[6], 'bio_matter': row[7],
            'score': row[8], 'alliance_id': row[9], 'planet_id': row[10], 'pos_x': row[11], 'pos_y': row[12]}

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
    params = event.get('queryStringParameters') or {}
    action = params.get('action', 'planets')

    conn = get_conn()
    cur = conn.cursor()

    try:
        player = get_player(cur, token)

        if action == 'planets':
            cur.execute(f"""
                SELECT p.id, p.name, p.type, p.pos_x, p.pos_y, p.size, p.biome, p.monster_density,
                       p.resource_multiplier, p.controlling_alliance_id, a.name as alliance_name,
                       COUNT(DISTINCT b.id) as bases_count,
                       COUNT(DISTINCT sp.id) as spaceports_count
                FROM {SCHEMA}.planets p
                LEFT JOIN {SCHEMA}.alliances a ON a.id = p.controlling_alliance_id
                LEFT JOIN {SCHEMA}.bases b ON b.planet_id = p.id AND b.is_deployed = true
                LEFT JOIN {SCHEMA}.spaceports sp ON sp.planet_id = p.id
                GROUP BY p.id, a.name
                ORDER BY p.id
            """)
            planets = []
            for r in cur.fetchall():
                planets.append({
                    'id': r[0], 'name': r[1], 'type': r[2], 'pos_x': r[3], 'pos_y': r[4],
                    'size': r[5], 'biome': r[6], 'monster_density': r[7], 'resource_multiplier': float(r[8]),
                    'controlling_alliance_id': r[9], 'alliance_name': r[10],
                    'bases_count': r[11], 'spaceports_count': r[12]
                })
            return ok({'planets': planets})

        if action == 'planet':
            planet_id = params.get('planet_id')
            if not planet_id:
                return err('planet_id required')
            cur.execute(f"SELECT id, name, type, pos_x, pos_y, size, biome, monster_density, resource_multiplier, controlling_alliance_id FROM {SCHEMA}.planets WHERE id=%s", (planet_id,))
            p = cur.fetchone()
            if not p:
                return err('Планета не найдена', 404)
            cur.execute(f"""SELECT b.id, b.name, b.level, b.is_deployed, b.pos_x, b.pos_y, b.hp, b.max_hp,
                               b.commander_level, b.defenses, pl.nickname, pl.faction
                           FROM {SCHEMA}.bases b
                           JOIN {SCHEMA}.players pl ON pl.id = b.owner_id
                           WHERE b.planet_id=%s AND b.is_deployed=true""", (planet_id,))
            bases = [{'id': b[0], 'name': b[1], 'level': b[2], 'is_deployed': b[3],
                      'pos_x': float(b[4]), 'pos_y': float(b[5]), 'hp': b[6], 'max_hp': b[7],
                      'commander_level': b[8], 'defenses': b[9], 'owner': b[10], 'faction': b[11]} for b in cur.fetchall()]
            cur.execute(f"SELECT id, nickname, faction, pos_x, pos_y, score FROM {SCHEMA}.players WHERE planet_id=%s", (planet_id,))
            players_on = [{'id': r[0], 'nickname': r[1], 'faction': r[2], 'pos_x': float(r[3]), 'pos_y': float(r[4]), 'score': r[5]} for r in cur.fetchall()]
            return ok({'planet': {'id': p[0], 'name': p[1], 'type': p[2], 'pos_x': p[3], 'pos_y': p[4],
                                  'size': p[5], 'biome': p[6], 'monster_density': p[7],
                                  'resource_multiplier': float(p[8]), 'controlling_alliance_id': p[9]},
                       'bases': bases, 'players': players_on})

        if action == 'bases':
            if not player:
                return err('Не авторизован', 401)
            cur.execute(f"""SELECT id, name, level, is_deployed, pos_x, pos_y, hp, max_hp,
                               commander_level, commander_implants, defenses, production_queue, planet_id
                           FROM {SCHEMA}.bases WHERE owner_id=%s""", (player['id'],))
            bases = [{'id': b[0], 'name': b[1], 'level': b[2], 'is_deployed': b[3],
                      'pos_x': float(b[4]), 'pos_y': float(b[5]), 'hp': b[6], 'max_hp': b[7],
                      'commander_level': b[8], 'commander_implants': b[9],
                      'defenses': b[10], 'production_queue': b[11], 'planet_id': b[12]} for b in cur.fetchall()]
            return ok({'bases': bases})

        if action == 'units':
            if not player:
                return err('Не авторизован', 401)
            cur.execute(f"""SELECT id, type, specialization, level, implants, weapon, hp, max_hp,
                               attack_power, defense_power, pos_x, pos_y, is_alive, base_id, planet_id
                           FROM {SCHEMA}.units WHERE owner_id=%s AND is_alive=true""", (player['id'],))
            units = [{'id': u[0], 'type': u[1], 'specialization': u[2], 'level': u[3],
                      'implants': u[4], 'weapon': u[5], 'hp': u[6], 'max_hp': u[7],
                      'attack': u[8], 'defense': u[9], 'pos_x': float(u[10]), 'pos_y': float(u[11]),
                      'is_alive': u[12], 'base_id': u[13], 'planet_id': u[14]} for u in cur.fetchall()]
            return ok({'units': units})

        if action == 'alliances':
            cur.execute(f"""SELECT a.id, a.name, a.faction, a.emblem, a.description, a.gold, a.metal, a.crystal,
                               COUNT(p.id) as members, a.leader_id, pl.nickname as leader_name
                           FROM {SCHEMA}.alliances a
                           LEFT JOIN {SCHEMA}.players p ON p.alliance_id = a.id
                           LEFT JOIN {SCHEMA}.players pl ON pl.id = a.leader_id
                           GROUP BY a.id, pl.nickname ORDER BY a.id""")
            alliances = [{'id': r[0], 'name': r[1], 'faction': r[2], 'emblem': r[3],
                          'description': r[4], 'gold': r[5], 'metal': r[6], 'crystal': r[7],
                          'members': r[8], 'leader_id': r[9], 'leader_name': r[10]} for r in cur.fetchall()]
            return ok({'alliances': alliances})

        if action == 'leaderboard':
            cur.execute(f"""SELECT p.id, p.nickname, p.faction, p.score, a.name as alliance
                           FROM {SCHEMA}.players p
                           LEFT JOIN {SCHEMA}.alliances a ON a.id = p.alliance_id
                           ORDER BY p.score DESC LIMIT 50""")
            return ok({'leaderboard': [{'id': r[0], 'nickname': r[1], 'faction': r[2], 'score': r[3], 'alliance': r[4]} for r in cur.fetchall()]})

        return err('Unknown action', 404)

    finally:
        cur.close()
        conn.close()
