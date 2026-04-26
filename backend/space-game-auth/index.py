"""
Космические Путешественники — Авторизация.
POST action=register — регистрация (race, nickname, login, password)
POST action=login    — вход
GET  action=me       — профиль по токену
POST action=save     — сохранить прогресс (buildings, ships, techs, resources, tick)
"""
import json, os, hashlib, secrets, psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p83915249_biotech_anime_store')

RACE_RESOURCES = {
    'terrans':     {'metal': 500,  'energy': 300,  'crystals': 150, 'population': 10},
    'zephyrians':  {'metal': 300,  'energy': 600,  'crystals': 150, 'population': 10},
    'vorath':      {'metal': 700,  'energy': 250,  'crystals': 100, 'population': 8},
    'crystallids': {'metal': 350,  'energy': 280,  'crystals': 500, 'population': 9},
    'necrons':     {'metal': 400,  'energy': 450,  'crystals': 250, 'population': 7},
    'biotech':     {'metal': 300,  'energy': 350,  'crystals': 200, 'population': 15},
    'mechanoids':  {'metal': 800,  'energy': 500,  'crystals': 100, 'population': 5},
}

def conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def hp(pwd):
    return hashlib.sha256(pwd.encode()).hexdigest()

def cors():
    return {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token'}

def ok(d):
    return {'statusCode': 200, 'headers': cors(), 'body': json.dumps(d, default=str)}

def err(msg, code=400):
    return {'statusCode': code, 'headers': cors(), 'body': json.dumps({'error': msg})}

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    body = {}
    if event.get('body'):
        body = json.loads(event['body'])
    action = body.get('action') or params.get('action', 'me')
    token = (event.get('headers') or {}).get('X-Auth-Token') or (event.get('headers') or {}).get('x-auth-token', '')

    c = conn()
    cur = c.cursor()

    try:
        # РЕГИСТРАЦИЯ
        if action == 'register' and method == 'POST':
            nickname = body.get('nickname', '').strip()
            login    = body.get('login', '').strip().lower()
            password = body.get('password', '')
            race     = body.get('race', 'terrans')

            if not nickname or not login or not password:
                return err('Заполните все поля')
            if race not in RACE_RESOURCES:
                return err('Неизвестная раса')

            cur.execute(f"SELECT id FROM {SCHEMA}.players WHERE email=%s OR nickname=%s", (login, nickname))
            if cur.fetchone():
                return err('Логин или никнейм уже занят')

            res = RACE_RESOURCES[race]
            tok = secrets.token_hex(32)
            init_resources = json.dumps({'metal': res['metal'], 'energy': res['energy'],
                                         'crystals': res['crystals'], 'population': res['population']})
            cur.execute(f"""
                INSERT INTO {SCHEMA}.players
                  (email, nickname, password_hash, faction, race, resources, session_token,
                   metal, crystal, bio_matter, gold)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
            """, (login, nickname, hp(password), race, race, init_resources, tok,
                  res['metal'], res['crystals'], res.get('population', 10), res['energy']))
            pid = cur.fetchone()[0]
            c.commit()
            return ok({'token': tok, 'player_id': pid, 'race': race, 'nickname': nickname})

        # ВХОД
        if action == 'login' and method == 'POST':
            login    = body.get('login', '').strip().lower()
            password = body.get('password', '')
            cur.execute(f"""
                SELECT id, nickname, race, resources, buildings, ships, techs, tick,
                       score, alliance_id, repair_bots, repair_kits
                FROM {SCHEMA}.players
                WHERE (email=%s OR nickname=%s) AND password_hash=%s
            """, (login, login, hp(password)))
            row = cur.fetchone()
            if not row:
                return err('Неверный логин или пароль', 401)
            tok = secrets.token_hex(32)
            cur.execute(f"UPDATE {SCHEMA}.players SET session_token=%s, last_tick_at=now() WHERE id=%s", (tok, row[0]))
            c.commit()
            return ok({'token': tok, 'player': {
                'id': row[0], 'nickname': row[1], 'race': row[2],
                'resources': row[3] or {}, 'buildings': row[4] or {},
                'ships': row[5] or {}, 'techs': row[6] or {},
                'tick': row[7], 'score': row[8], 'alliance_id': row[9],
                'repair_bots': row[10], 'repair_kits': row[11]
            }})

        # ПРОФИЛЬ
        if action == 'me' and method == 'GET':
            if not token:
                return err('Не авторизован', 401)
            cur.execute(f"""
                SELECT id, nickname, race, resources, buildings, ships, techs, tick,
                       score, alliance_id, repair_bots, repair_kits
                FROM {SCHEMA}.players WHERE session_token=%s
            """, (token,))
            row = cur.fetchone()
            if not row:
                return err('Сессия истекла', 401)
            return ok({'id': row[0], 'nickname': row[1], 'race': row[2],
                'resources': row[3] or {}, 'buildings': row[4] or {},
                'ships': row[5] or {}, 'techs': row[6] or {},
                'tick': row[7], 'score': row[8], 'alliance_id': row[9],
                'repair_bots': row[10], 'repair_kits': row[11]
            })

        # СОХРАНЕНИЕ ПРОГРЕССА
        if action == 'save' and method == 'POST':
            if not token:
                return err('Не авторизован', 401)
            cur.execute(f"SELECT id FROM {SCHEMA}.players WHERE session_token=%s", (token,))
            row = cur.fetchone()
            if not row:
                return err('Сессия истекла', 401)
            pid = row[0]
            buildings  = json.dumps(body.get('buildings', {}))
            ships      = json.dumps(body.get('ships', {}))
            techs      = json.dumps(body.get('techs', {}))
            resources  = json.dumps(body.get('resources', {}))
            tick       = int(body.get('tick', 0))
            score      = int(body.get('score', 0))
            cur.execute(f"""
                UPDATE {SCHEMA}.players
                SET buildings=%s, ships=%s, techs=%s, resources=%s, tick=%s,
                    score=GREATEST(score, %s), last_tick_at=now()
                WHERE id=%s
            """, (buildings, ships, techs, resources, tick, score, pid))
            c.commit()
            return ok({'saved': True})

        return err('Неизвестное действие', 404)

    finally:
        cur.close()
        c.close()
