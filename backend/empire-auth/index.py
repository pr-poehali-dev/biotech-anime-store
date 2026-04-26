"""
Империя Космоса — Авторизация и профиль игрока.
POST action=register  {nickname, login, password, race}
POST action=login     {login, password}
GET  action=me        — профиль по токену
POST action=save      — сохранить ресурсы/прогресс
GET  action=leaderboard — топ игроков
"""
import json, os, hashlib, secrets, psycopg2

S = os.environ.get('MAIN_DB_SCHEMA', 't_p83915249_biotech_anime_store')

RACE_BONUS = {
    'terrans':     {'metal': 1000, 'energy': 800,  'crystals': 400,  'population': 20, 'fuel': 500, 'dark_matter': 10},
    'zephyrians':  {'metal': 700,  'energy': 1400, 'crystals': 400,  'population': 18, 'fuel': 600, 'dark_matter': 15},
    'vorath':      {'metal': 1400, 'energy': 600,  'crystals': 300,  'population': 15, 'fuel': 500, 'dark_matter': 5},
    'crystallids': {'metal': 600,  'energy': 700,  'crystals': 1000, 'population': 18, 'fuel': 400, 'dark_matter': 20},
    'necrons':     {'metal': 800,  'energy': 1000, 'crystals': 600,  'population': 12, 'fuel': 500, 'dark_matter': 30},
    'biotech':     {'metal': 700,  'energy': 900,  'crystals': 500,  'population': 30, 'fuel': 600, 'dark_matter': 10},
    'mechanoids':  {'metal': 1800, 'energy': 1200, 'crystals': 200,  'population': 10, 'fuel': 700, 'dark_matter': 5},
    'psychovores': {'metal': 500,  'energy': 600,  'crystals': 800,  'population': 25, 'fuel': 400, 'dark_matter': 50},
    'stellarians': {'metal': 900,  'energy': 1100, 'crystals': 700,  'population': 20, 'fuel': 800, 'dark_matter': 20},
}

