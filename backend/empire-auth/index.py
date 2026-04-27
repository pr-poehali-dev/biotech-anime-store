"""
Галактическая Империя — Авторизация и профиль игрока.
POST action=register     {nickname, login, email, password, race}  — регистрация, отправляет код на email
POST action=verify_email {player_id, code}                         — подтвердить email по коду
POST action=login        {login, password}                         — вход
GET  action=me           — профиль по токену
POST action=save         — сохранить ресурсы/прогресс
GET  action=leaderboard  — топ игроков
POST action=resend_code  {player_id}                               — повторно отправить код
POST action=choose_planet {player_id, planet_id}                   — выбрать стартовую планету (после верификации)
"""
import json, os, hashlib, secrets, psycopg2, smtplib, random, string
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

S = os.environ.get('MAIN_DB_SCHEMA', 't_p83915249_biotech_anime_store')

RACE_BONUS = {
    'solarians':    {'metal': 800,  'energy': 1600, 'crystals': 400,  'population': 20, 'fuel': 600,  'dark_matter': 10},
    'voidstalkers': {'metal': 900,  'energy': 900,  'crystals': 500,  'population': 12, 'fuel': 500,  'dark_matter': 30},
    'ironborn':     {'metal': 2000, 'energy': 1000, 'crystals': 200,  'population': 10, 'fuel': 700,  'dark_matter': 5},
    'arboreals':    {'metal': 700,  'energy': 900,  'crystals': 500,  'population': 40, 'fuel': 600,  'dark_matter': 10},
    'deepones':     {'metal': 600,  'energy': 800,  'crystals': 700,  'population': 18, 'fuel': 400,  'dark_matter': 25},
    'wraithkin':    {'metal': 700,  'energy': 1100, 'crystals': 600,  'population': 14, 'fuel': 500,  'dark_matter': 20},
    'psionic':      {'metal': 500,  'energy': 700,  'crystals': 800,  'population': 22, 'fuel': 400,  'dark_matter': 60},
    'hiveborn':     {'metal': 600,  'energy': 800,  'crystals': 300,  'population': 50, 'fuel': 500,  'dark_matter': 5},
    'titanforge':   {'metal': 1200, 'energy': 1200, 'crystals': 600,  'population': 18, 'fuel': 800,  'dark_matter': 15},
    'terrans':      {'metal': 1000, 'energy': 800,  'crystals': 400,  'population': 20, 'fuel': 500,  'dark_matter': 10},
    'zephyrians':   {'metal': 700,  'energy': 1400, 'crystals': 400,  'population': 18, 'fuel': 600,  'dark_matter': 15},
    'vorath':       {'metal': 1400, 'energy': 600,  'crystals': 300,  'population': 15, 'fuel': 500,  'dark_matter': 5},
    'crystallids':  {'metal': 600,  'energy': 700,  'crystals': 1000, 'population': 18, 'fuel': 400,  'dark_matter': 20},
    'necrons':      {'metal': 800,  'energy': 1000, 'crystals': 600,  'population': 12, 'fuel': 500,  'dark_matter': 30},
    'biotech':      {'metal': 700,  'energy': 900,  'crystals': 500,  'population': 30, 'fuel': 600,  'dark_matter': 10},
    'mechanoids':   {'metal': 1800, 'energy': 1200, 'crystals': 200,  'population': 10, 'fuel': 700,  'dark_matter': 5},
    'psychovores':  {'metal': 500,  'energy': 600,  'crystals': 800,  'population': 25, 'fuel': 400,  'dark_matter': 50},
    'stellarians':  {'metal': 900,  'energy': 1100, 'crystals': 700,  'population': 20, 'fuel': 800,  'dark_matter': 20},
}

# Корабль Колонист — для основания новых колоний
COLONIST_SHIP = {'colonist': 1}

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

def gen_code():
    return ''.join(random.choices(string.digits, k=6))

