"""
Авторизация и регистрация игроков. Методы: POST /register, POST /login, GET /me
"""
import json
import os
import hashlib
import secrets
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p83915249_biotech_anime_store')

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def hash_password(pwd: str) -> str:
    return hashlib.sha256(pwd.encode()).hexdigest()

def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    }

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers(), 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    action = params.get('action', 'login')
    body = {}
    if event.get('body'):
        body = json.loads(event['body'])
    if not action and method == 'POST':
        action = body.get('action', 'login')

    conn = get_conn()
    cur = conn.cursor()

    try:
        # Регистрация
        if action == 'register' and method == 'POST':
            email = body.get('email', '').strip().lower()
            nickname = body.get('nickname', '').strip()
            login = body.get('login', '').strip()
            password = body.get('password', '')
            faction = body.get('faction', 'human')

            if not email or not nickname or not password or not login:
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Заполните все поля'})}

            cur.execute(f"SELECT id FROM {SCHEMA}.players WHERE email=%s OR nickname=%s", (email, nickname))
            if cur.fetchone():
                return {'statusCode': 409, 'headers': cors_headers(), 'body': json.dumps({'error': 'Email или никнейм уже занят'})}

            # Стартовые ресурсы зависят от фракции
            if faction == 'tech':
                gold, metal, crystal, bio = 300, 800, 200, 50
            elif faction == 'cyborg':
                gold, metal, crystal, bio = 500, 400, 100, 300
            else:  # human
                gold, metal, crystal, bio = 700, 300, 150, 200

            token = secrets.token_hex(32)
            cur.execute(
                f"""INSERT INTO {SCHEMA}.players
                    (email, nickname, password_hash, faction, energy, gold, metal, crystal, bio_matter, session_token)
                    VALUES (%s, %s, %s, %s, 1000, %s, %s, %s, %s, %s) RETURNING id""",
                (email, nickname, hash_password(password), faction, gold, metal, crystal, bio, token)
            )
            player_id = cur.fetchone()[0]
            conn.commit()

            # Создаём стартовую мобильную базу
            cur.execute(
                f"""INSERT INTO {SCHEMA}.bases
                    (owner_id, planet_id, name, level, is_deployed, pos_x, pos_y, hp, max_hp)
                    VALUES (%s, 1, %s, 1, false, 500, 500, 1000, 1000)""",
                (player_id, f"База {nickname}")
            )
            conn.commit()

            return {
                'statusCode': 200,
                'headers': cors_headers(),
                'body': json.dumps({'token': token, 'player_id': player_id, 'faction': faction})
            }

        # Вход
        elif action == 'login' and method == 'POST':
            login_or_email = body.get('login', '').strip().lower()
            password = body.get('password', '')

            cur.execute(
                f"SELECT id, nickname, faction, energy, gold, metal, crystal, bio_matter, score, alliance_id, planet_id, pos_x, pos_y FROM {SCHEMA}.players WHERE (email=%s OR nickname=%s) AND password_hash=%s",
                (login_or_email, login_or_email, hash_password(password))
            )
            row = cur.fetchone()
            if not row:
                return {'statusCode': 401, 'headers': cors_headers(), 'body': json.dumps({'error': 'Неверный логин или пароль'})}

            token = secrets.token_hex(32)
            cur.execute(f"UPDATE {SCHEMA}.players SET session_token=%s WHERE id=%s", (token, row[0]))
            conn.commit()

            return {
                'statusCode': 200,
                'headers': cors_headers(),
                'body': json.dumps({
                    'token': token,
                    'player': {
                        'id': row[0], 'nickname': row[1], 'faction': row[2],
                        'energy': row[3], 'gold': row[4], 'metal': row[5],
                        'crystal': row[6], 'bio_matter': row[7], 'score': row[8],
                        'alliance_id': row[9], 'planet_id': row[10],
                        'pos_x': row[11], 'pos_y': row[12]
                    }
                })
            }

        # Профиль
        elif action == 'me' and method == 'GET':
            token = (event.get('headers') or {}).get('X-Auth-Token') or (event.get('headers') or {}).get('x-auth-token')
            if not token:
                return {'statusCode': 401, 'headers': cors_headers(), 'body': json.dumps({'error': 'Не авторизован'})}

            cur.execute(
                f"""SELECT id, nickname, faction, energy, energy_last_refill, gold, metal, crystal, bio_matter, score, alliance_id, planet_id, pos_x, pos_y, created_at
                    FROM {SCHEMA}.players WHERE session_token=%s""",
                (token,)
            )
            row = cur.fetchone()
            if not row:
                return {'statusCode': 401, 'headers': cors_headers(), 'body': json.dumps({'error': 'Сессия истекла'})}

            # Пересчитываем энергию (1 ед. за 10 минут)
            import datetime
            now = datetime.datetime.now(datetime.timezone.utc)
            last_refill = row[4]
            minutes_passed = int((now - last_refill).total_seconds() / 60)
            energy_gained = min(minutes_passed, max(0, 1000 - row[3]))
            new_energy = row[3] + energy_gained
            if energy_gained > 0:
                cur.execute(f"UPDATE {SCHEMA}.players SET energy=%s, energy_last_refill=%s WHERE id=%s", (new_energy, now, row[0]))
                conn.commit()

            return {
                'statusCode': 200,
                'headers': cors_headers(),
                'body': json.dumps({
                    'id': row[0], 'nickname': row[1], 'faction': row[2],
                    'energy': new_energy, 'gold': row[5], 'metal': row[6],
                    'crystal': row[7], 'bio_matter': row[8], 'score': row[9],
                    'alliance_id': row[10], 'planet_id': row[11],
                    'pos_x': row[12], 'pos_y': row[13]
                })
            }

        return {'statusCode': 404, 'headers': cors_headers(), 'body': json.dumps({'error': 'Not found'})}

    finally:
        cur.close()
        conn.close()