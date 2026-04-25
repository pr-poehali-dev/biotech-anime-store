"""
Игровое состояние + чат. Маршрутизация через ?action=...
GET  action=planets            — список всех планет
GET  action=planet&planet_id=N — детали планеты
GET  action=bases              — базы текущего игрока
GET  action=units              — юниты текущего игрока
GET  action=alliances          — список альянсов
GET  action=leaderboard        — топ игроков
GET  action=chat_global&since=N        — глобальный чат
GET  action=chat_alliance&since=N      — чат альянса
POST action=chat_send  {channel, message}  — отправить сообщение
"""
import json
import os
import re
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p83915249_biotech_anime_store')
MAX_MSG = 300
FACTION_EMOJI = {'human': '🧬', 'tech': '🤖', 'cyborg': '⚡'}

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
    cur.execute(
        f"SELECT id, nickname, faction, energy, gold, metal, crystal, bio_matter, score, alliance_id, planet_id, pos_x, pos_y FROM {SCHEMA}.players WHERE session_token=%s",
        (token,)
    )
    row = cur.fetchone()
    if not row:
        return None
    return {
        'id': row[0], 'nickname': row[1], 'faction': row[2], 'energy': row[3],
        'gold': row[4], 'metal': row[5], 'crystal': row[6], 'bio_matter': row[7],
        'score': row[8], 'alliance_id': row[9], 'planet_id': row[10],
        'pos_x': row[11], 'pos_y': row[12]
    }

def fmt_msg(row) -> dict:
    return {
        'id': row[0], 'player_id': row[1], 'nickname': row[2], 'faction': row[3],
        'faction_emoji': FACTION_EMOJI.get(row[3], '👤'),
        'message': row[4], 'msg_type': row[5], 'created_at': str(row[6]),
    }

