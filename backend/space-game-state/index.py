"""
Космические Путешественники — Чат и Альянсы.
GET  action=chat_global&since=N       — глобальный чат
GET  action=chat_alliance&since=N     — чат альянса
POST action=chat_send {channel, message} — отправить сообщение
GET  action=alliances                 — список альянсов
POST action=create_alliance {name, emblem, description} — создать альянс
POST action=join_alliance {alliance_id} — вступить
POST action=leave_alliance            — покинуть
GET  action=leaderboard               — рейтинг
"""
import json, os, re, psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p83915249_biotech_anime_store')
MAX_MSG = 300

RACE_EMOJI = {
    'terrans': '🌍', 'zephyrians': '🌬️', 'vorath': '🔥',
    'crystallids': '💎', 'necrons': '💀', 'biotech': '🧬', 'mechanoids': '⚙️'
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def cors():
    return {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token'}

def ok(d):
    return {'statusCode': 200, 'headers': cors(), 'body': json.dumps(d, default=str)}

def err(msg, code=400):
    return {'statusCode': code, 'headers': cors(), 'body': json.dumps({'error': msg})}

def get_player(cur, token):
    if not token:
        return None
    cur.execute(f"SELECT id, nickname, race, score, alliance_id FROM {SCHEMA}.players WHERE session_token=%s", (token,))
    r = cur.fetchone()
    if not r:
        return None
    return {'id': r[0], 'nickname': r[1], 'race': r[2], 'score': r[3], 'alliance_id': r[4]}

def sanitize(text):
    return re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', text.strip()[:MAX_MSG])

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    method = event.get('httpMethod', 'GET')
    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token', '')
    params = event.get('queryStringParameters') or {}
    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            pass

    action = body.get('action') if method == 'POST' else params.get('action', 'chat_global')

    c = get_conn()
    cur = c.cursor()

    try:
        player = get_player(cur, token)

        # Глобальный чат
        if action == 'chat_global':
            since = int(params.get('since', 0) or 0)
            if since > 0:
                cur.execute(f"""SELECT id,player_id,nickname,faction,message,created_at
                               FROM {SCHEMA}.global_chat WHERE id > %s
                               ORDER BY created_at ASC LIMIT 60""", (since,))
            else:
                cur.execute(f"""SELECT id,player_id,nickname,faction,message,created_at
                               FROM {SCHEMA}.global_chat
                               ORDER BY created_at DESC LIMIT 50""")
            rows = cur.fetchall()
            if since == 0:
                rows = list(reversed(rows))
            msgs = [{'id': r[0], 'player_id': r[1], 'nickname': r[2],
                     'race': r[3], 'race_emoji': RACE_EMOJI.get(r[3], '👤'),
                     'message': r[4], 'created_at': str(r[5])} for r in rows]
            return ok({'messages': msgs})

        # Чат альянса
        if action == 'chat_alliance':
            if not player or not player['alliance_id']:
                return err('Вы не в альянсе', 403)
            since = int(params.get('since', 0) or 0)
            aid = player['alliance_id']
            if since > 0:
                cur.execute(f"""SELECT id,player_id,nickname,race,message,created_at
                               FROM {SCHEMA}.alliance_chat WHERE alliance_id=%s AND id > %s
                               ORDER BY created_at ASC LIMIT 60""", (aid, since))
            else:
                cur.execute(f"""SELECT id,player_id,nickname,race,message,created_at
                               FROM {SCHEMA}.alliance_chat WHERE alliance_id=%s
                               ORDER BY created_at DESC LIMIT 50""", (aid,))
            rows = cur.fetchall()
            if since == 0:
                rows = list(reversed(rows))
            msgs = [{'id': r[0], 'player_id': r[1], 'nickname': r[2],
                     'race': r[3], 'race_emoji': RACE_EMOJI.get(r[3], '👤'),
                     'message': r[4], 'created_at': str(r[5])} for r in rows]
            return ok({'messages': msgs})

        # Отправить сообщение
        if action == 'chat_send' and method == 'POST':
            if not player:
                return err('Не авторизован', 401)
            channel = body.get('channel', 'global')
            msg = sanitize(body.get('message', ''))
            if not msg:
                return err('Пустое сообщение')
            if channel == 'global':
                cur.execute(f"""INSERT INTO {SCHEMA}.global_chat (player_id,nickname,faction,message)
                               VALUES (%s,%s,%s,%s) RETURNING id,created_at""",
                            (player['id'], player['nickname'], player['race'], msg))
                r = cur.fetchone()
                c.commit()
                return ok({'sent': True, 'id': r[0], 'created_at': str(r[1])})
            elif channel == 'alliance':
                if not player['alliance_id']:
                    return err('Вы не в альянсе')
                cur.execute(f"""INSERT INTO {SCHEMA}.alliance_chat (alliance_id,player_id,nickname,race,message)
                               VALUES (%s,%s,%s,%s,%s) RETURNING id,created_at""",
                            (player['alliance_id'], player['id'], player['nickname'], player['race'], msg))
                r = cur.fetchone()
                c.commit()
                return ok({'sent': True, 'id': r[0], 'created_at': str(r[1])})
            return err('Неизвестный канал')

        # Список альянсов
        if action == 'alliances':
            cur.execute(f"""
                SELECT a.id, a.name, a.faction, a.emblem, a.description, COUNT(p.id), a.leader_id, pl.nickname
                FROM {SCHEMA}.alliances a
                LEFT JOIN {SCHEMA}.players p ON p.alliance_id = a.id
                LEFT JOIN {SCHEMA}.players pl ON pl.id = a.leader_id
                GROUP BY a.id, pl.nickname ORDER BY COUNT(p.id) DESC
            """)
            return ok({'alliances': [{'id': r[0], 'name': r[1], 'race': r[2], 'emblem': r[3],
                                       'description': r[4], 'members': r[5],
                                       'leader_id': r[6], 'leader_name': r[7]} for r in cur.fetchall()]})

        # Создать альянс
        if action == 'create_alliance' and method == 'POST':
            if not player:
                return err('Не авторизован', 401)
            if player['alliance_id']:
                return err('Вы уже в альянсе')
            name = body.get('name', '').strip()
            emblem = body.get('emblem', '⚔️').strip()
            desc = body.get('description', '').strip()
            if not name or len(name) < 2:
                return err('Название альянса слишком короткое')
            cur.execute(f"SELECT id FROM {SCHEMA}.alliances WHERE name=%s", (name,))
            if cur.fetchone():
                return err('Такой альянс уже существует')
            cur.execute(f"""INSERT INTO {SCHEMA}.alliances (name, faction, leader_id, emblem, description)
                           VALUES (%s,%s,%s,%s,%s) RETURNING id""",
                        (name, player['race'], player['id'], emblem, desc))
            aid = cur.fetchone()[0]
            cur.execute(f"UPDATE {SCHEMA}.players SET alliance_id=%s WHERE id=%s", (aid, player['id']))
            c.commit()
            return ok({'created': True, 'alliance_id': aid})

        # Вступить в альянс
        if action == 'join_alliance' and method == 'POST':
            if not player:
                return err('Не авторизован', 401)
            if player['alliance_id']:
                return err('Покиньте текущий альянс сначала')
            aid = body.get('alliance_id')
            if not aid:
                return err('Укажите alliance_id')
            cur.execute(f"SELECT id FROM {SCHEMA}.alliances WHERE id=%s", (aid,))
            if not cur.fetchone():
                return err('Альянс не найден')
            cur.execute(f"UPDATE {SCHEMA}.players SET alliance_id=%s WHERE id=%s", (aid, player['id']))
            c.commit()
            return ok({'joined': True, 'alliance_id': aid})

        # Покинуть альянс
        if action == 'leave_alliance' and method == 'POST':
            if not player:
                return err('Не авторизован', 401)
            if not player['alliance_id']:
                return err('Вы не в альянсе')
            cur.execute(f"UPDATE {SCHEMA}.players SET alliance_id=NULL WHERE id=%s", (player['id'],))
            c.commit()
            return ok({'left': True})

        # Рейтинг
        if action == 'leaderboard':
            cur.execute(f"""
                SELECT p.id, p.nickname, p.race, p.score, a.name
                FROM {SCHEMA}.players p
                LEFT JOIN {SCHEMA}.alliances a ON a.id = p.alliance_id
                ORDER BY p.score DESC LIMIT 50
            """)
            return ok({'leaderboard': [{'id': r[0], 'nickname': r[1], 'race': r[2],
                                         'race_emoji': RACE_EMOJI.get(r[2], '👤'),
                                         'score': r[3], 'alliance': r[4]} for r in cur.fetchall()]})

        return err('Неизвестное действие', 404)

    finally:
        cur.close()
        c.close()
