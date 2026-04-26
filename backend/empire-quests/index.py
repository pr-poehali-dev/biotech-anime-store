"""
Галактическая Империя — Ежедневные задания.
GET  action=my_quests          — получить задания на сегодня (создаёт если нет)
POST action=claim {quest_id}   — забрать награду за выполненное задание
POST action=progress {quest_id, amount} — засчитать прогресс (вызывается внутренне)
GET  action=streak             — серия дней активности
"""
import json, os, psycopg2, datetime, random

S = os.environ.get('MAIN_DB_SCHEMA', 't_p83915249_biotech_anime_store')

# ── Библиотека заданий ────────────────────────────────────────────────────────
QUESTS = {
    # Боевые
    'daily_battle':    {'name':'Боевое крещение',    'icon':'⚔️',  'cat':'battle',   'desc':'Проведи 1 битву',              'target':1,  'reward':{'metal':500,  'energy':300,  'crystals':100, 'score':50}},
    'daily_victory':   {'name':'Победитель',         'icon':'🏆',  'cat':'battle',   'desc':'Выиграй 1 сражение',           'target':1,  'reward':{'metal':800,  'energy':500,  'crystals':200, 'score':100}},
    'daily_fleet':     {'name':'Адмирал дня',        'icon':'🚀',  'cat':'battle',   'desc':'Отправь флот в миссию',        'target':1,  'reward':{'metal':400,  'energy':400,  'fuel':200,     'score':40}},
    'daily_spy':       {'name':'Тень галактики',     'icon':'🕵️',  'cat':'battle',   'desc':'Проведи шпионскую миссию',    'target':1,  'reward':{'crystals':300,'dark_matter':5,'score':60}},

    # Экономика
    'daily_build':     {'name':'Строитель',          'icon':'🏗️',  'cat':'economy',  'desc':'Улучши любое здание',          'target':1,  'reward':{'metal':600,  'energy':400,  'crystals':150, 'score':50}},
    'daily_research':  {'name':'Учёный',             'icon':'🔬',  'cat':'economy',  'desc':'Исследуй технологию',          'target':1,  'reward':{'crystals':500,'energy':300,  'score':80}},
    'daily_mine':      {'name':'Добытчик',           'icon':'⛏️',  'cat':'economy',  'desc':'Добудь ресурсы кораблями',     'target':1,  'reward':{'metal':1000, 'fuel':200,     'score':60}},
    'daily_trade':     {'name':'Торговец',           'icon':'💱',  'cat':'economy',  'desc':'Соверши торговую сделку',      'target':1,  'reward':{'metal':500,  'crystals':300, 'score':40}},

    # Экспансия
    'daily_colonize':  {'name':'Первопроходец',      'icon':'🪐',  'cat':'expansion','desc':'Колонизируй планету',          'target':1,  'reward':{'metal':1500, 'energy':1000, 'crystals':500, 'score':200}},
    'daily_chat':      {'name':'Дипломат',           'icon':'💬',  'cat':'social',   'desc':'Напиши сообщение в чат',       'target':1,  'reward':{'energy':300,  'score':20}},
    'daily_login':     {'name':'Командор онлайн',    'icon':'🌟',  'cat':'social',   'desc':'Войди в игру сегодня',         'target':1,  'reward':{'metal':300,  'energy':200,  'crystals':50,  'score':10}},
    'daily_tick':      {'name':'Управляющий',        'icon':'⚡',  'cat':'economy',  'desc':'Собери производство ресурсов', 'target':1,  'reward':{'metal':400,  'energy':400,  'score':30}},

    # Особые
    'daily_alliance':  {'name':'Союзник',            'icon':'🔱',  'cat':'social',   'desc':'Отправь сообщение в чат альянса','target':1,'reward':{'energy':500, 'crystals':200,'score':50}},
    'daily_ships':     {'name':'Кораблестроитель',   'icon':'🛸',  'cat':'economy',  'desc':'Построй 3 любых корабля',      'target':3,  'reward':{'metal':800,  'fuel':300,     'score':70}},
    'daily_score':     {'name':'Амбициозный',        'icon':'📈',  'cat':'social',   'desc':'Набери 100 очков за день',     'target':100,'reward':{'crystals':400,'dark_matter':10,'score':100}},
}

# Каждый день — 5 случайных заданий из пула
DAILY_COUNT = 5

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
    cur.execute(f"SELECT id, nickname, score FROM {S}.empire_players WHERE session_token=%s", (token,))
    r = cur.fetchone()
    return {'id': r[0], 'nickname': r[1], 'score': r[2]} if r else None

def seed_daily_quests(cur, player_id, today):
    """Генерировать 5 заданий на день детерминированно по player_id+date."""
    rng = random.Random(f"{player_id}-{today}")
    chosen = rng.sample(list(QUESTS.keys()), DAILY_COUNT)
    for qid in chosen:
        q = QUESTS[qid]
        cur.execute(f"""
            INSERT INTO {S}.player_daily_quests (player_id, quest_id, quest_date, progress, target)
            VALUES (%s, %s, %s, 0, %s)
            ON CONFLICT (player_id, quest_id, quest_date) DO NOTHING
        """, (player_id, qid, today, q['target']))
    # Задание «войди в игру» — сразу засчитываем
    if 'daily_login' in chosen:
        cur.execute(f"""
            UPDATE {S}.player_daily_quests
            SET progress = target, completed = true
            WHERE player_id=%s AND quest_id='daily_login' AND quest_date=%s
        """, (player_id, today))