def db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def hp(pwd):
    return hashlib.sha256(pwd.encode()).hexdigest()

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

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    body = {}
    if event.get('body'):
        body = json.loads(event['body'])
    action = body.get('action') or params.get('action', 'me')
    token = get_token(event)

    conn = db()
    cur = conn.cursor()

    try:
        # РЕГИСТРАЦИЯ
        if action == 'register' and method == 'POST':
            nickname = body.get('nickname', '').strip()
            login    = body.get('login', '').strip().lower()
            password = body.get('password', '')
            race     = body.get('race', 'terrans')

            if not nickname or not login or not password:
                return err('Заполните все поля')
            if len(nickname) < 2 or len(nickname) > 20:
                return err('Никнейм: 2-20 символов')
            if race not in RACE_BONUS:
                return err('Неизвестная раса')

            cur.execute(f"SELECT id FROM {S}.empire_players WHERE login=%s OR nickname=%s", (login, nickname))
            if cur.fetchone():
                return err('Логин или никнейм уже занят')

            res = RACE_BONUS[race]
            tok = secrets.token_hex(32)

            cur.execute(f"""
                INSERT INTO {S}.empire_players
                  (login, nickname, password_hash, session_token, race,
                   metal, energy, crystals, population, fuel, dark_matter)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
            """, (login, nickname, hp(password), tok, race,
                  res['metal'], res['energy'], res['crystals'],
                  res['population'], res['fuel'], res['dark_matter']))
            pid = cur.fetchone()[0]

            # Создаём стартовую колонию на случайной свободной планете сектора alpha
            cur.execute(f"""
                SELECT id, pos_x, pos_y FROM {S}.empire_planets
                WHERE owner_id IS NULL AND ai_fleet_tier = 0
                ORDER BY RANDOM() LIMIT 1
            """)
            planet = cur.fetchone()
            if planet:
                cur.execute(f"""
                    INSERT INTO {S}.empire_colonies
                      (player_id, planet_id, colony_name, is_capital, mine_level, solar_level)
                    VALUES (%s,%s,%s,true,1,1) RETURNING id
                """, (pid, planet[0], f'Столица {nickname}'))
                col_id = cur.fetchone()[0]
                cur.execute(f"""
                    UPDATE {S}.empire_planets
                    SET owner_id=%s, owner_race=%s, colony_id=%s, is_ai_controlled=false
                    WHERE id=%s
                """, (pid, race, col_id, planet[0]))
                cur.execute(f"UPDATE {S}.empire_players SET home_planet_id=%s WHERE id=%s", (planet[0], pid))

            conn.commit()
            return ok({'token': tok, 'player_id': pid, 'race': race, 'nickname': nickname})

        # ВХОД
        if action == 'login' and method == 'POST':
            login    = body.get('login', '').strip().lower()
            password = body.get('password', '')
            cur.execute(f"""
                SELECT id, nickname, race, metal, energy, crystals, population, fuel, dark_matter,
                       score, rank_title, alliance_id, home_planet_id,
                       colonies_count, total_fleet_power, battles_won, battles_lost, planets_conquered
                FROM {S}.empire_players
                WHERE (login=%s OR nickname=%s) AND password_hash=%s
            """, (login, login, hp(password)))
            row = cur.fetchone()
            if not row:
                return err('Неверный логин или пароль', 401)
            tok = secrets.token_hex(32)
            cur.execute(f"UPDATE {S}.empire_players SET session_token=%s, is_online=true, last_seen_at=now() WHERE id=%s", (tok, row[0]))
            conn.commit()
            return ok({'token': tok, 'player': {
                'id': row[0], 'nickname': row[1], 'race': row[2],
                'metal': row[3], 'energy': row[4], 'crystals': row[5],
                'population': row[6], 'fuel': row[7], 'dark_matter': row[8],
                'score': row[9], 'rank_title': row[10], 'alliance_id': row[11],
                'home_planet_id': row[12], 'colonies_count': row[13],
                'total_fleet_power': row[14], 'battles_won': row[15],
                'battles_lost': row[16], 'planets_conquered': row[17],
            }})

        # ПРОФИЛЬ
        if action == 'me' and method == 'GET':
            if not token:
                return err('Не авторизован', 401)
            cur.execute(f"""
                SELECT id, nickname, race, metal, energy, crystals, population, fuel, dark_matter,
                       score, rank_title, alliance_id, home_planet_id,
                       colonies_count, total_fleet_power, battles_won, battles_lost, planets_conquered
                FROM {S}.empire_players WHERE session_token=%s
            """, (token,))
            row = cur.fetchone()
            if not row:
                return err('Сессия истекла', 401)
            cur.execute(f"UPDATE {S}.empire_players SET is_online=true, last_seen_at=now() WHERE id=%s", (row[0],))
            conn.commit()
            return ok({
                'id': row[0], 'nickname': row[1], 'race': row[2],
                'metal': row[3], 'energy': row[4], 'crystals': row[5],
                'population': row[6], 'fuel': row[7], 'dark_matter': row[8],
                'score': row[9], 'rank_title': row[10], 'alliance_id': row[11],
                'home_planet_id': row[12], 'colonies_count': row[13],
                'total_fleet_power': row[14], 'battles_won': row[15],
                'battles_lost': row[16], 'planets_conquered': row[17],
            })

        # СОХРАНЕНИЕ РЕСУРСОВ
        if action == 'save' and method == 'POST':
            if not token:
                return err('Не авторизован', 401)
            cur.execute(f"SELECT id FROM {S}.empire_players WHERE session_token=%s", (token,))
            row = cur.fetchone()
            if not row:
                return err('Сессия истекла', 401)
            pid = row[0]
            score = int(body.get('score', 0))
            cur.execute(f"""
                UPDATE {S}.empire_players SET
                  metal=GREATEST(metal,%s), energy=GREATEST(energy,%s),
                  crystals=GREATEST(crystals,%s), fuel=GREATEST(fuel,%s),
                  dark_matter=GREATEST(dark_matter,%s),
                  score=GREATEST(score,%s), last_seen_at=now()
                WHERE id=%s
            """, (body.get('metal',0), body.get('energy',0), body.get('crystals',0),
                  body.get('fuel',0), body.get('dark_matter',0), score, pid))
            conn.commit()
            return ok({'saved': True})

        # РЕЙТИНГ
        if action == 'leaderboard':
            cur.execute(f"""
                SELECT p.id, p.nickname, p.race, p.score, p.rank_title,
                       p.planets_conquered, p.battles_won, COALESCE(a.alliance_name, a.name),
                       p.is_online, p.last_seen_at
                FROM {S}.empire_players p
                LEFT JOIN {S}.empire_alliances a ON a.id = p.alliance_id
                ORDER BY p.score DESC LIMIT 50
            """)
            cols = ['id','nickname','race','score','rank_title','planets_conquered','battles_won','alliance','is_online','last_seen_at']
            return ok({'leaderboard': [dict(zip(cols, r)) for r in cur.fetchall()]})

        return err('Неизвестное действие', 404)

    finally:
        cur.close()
        conn.close()