"""
Галактическая Империя — Магазин ресурсов (донат).
GET  action=catalog          — список пакетов
POST action=buy {package_id} — купить пакет (симуляция, без реальной оплаты)
GET  action=history          — история покупок игрока
"""
import json, os, psycopg2, datetime

S = os.environ.get('MAIN_DB_SCHEMA', 't_p83915249_biotech_anime_store')

PACKAGES = {
    'starter':    {'name':'Стартовый набор',    'price_rub':99,   'icon':'🎁', 'desc':'Идеально для начала',
                   'rewards':{'metal':5000,'energy':3000,'crystals':1000,'fuel':500,'dark_matter':0},    'bonus_score':100},
    'miner':      {'name':'Пакет Шахтёра',      'price_rub':199,  'icon':'⛏️', 'desc':'Ресурсы для добычи',
                   'rewards':{'metal':15000,'energy':5000,'crystals':2000,'fuel':1000,'dark_matter':0},  'bonus_score':300},
    'commander':  {'name':'Набор Командира',     'price_rub':499,  'icon':'⚔️', 'desc':'Военная мощь',
                   'rewards':{'metal':30000,'energy':20000,'crystals':8000,'fuel':5000,'dark_matter':10},'bonus_score':800},
    'admiral':    {'name':'Пакет Адмирала',      'price_rub':999,  'icon':'🌟', 'desc':'Для серьёзных игроков',
                   'rewards':{'metal':80000,'energy':60000,'crystals':25000,'fuel':15000,'dark_matter':50},'bonus_score':2500},
    'crystals_s': {'name':'Кристаллы S',         'price_rub':149,  'icon':'💎', 'desc':'1000 кристаллов',
                   'rewards':{'metal':0,'energy':0,'crystals':1000,'fuel':0,'dark_matter':0},            'bonus_score':50},
    'crystals_m': {'name':'Кристаллы M',         'price_rub':349,  'icon':'💎', 'desc':'3000 кристаллов + бонус',
                   'rewards':{'metal':0,'energy':0,'crystals':3500,'fuel':0,'dark_matter':0},            'bonus_score':150},
    'crystals_l': {'name':'Кристаллы L',         'price_rub':799,  'icon':'💎', 'desc':'8000 кристаллов + бонус',
                   'rewards':{'metal':0,'energy':0,'crystals':9000,'fuel':0,'dark_matter':0},            'bonus_score':400},
    'dark_matter':{'name':'Тёмная Материя',      'price_rub':299,  'icon':'🌑', 'desc':'100 единиц тёмной материи',
                   'rewards':{'metal':0,'energy':0,'crystals':0,'fuel':0,'dark_matter':100},             'bonus_score':200},
    'vip_week':   {'name':'VIP на неделю',        'price_rub':249,  'icon':'👑', 'desc':'+50% производство 7 дней',
                   'rewards':{'metal':10000,'energy':10000,'crystals':5000,'fuel':2000,'dark_matter':20},'bonus_score':500},
    'galaxy_pass':{'name':'Галактический Пропуск','price_rub':1999,'icon':'🚀', 'desc':'Максимальный набор месяца',
                   'rewards':{'metal':200000,'energy':150000,'crystals':60000,'fuel':40000,'dark_matter':200},'bonus_score':10000},
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

def handler(event: dict, context) -> dict:
    """Магазин ресурсов за донат — покупка пакетов с ресурсами."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    body = {}
    if event.get('body'):
        body = json.loads(event['body'])
    action = body.get('action') if method == 'POST' else params.get('action', 'catalog')
    token  = get_token(event)

    conn = db()
    cur  = conn.cursor()

    try:
        # ── КАТАЛОГ ПАКЕТОВ ─────────────────────────────────────────────────────
        if action == 'catalog':
            packages_list = []
            for pid, pkg in PACKAGES.items():
                packages_list.append({'id': pid, **pkg})
            return ok({'packages': packages_list})

        # ── КУПИТЬ ПАКЕТ (симуляция) ─────────────────────────────────────────────
        if action == 'buy' and method == 'POST':
            if not token:
                return err('Не авторизован', 401)
            cur.execute(f"SELECT id, nickname FROM {S}.empire_players WHERE session_token=%s", (token,))
            player = cur.fetchone()
            if not player:
                return err('Игрок не найден', 401)

            pkg_id = body.get('package_id')
            if pkg_id not in PACKAGES:
                return err('Пакет не найден')

            pkg = PACKAGES[pkg_id]
            r   = pkg['rewards']

            # Начисляем ресурсы
            cur.execute(f"""
                UPDATE {S}.empire_players SET
                  metal       = metal       + %s,
                  energy      = energy      + %s,
                  crystals    = crystals    + %s,
                  fuel        = fuel        + %s,
                  dark_matter = dark_matter + %s,
                  score       = score       + %s
                WHERE id = %s
            """, (r['metal'], r['energy'], r['crystals'], r['fuel'], r['dark_matter'],
                  pkg['bonus_score'], player[0]))

            # Сохраняем в историю покупок
            cur.execute(f"""
                INSERT INTO {S}.shop_purchases (player_id, package_id, package_name, price_rub, rewards, created_at)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (player[0], pkg_id, pkg['name'], pkg['price_rub'], json.dumps(r), datetime.datetime.now(datetime.timezone.utc)))

            conn.commit()
            return ok({
                'purchased': True,
                'package': pkg['name'],
                'rewards': r,
                'bonus_score': pkg['bonus_score'],
                'message': f'Получено: ⛏️{r["metal"]} ⚡{r["energy"]} 💎{r["crystals"]} ⛽{r["fuel"]} 🌑{r["dark_matter"]}',
            })

        # ── ИСТОРИЯ ПОКУПОК ──────────────────────────────────────────────────────
        if action == 'history':
            if not token:
                return err('Не авторизован', 401)
            cur.execute(f"SELECT id FROM {S}.empire_players WHERE session_token=%s", (token,))
            player = cur.fetchone()
            if not player:
                return err('Игрок не найден', 401)
            cur.execute(f"""
                SELECT package_id, package_name, price_rub, rewards, created_at
                FROM {S}.shop_purchases WHERE player_id=%s ORDER BY created_at DESC LIMIT 20
            """, (player[0],))
            history = [{'package_id':r[0],'name':r[1],'price':r[2],'rewards':r[3],'date':str(r[4])} for r in cur.fetchall()]
            return ok({'history': history})

        return err('Неизвестное действие', 404)

    finally:
        cur.close()
        conn.close()