def handler(event: dict, context) -> dict:
    """Ежедневные задания — 5 уникальных квестов каждый день с наградами."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    body   = {}
    if event.get('body'):
        body = json.loads(event['body'])
    action = body.get('action') if method == 'POST' else params.get('action', 'my_quests')
    token  = get_token(event)

    conn = db()
    cur  = conn.cursor()

    try:
        player = get_player(cur, token)
        if not player:
            return err('Не авторизован', 401)

        today = datetime.date.today()

        # ── МОИ ЗАДАНИЯ ──────────────────────────────────────────────────────
        if action == 'my_quests':
            # Генерируем если ещё нет
            seed_daily_quests(cur, player['id'], today)
            conn.commit()

            cur.execute(f"""
                SELECT quest_id, progress, target, completed, claimed
                FROM {S}.player_daily_quests
                WHERE player_id=%s AND quest_date=%s
                ORDER BY quest_id
            """, (player['id'], today))
            rows = cur.fetchall()

            quests_out = []
            for r in rows:
                qid, prog, tgt, done, claimed = r
                q = QUESTS.get(qid, {})
                quests_out.append({
                    'id':        qid,
                    'name':      q.get('name', qid),
                    'icon':      q.get('icon', '📋'),
                    'cat':       q.get('cat', 'other'),
                    'desc':      q.get('desc', ''),
                    'progress':  prog,
                    'target':    tgt,
                    'completed': done,
                    'claimed':   claimed,
                    'pct':       min(100, int(prog / max(tgt, 1) * 100)),
                    'reward':    q.get('reward', {}),
                })

            # Считаем серию дней
            cur.execute(f"""
                SELECT quest_date FROM {S}.player_daily_quests
                WHERE player_id=%s AND claimed=true
                GROUP BY quest_date ORDER BY quest_date DESC LIMIT 30
            """, (player['id'],))
            dates = [r[0] for r in cur.fetchall()]
            streak = 0
            check = today
            for d in dates:
                if d == check:
                    streak += 1
                    check = check - datetime.timedelta(days=1)
                else:
                    break

            completed_today = sum(1 for q in quests_out if q['completed'])
            claimed_today   = sum(1 for q in quests_out if q['claimed'])

            return ok({
                'quests':          quests_out,
                'date':            str(today),
                'streak':          streak,
                'completed_today': completed_today,
                'claimed_today':   claimed_today,
                'all_done':        completed_today == DAILY_COUNT,
            })

        # ── ЗАБРАТЬ НАГРАДУ ──────────────────────────────────────────────────
        if action == 'claim' and method == 'POST':
            qid = body.get('quest_id')
            if not qid:
                return err('Укажите quest_id')

            cur.execute(f"""
                SELECT id, completed, claimed, quest_id
                FROM {S}.player_daily_quests
                WHERE player_id=%s AND quest_id=%s AND quest_date=%s
            """, (player['id'], qid, today))
            row = cur.fetchone()
            if not row:
                return err('Задание не найдено')
            if not row[1]:
                return err('Задание ещё не выполнено')
            if row[2]:
                return err('Награда уже получена')

            q = QUESTS.get(qid, {})
            reward = q.get('reward', {})

            # Начисляем ресурсы
            sets = []
            vals = []
            for res, val in reward.items():
                if res == 'score':
                    continue
                sets.append(f"{res}={res}+%s")
                vals.append(val)
            if sets:
                vals.append(player['id'])
                cur.execute(f"UPDATE {S}.empire_players SET {', '.join(sets)} WHERE id=%s", vals)

            # Очки отдельно
            score_bonus = reward.get('score', 0)
            if score_bonus:
                cur.execute(f"UPDATE {S}.empire_players SET score=score+%s WHERE id=%s", (score_bonus, player['id']))

            cur.execute(f"""
                UPDATE {S}.player_daily_quests SET claimed=true
                WHERE player_id=%s AND quest_id=%s AND quest_date=%s
            """, (player['id'], qid, today))
            conn.commit()

            return ok({
                'claimed':  True,
                'quest':    q.get('name', qid),
                'reward':   reward,
                'message':  f"Получено: " + " ".join(
                    [f"⛏️{reward.get('metal',0)}" if reward.get('metal') else '',
                     f"⚡{reward.get('energy',0)}" if reward.get('energy') else '',
                     f"💎{reward.get('crystals',0)}" if reward.get('crystals') else '',
                     f"⛽{reward.get('fuel',0)}" if reward.get('fuel') else '',
                     f"🌑{reward.get('dark_matter',0)}" if reward.get('dark_matter') else '',
                     f"⭐{reward.get('score',0)}" if reward.get('score') else '',
                    ]).strip(),
            })

        # ── ЗАСЧИТАТЬ ПРОГРЕСС ───────────────────────────────────────────────
        if action == 'progress' and method == 'POST':
            qid    = body.get('quest_id')
            amount = int(body.get('amount', 1))
            if not qid:
                return err('Укажите quest_id')
            cur.execute(f"""
                UPDATE {S}.player_daily_quests
                SET
                  progress  = LEAST(progress + %s, target),
                  completed = CASE WHEN progress + %s >= target THEN true ELSE completed END
                WHERE player_id=%s AND quest_id=%s AND quest_date=%s AND completed=false
                RETURNING id, progress, target
            """, (amount, amount, player['id'], qid, today))
            row = cur.fetchone()
            conn.commit()
            if row:
                return ok({'updated': True, 'progress': row[1], 'target': row[2], 'done': row[1] >= row[2]})
            return ok({'updated': False})

        return err('Неизвестное действие', 404)

    finally:
        cur.close()
        conn.close()