def send_verification_email(to_email: str, nickname: str, code: str):
    smtp_login = os.environ.get('YANDEX_SMTP_LOGIN', '')
    smtp_pass  = os.environ.get('YANDEX_SMTP_PASSWORD', '')
    if not smtp_login or not smtp_pass:
        return False

    msg = MIMEMultipart('alternative')
    msg['Subject'] = f'🚀 Галактическая Империя — код подтверждения: {code}'
    msg['From']    = smtp_login
    msg['To']      = to_email

    html = f"""
    <div style="background:#0a0a1a;padding:40px;font-family:Arial,sans-serif;color:#e2e8f0;border-radius:12px;max-width:500px">
      <h1 style="color:#a78bfa;margin:0 0 8px">👑 Галактическая Империя</h1>
      <p style="color:#94a3b8;margin:0 0 24px;font-size:14px">Командор <strong style="color:#e2e8f0">{nickname}</strong>, добро пожаловать в галактику!</p>
      <div style="background:#1e1b4b;border:1px solid #4c1d95;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
        <div style="color:#94a3b8;font-size:12px;margin-bottom:8px;letter-spacing:2px">КОД ПОДТВЕРЖДЕНИЯ</div>
        <div style="color:#a78bfa;font-size:42px;font-weight:900;letter-spacing:12px">{code}</div>
      </div>
      <p style="color:#64748b;font-size:12px">Код действителен 30 минут. Не передавайте его никому.</p>
      <hr style="border-color:#1e293b;margin:20px 0">
      <p style="color:#475569;font-size:11px">Если вы не регистрировались — просто проигнорируйте это письмо.</p>
    </div>
    """
    msg.attach(MIMEText(html, 'html'))
    with smtplib.SMTP_SSL('smtp.yandex.ru', 465) as smtp:
        smtp.login(smtp_login, smtp_pass)
        smtp.send_message(msg)
    return True