def sanitize(text: str) -> str:
    return re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', text.strip()[:MAX_MSG])

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    method = event.get('httpMethod', 'GET')
    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
    params = event.get('queryStringParameters') or {}

    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            pass

    action = body.get('action') if method == 'POST' else None
    if not action:
        action = params.get('action', 'planets')

    conn = get_conn()
    cur = conn.cursor()

    try:
        player = get_player(cur, token)

        # ── Планеты ────────────────────────────────────────────────────
        if action == 'planets':
            cur.execute(f"""
                SELECT p.id, p.name, p.type, p.pos_x, p.pos_y, p.size, p.biome, p.monster_density,
                       p.resource_multiplier, p.controlling_alliance_id, a.name,
                       COUNT(DISTINCT b.id), COUNT(DISTINCT sp.id)
                FROM {SCHEMA}.planets p
                LEFT JOIN {SCHEMA}.alliances a ON a.id = p.controlling_alliance_id
                LEFT JOIN {SCHEMA}.bases b ON b.planet_id = p.id AND b.is_deployed = true
                LEFT JOIN {SCHEMA}.spaceports sp ON sp.planet_id = p.id
                GROUP BY p.id, a.name ORDER BY p.id
            """)
            return ok({'planets': [
                {'id': r[0], 'name': r[1], 'type': r[2], 'pos_x': r[3], 'pos_y': r[4],
                 'size': r[5], 'biome': r[6], 'monster_density': r[7],
                 'resource_multiplier': float(r[8]), 'controlling_alliance_id': r[9],
                 'alliance_name': r[10], 'bases_count': r[11], 'spaceports_count': r[12]}
                for r in cur.fetchall()
            ]})

        if action == 'planet':
            pid = params.get('planet_id')
            if not pid:
                return err('planet_id required')
            cur.execute(f"SELECT id,name,type,pos_x,pos_y,size,biome,monster_density,resource_multiplier,controlling_alliance_id FROM {SCHEMA}.planets WHERE id=%s", (pid,))
            p = cur.fetchone()
            if not p:
                return err('Планета не найдена', 404)
            cur.execute(f"""SELECT b.id,b.name,b.level,b.is_deployed,b.pos_x,b.pos_y,b.hp,b.max_hp,
                               b.commander_level,b.defenses,pl.nickname,pl.faction
                           FROM {SCHEMA}.bases b JOIN {SCHEMA}.players pl ON pl.id=b.owner_id
                           WHERE b.planet_id=%s AND b.is_deployed=true""", (pid,))
            bases = [{'id':b[0],'name':b[1],'level':b[2],'is_deployed':b[3],'pos_x':float(b[4]),'pos_y':float(b[5]),'hp':b[6],'max_hp':b[7],'commander_level':b[8],'defenses':b[9],'owner':b[10],'faction':b[11]} for b in cur.fetchall()]
            cur.execute(f"SELECT id,nickname,faction,pos_x,pos_y,score FROM {SCHEMA}.players WHERE planet_id=%s", (pid,))
            players_on = [{'id':r[0],'nickname':r[1],'faction':r[2],'pos_x':float(r[3]),'pos_y':float(r[4]),'score':r[5]} for r in cur.fetchall()]
            return ok({'planet':{'id':p[0],'name':p[1],'type':p[2],'pos_x':p[3],'pos_y':p[4],'size':p[5],'biome':p[6],'monster_density':p[7],'resource_multiplier':float(p[8]),'controlling_alliance_id':p[9]},'bases':bases,'players':players_on})

        if action == 'bases':
            if not player:
                return err('Не авторизован', 401)
            cur.execute(f"""SELECT id,name,level,is_deployed,pos_x,pos_y,hp,max_hp,
                               commander_level,commander_implants,defenses,production_queue,planet_id
                           FROM {SCHEMA}.bases WHERE owner_id=%s""", (player['id'],))
            return ok({'bases': [{'id':b[0],'name':b[1],'level':b[2],'is_deployed':b[3],'pos_x':float(b[4]),'pos_y':float(b[5]),'hp':b[6],'max_hp':b[7],'commander_level':b[8],'commander_implants':b[9],'defenses':b[10],'production_queue':b[11],'planet_id':b[12]} for b in cur.fetchall()]})

        if action == 'units':
            if not player:
                return err('Не авторизован', 401)
            cur.execute(f"""SELECT id,type,specialization,level,implants,weapon,hp,max_hp,
                               attack_power,defense_power,pos_x,pos_y,is_alive,base_id,planet_id
                           FROM {SCHEMA}.units WHERE owner_id=%s AND is_alive=true""", (player['id'],))
            return ok({'units': [{'id':u[0],'type':u[1],'specialization':u[2],'level':u[3],'implants':u[4],'weapon':u[5],'hp':u[6],'max_hp':u[7],'attack':u[8],'defense':u[9],'pos_x':float(u[10]),'pos_y':float(u[11]),'is_alive':u[12],'base_id':u[13],'planet_id':u[14]} for u in cur.fetchall()]})

        if action == 'alliances':
            cur.execute(f"""SELECT a.id,a.name,a.faction,a.emblem,a.description,a.gold,a.metal,a.crystal,
                               COUNT(p.id),a.leader_id,pl.nickname
                           FROM {SCHEMA}.alliances a
                           LEFT JOIN {SCHEMA}.players p ON p.alliance_id=a.id
                           LEFT JOIN {SCHEMA}.players pl ON pl.id=a.leader_id
                           GROUP BY a.id,pl.nickname ORDER BY a.id""")
            return ok({'alliances': [{'id':r[0],'name':r[1],'faction':r[2],'emblem':r[3],'description':r[4],'gold':r[5],'metal':r[6],'crystal':r[7],'members':r[8],'leader_id':r[9],'leader_name':r[10]} for r in cur.fetchall()]})

        if action == 'leaderboard':
            cur.execute(f"""SELECT p.id,p.nickname,p.faction,p.score,a.name FROM {SCHEMA}.players p
                           LEFT JOIN {SCHEMA}.alliances a ON a.id=p.alliance_id
                           ORDER BY p.score DESC LIMIT 50""")
            return ok({'leaderboard': [{'id':r[0],'nickname':r[1],'faction':r[2],'score':r[3],'alliance':r[4]} for r in cur.fetchall()]})

        # ── Чат: глобальный (GET) ──────────────────────────────────────
        if action == 'chat_global':
            since = int(params.get('since', 0) or 0)
            if since > 0:
                cur.execute(f"""SELECT id,player_id,nickname,faction,message,msg_type,created_at
                               FROM {SCHEMA}.global_chat WHERE id > %s
                               ORDER BY created_at ASC LIMIT 60""", (since,))
                rows = cur.fetchall()
            else:
                cur.execute(f"""SELECT id,player_id,nickname,faction,message,msg_type,created_at
                               FROM {SCHEMA}.global_chat
                               ORDER BY created_at DESC LIMIT 60""")
                rows = list(reversed(cur.fetchall()))
            return ok({'messages': [fmt_msg(r) for r in rows], 'channel': 'global'})

        # ── Чат: альянс (GET) ──────────────────────────────────────────
        if action == 'chat_alliance':
            alliance_id = params.get('alliance_id')
            if not alliance_id and player:
                alliance_id = player.get('alliance_id')
            if not alliance_id:
                return err('Необходим alliance_id', 400)
            since = int(params.get('since', 0) or 0)
            if since > 0:
                cur.execute(f"""SELECT id,player_id,nickname,faction,message,msg_type,created_at
                               FROM {SCHEMA}.chat_messages WHERE alliance_id=%s AND id > %s
                               ORDER BY created_at ASC LIMIT 60""", (alliance_id, since))
                rows = cur.fetchall()
            else:
                cur.execute(f"""SELECT id,player_id,nickname,faction,message,msg_type,created_at
                               FROM {SCHEMA}.chat_messages WHERE alliance_id=%s
                               ORDER BY created_at DESC LIMIT 60""", (alliance_id,))
                rows = list(reversed(cur.fetchall()))
            return ok({'messages': [fmt_msg(r) for r in rows], 'channel': 'alliance', 'alliance_id': alliance_id})

        # ── Чат: отправить (POST) ──────────────────────────────────────
        if action == 'chat_send':
            if not player:
                return err('Не авторизован', 401)
            text = sanitize(body.get('message', ''))
            if not text:
                return err('Пустое сообщение')
            channel = body.get('channel', 'global')

            if channel == 'alliance':
                if not player['alliance_id']:
                    return err('Вы не состоите в альянсе')
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.chat_messages
                        (alliance_id,player_id,nickname,faction,message,msg_type)
                        VALUES (%s,%s,%s,%s,%s,'text')
                        RETURNING id,player_id,nickname,faction,message,msg_type,created_at""",
                    (player['alliance_id'], player['id'], player['nickname'], player['faction'], text)
                )
            else:
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.global_chat
                        (player_id,nickname,faction,message,msg_type)
                        VALUES (%s,%s,%s,%s,'text')
                        RETURNING id,player_id,nickname,faction,message,msg_type,created_at""",
                    (player['id'], player['nickname'], player['faction'], text)
                )
            row = cur.fetchone()
            conn.commit()
            return ok({'message': fmt_msg(row), 'channel': channel})

        return err('Unknown action', 404)

    finally:
        cur.close()
        conn.close()