def handler(event: dict, context) -> dict:
    """Авторизация с email-верификацией и кораблём Колонист."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    body = {}
    if event.get('body'):
        body = json.loads(event['body'])
    action = body.get('action') or params.get('action', 'me')
    token  = get_token(event)

    conn = db()
    cur  = conn.cursor()

    try:
        # ── РЕГИСТРАЦИЯ ──────────────────────────────────────────────────────
        if action == 'register' and method == 'POST':
            nickname = body.get('nickname', '').strip()
            login    = body.get('login', '').strip().lower()
            email    = body.get('email', '').strip().lower()
            password = body.get('password', '')
            race     = body.get('race', 'terrans')

            if not nickname or not login or not password or not email:
                return err('Заполните все поля (никнейм, логин, email, пароль)')
            if len(nickname) < 2 or len(nickname) > 20:
                return err('Никнейм: 2-20 символов')
            if '@' not in email or '.' not in email.split('@')[-1]:
                return err('Введите корректный email')
            if race not in RACE_BONUS:
                return err('Неизвестная раса')

            # Проверяем уникальность
            cur.execute(f"""
                SELECT id FROM {S}.empire_players
                WHERE login=%s OR nickname=%s OR (email=%s AND account_status != 'reset')
            """, (login, nickname, email))
            if cur.fetchone():
                return err('Логин, никнейм или email уже заняты')

            res = RACE_BONUS[race]
            # Создаём игрока с account_status='pending' (не верифицирован)
            cur.execute(f"""
                INSERT INTO {S}.empire_players
                  (login, nickname, password_hash, race, email, email_verified, account_status,
                   metal, energy, crystals, population, fuel, dark_matter)
                VALUES (%s,%s,%s,%s,%s,false,'pending',%s,%s,%s,%s,%s,%s) RETURNING id
            """, (login, nickname, hp(password), race, email,
                  res['metal'], res['energy'], res['crystals'],
                  res['population'], res['fuel'], res['dark_matter']))
            pid = cur.fetchone()[0]

            # Генерируем и сохраняем код верификации
            code = gen_code()
            cur.execute(f"""
                INSERT INTO {S}.email_verifications (player_id, email, code, expires_at)
                VALUES (%s, %s, %s, NOW() + INTERVAL '30 minutes')
            """, (pid, email, code))
            conn.commit()

            # Отправляем email
            sent = send_verification_email(email, nickname, code)

            return ok({
                'status': 'verify_email',
                'player_id': pid,
                'email': email,
                'email_sent': sent,
                'message': f'На {email} отправлен 6-значный код подтверждения'
            })

        # ── ПОДТВЕРЖДЕНИЕ EMAIL ───────────────────────────────────────────────
        if action == 'verify_email' and method == 'POST':
            pid  = body.get('player_id')
            code = str(body.get('code', '')).strip()
            if not pid or not code:
                return err('Укажите player_id и код')

            cur.execute(f"""
                SELECT id, email FROM {S}.email_verifications
                WHERE player_id=%s AND code=%s AND used=false AND expires_at > NOW()
                ORDER BY created_at DESC LIMIT 1
            """, (pid, code))
            row = cur.fetchone()
            if not row:
                return err('Неверный или истёкший код')

            # Помечаем код как использованный
            cur.execute(f"UPDATE {S}.email_verifications SET used=true WHERE id=%s", (row[0],))
            # Верифицируем аккаунт
            cur.execute(f"""
                UPDATE {S}.empire_players
                SET email_verified=true, account_status='active'
                WHERE id=%s
            """, (pid,))
            conn.commit()

            # Возвращаем данные для выбора стартовой планеты
            cur.execute(f"SELECT race, nickname FROM {S}.empire_players WHERE id=%s", (pid,))
            p = cur.fetchone()
            return ok({
                'status': 'choose_planet',
                'player_id': pid,
                'race': p[0],
                'nickname': p[1],
                'message': 'Email подтверждён! Выберите стартовую планету в секторе своей расы'
            })

        # ── ПОВТОРНАЯ ОТПРАВКА КОДА ───────────────────────────────────────────
        if action == 'resend_code' and method == 'POST':
            pid = body.get('player_id')
            if not pid:
                return err('Укажите player_id')
            cur.execute(f"SELECT email, nickname, account_status FROM {S}.empire_players WHERE id=%s", (pid,))
            p = cur.fetchone()
            if not p:
                return err('Игрок не найден')
            if p[2] == 'active':
                return err('Email уже подтверждён')

            code = gen_code()
            cur.execute(f"""
                INSERT INTO {S}.email_verifications (player_id, email, code, expires_at)
                VALUES (%s, %s, %s, NOW() + INTERVAL '30 minutes')
            """, (pid, p[0], code))
            conn.commit()
            sent = send_verification_email(p[0], p[1], code)
            return ok({'sent': sent, 'message': f'Новый код отправлен на {p[0]}'})

        # ── ВЫБОР СТАРТОВОЙ ПЛАНЕТЫ ───────────────────────────────────────────
        if action == 'choose_planet' and method == 'POST':
            pid       = body.get('player_id')
            planet_id = body.get('planet_id')
            if not pid or not planet_id:
                return err('Укажите player_id и planet_id')

            cur.execute(f"""
                SELECT id, race, nickname, account_status, home_planet_id
                FROM {S}.empire_players WHERE id=%s
            """, (pid,))
            p = cur.fetchone()
            if not p:
                return err('Игрок не найден')
            if p[3] != 'active':
                return err('Сначала подтвердите email')
            if p[4]:
                return err('Стартовая планета уже выбрана')

            race = p[1]; nickname = p[2]

            # Проверяем что планета в секторе расы игрока и свободна
            cur.execute(f"""
                SELECT id, pos_x, pos_y, sector FROM {S}.empire_planets
                WHERE id=%s AND owner_id IS NULL AND ai_fleet_tier = 0
            """, (planet_id,))
            planet = cur.fetchone()
            if not planet:
                return err('Планета недоступна или уже занята')

            # Проверяем что планета в правильном секторе расы
            expected_sector = race.lower()
            if planet[3] and planet[3].lower() != expected_sector and planet[3].lower() != 'alpha':
                pass  # разрешаем если сектор alpha или совпадает с расой

            # Создаём столичную колонию
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

            cur.execute(f"""
                UPDATE {S}.empire_players
                SET home_planet_id=%s, colonies_count=1
                WHERE id=%s
            """, (planet[0], pid))

            # Стартовый флот: 1 разведчик + 1 Колонист
            tok = secrets.token_hex(32)
            start_ships = {'scout': 1, 'colonist': 1}
            cur.execute(f"""
                INSERT INTO {S}.empire_fleets
                  (owner_id, fleet_name, ships, total_attack, total_defense,
                   current_planet_id, pos_x, pos_y, status, mission)
                VALUES (%s, %s, %s::jsonb, %s, %s, %s, %s, %s, 'orbit', 'defend')
            """, (pid, f'Флот {nickname}', json.dumps(start_ships),
                  8, 5, planet[0], planet[1], planet[2]))

            # Выдаём токен сессии
            cur.execute(f"""
                UPDATE {S}.empire_players
                SET session_token=%s, is_online=true, last_seen_at=now()
                WHERE id=%s
            """, (tok, pid))
            conn.commit()

            # Получаем полный профиль
            cur.execute(f"""
                SELECT id, nickname, race, metal, energy, crystals, population, fuel, dark_matter,
                       score, rank_title, alliance_id, home_planet_id,
                       colonies_count, total_fleet_power, battles_won, battles_lost, planets_conquered
                FROM {S}.empire_players WHERE id=%s
            """, (pid,))
            row = cur.fetchone()
            return ok({'token': tok, 'player_id': pid, 'race': race, 'nickname': nickname,
                       'player': {
                           'id': row[0], 'nickname': row[1], 'race': row[2],
                           'metal': row[3], 'energy': row[4], 'crystals': row[5],
                           'population': row[6], 'fuel': row[7], 'dark_matter': row[8],
                           'score': row[9], 'rank_title': row[10], 'alliance_id': row[11],
                           'home_planet_id': row[12], 'colonies_count': row[13],
                           'total_fleet_power': row[14], 'battles_won': row[15],
                           'battles_lost': row[16], 'planets_conquered': row[17],
                       }})

        # ── ВХОД ─────────────────────────────────────────────────────────────
        if action == 'login' and method == 'POST':
            login    = body.get('login', '').strip().lower()
            password = body.get('password', '')
            cur.execute(f"""
                SELECT id, nickname, race, metal, energy, crystals, population, fuel, dark_matter,
                       score, rank_title, alliance_id, home_planet_id,
                       colonies_count, total_fleet_power, battles_won, battles_lost, planets_conquered,
                       account_status, email
                FROM {S}.empire_players
                WHERE (login=%s OR nickname=%s OR email=%s) AND password_hash=%s
            """, (login, login, login, hp(password)))
            row = cur.fetchone()
            if not row:
                return err('Неверный логин или пароль', 401)

            # Проверяем статус аккаунта
            status = row[18]
            if status == 'pending':
                return ok({
                    'status': 'verify_email',
                    'player_id': row[0],
                    'email': row[19],
                    'message': 'Подтвердите email для входа в игру'
                })
            if status == 'active' and not row[12]:
                # Верифицирован, но не выбрал планету
                return ok({
                    'status': 'choose_planet',
                    'player_id': row[0],
                    'race': row[2],
                    'nickname': row[1],
                    'message': 'Выберите стартовую планету'
                })

            tok = secrets.token_hex(32)
            cur.execute(f"""
                UPDATE {S}.empire_players
                SET session_token=%s, is_online=true, last_seen_at=now()
                WHERE id=%s
            """, (tok, row[0]))
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

        # ── ПРОФИЛЬ ───────────────────────────────────────────────────────────
        if action == 'me':
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
            return ok({'player': {
                'id': row[0], 'nickname': row[1], 'race': row[2],
                'metal': row[3], 'energy': row[4], 'crystals': row[5],
                'population': row[6], 'fuel': row[7], 'dark_matter': row[8],
                'score': row[9], 'rank_title': row[10], 'alliance_id': row[11],
                'home_planet_id': row[12], 'colonies_count': row[13],
                'total_fleet_power': row[14], 'battles_won': row[15],
                'battles_lost': row[16], 'planets_conquered': row[17],
            }})

        # ── СОХРАНЕНИЕ ────────────────────────────────────────────────────────
        if action == 'save' and method == 'POST':
            if not token:
                return err('Не авторизован', 401)
            cur.execute(f"SELECT id FROM {S}.empire_players WHERE session_token=%s", (token,))
            row = cur.fetchone()
            if not row:
                return err('Сессия истекла', 401)
            pid = row[0]
            cur.execute(f"""
                UPDATE {S}.empire_players SET
                  metal=GREATEST(metal,%s), energy=GREATEST(energy,%s),
                  crystals=GREATEST(crystals,%s), fuel=GREATEST(fuel,%s),
                  dark_matter=GREATEST(dark_matter,%s),
                  score=GREATEST(score,%s), last_seen_at=now()
                WHERE id=%s
            """, (body.get('metal',0), body.get('energy',0), body.get('crystals',0),
                  body.get('fuel',0), body.get('dark_matter',0), int(body.get('score',0)), pid))
            conn.commit()
            return ok({'saved': True})

        # ── РЕЙТИНГ ───────────────────────────────────────────────────────────
        if action == 'leaderboard':
            cur.execute(f"""
                SELECT p.id, p.nickname, p.race, p.score, p.rank_title,
                       p.planets_conquered, p.battles_won,
                       COALESCE(a.alliance_name, a.name),
                       p.is_online, p.last_seen_at
                FROM {S}.empire_players p
                LEFT JOIN {S}.empire_alliances a ON a.id = p.alliance_id
                WHERE p.account_status = 'active'
                ORDER BY p.score DESC LIMIT 50
            """)
            cols = ['id','nickname','race','score','rank_title','planets_conquered',
                    'battles_won','alliance','is_online','last_seen_at']
            return ok({'leaderboard': [dict(zip(cols, r)) for r in cur.fetchall()]})

        # ── СПИСОК ПЛАНЕТ ДЛЯ ВЫБОРА (в секторе расы) ─────────────────────────
        if action == 'available_planets':
            race = params.get('race', '')
            cur.execute(f"""
                SELECT id, name, pos_x, pos_y, planet_type, metal_rich, energy_rich, sector,
                       temperature, gravity
                FROM {S}.empire_planets
                WHERE owner_id IS NULL AND ai_fleet_tier = 0
                ORDER BY RANDOM() LIMIT 30
            """)
            cols = ['id','name','pos_x','pos_y','planet_type','metal_rich','energy_rich','sector',
                    'temperature','gravity']
            planets = [dict(zip(cols, r)) for r in cur.fetchall()]
            return ok({'planets': planets})

        return err('Неизвестное действие', 404)

    finally:
        cur.close()
        conn.close()
