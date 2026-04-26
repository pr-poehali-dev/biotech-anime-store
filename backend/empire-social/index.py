"""
Империя Космоса — Социальная система.
GET  action=chat_global&since=N        — глобальный чат
GET  action=chat_alliance&since=N      — чат альянса
POST action=chat_send {channel, message}
GET  action=alliances                  — все альянсы
GET  action=my_alliance                — мой альянс
POST action=create_alliance {name, tag, emblem, description}
POST action=join_alliance {alliance_id}
POST action=leave_alliance
POST action=kick_member {player_id}    — только лидер
GET  action=diplomacy                  — мои дипломатические отношения
POST action=send_offer {receiver_id, type, message}
POST action=respond_offer {offer_id, accept}
GET  action=trade_market               — торговая площадка
POST action=create_trade {offer_resource, offer_amount, want_resource, want_amount}
POST action=accept_trade {trade_id}
"""
import json, os, re, psycopg2

S = os.environ.get('MAIN_DB_SCHEMA', 't_p83915249_biotech_anime_store')
MAX_MSG = 300

RACE_EMOJI = {
    'terrans': '🌍', 'zephyrians': '🌬️', 'vorath': '🔥', 'crystallids': '💎',
    'necrons': '💀', 'biotech': '🧬', 'mechanoids': '⚙️',
    'psychovores': '🧠', 'stellarians': '⭐',
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
    cur.execute(f"SELECT id, nickname, race, score, alliance_id FROM {S}.empire_players WHERE session_token=%s", (token,))
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
    conn = db()
    cur = conn.cursor()

    try:
        player = get_player(cur, token) if token else None

        # ── ГЛОБАЛЬНЫЙ ЧАТ ─────────────────────────────────────────────────────
        if action == 'chat_global':
            since = int(params.get('since', 0) or 0)
            if since > 0:
                cur.execute(f"""
                    SELECT id, player_id, nickname, race, message, created_at
                    FROM {S}.empire_chat WHERE channel='global' AND id > %s
                    ORDER BY created_at ASC LIMIT 60
                """, (since,))
            else:
                cur.execute(f"""
                    SELECT id, player_id, nickname, race, message, created_at
                    FROM {S}.empire_chat WHERE channel='global'
                    ORDER BY created_at DESC LIMIT 50
                """)
                rows = cur.fetchall()
                rows = list(reversed(rows))
                return ok({'messages': [{'id':r[0],'player_id':r[1],'nickname':r[2],
                    'race':r[3],'emoji':RACE_EMOJI.get(r[3],'👤'),
                    'message':r[4],'created_at':str(r[5])} for r in rows]})
            rows = cur.fetchall()
            return ok({'messages': [{'id':r[0],'player_id':r[1],'nickname':r[2],
                'race':r[3],'emoji':RACE_EMOJI.get(r[3],'👤'),
                'message':r[4],'created_at':str(r[5])} for r in rows]})

        # ── ЧАТ АЛЬЯНСА ────────────────────────────────────────────────────────
        if action == 'chat_alliance':
            if not player or not player['alliance_id']:
                return err('Вы не в альянсе', 403)
            since = int(params.get('since', 0) or 0)
            aid = player['alliance_id']
            if since > 0:
                cur.execute(f"""
                    SELECT id, player_id, nickname, race, message, created_at
                    FROM {S}.empire_chat WHERE channel='alliance' AND channel_id=%s AND id > %s
                    ORDER BY created_at ASC LIMIT 60
                """, (aid, since))
            else:
                cur.execute(f"""
                    SELECT id, player_id, nickname, race, message, created_at
                    FROM {S}.empire_chat WHERE channel='alliance' AND channel_id=%s
                    ORDER BY created_at DESC LIMIT 50
                """, (aid,))
                rows = cur.fetchall()
                rows = list(reversed(rows))
                return ok({'messages': [{'id':r[0],'player_id':r[1],'nickname':r[2],
                    'race':r[3],'emoji':RACE_EMOJI.get(r[3],'👤'),
                    'message':r[4],'created_at':str(r[5])} for r in rows]})
            rows = cur.fetchall()
            return ok({'messages': [{'id':r[0],'player_id':r[1],'nickname':r[2],
                'race':r[3],'emoji':RACE_EMOJI.get(r[3],'👤'),
                'message':r[4],'created_at':str(r[5])} for r in rows]})

        # ── ОТПРАВИТЬ СООБЩЕНИЕ ────────────────────────────────────────────────
        if action == 'chat_send' and method == 'POST':
            if not player:
                return err('Не авторизован', 401)
            channel = body.get('channel', 'global')
            msg = sanitize(body.get('message', ''))
            if not msg:
                return err('Пустое сообщение')
            channel_id = player['alliance_id'] if channel == 'alliance' else None
            if channel == 'alliance' and not player['alliance_id']:
                return err('Вы не в альянсе')
            cur.execute(f"""
                INSERT INTO {S}.empire_chat (player_id, nickname, race, channel, channel_id, message)
                VALUES (%s,%s,%s,%s,%s,%s) RETURNING id, created_at
            """, (player['id'], player['nickname'], player['race'], channel, channel_id, msg))
            r = cur.fetchone()
            conn.commit()
            return ok({'sent': True, 'id': r[0], 'created_at': str(r[1])})

        # ── ВСЕ АЛЬЯНСЫ ────────────────────────────────────────────────────────
        if action == 'alliances':
            cur.execute(f"""
                SELECT a.id, COALESCE(a.alliance_name, a.name), COALESCE(a.alliance_tag, a.tag),
                       a.emblem, COALESCE(a.alliance_desc, a.description),
                       a.race, a.members_count, a.total_score, a.planets_controlled,
                       a.is_recruiting, a.min_score_to_join, p.nickname
                FROM {S}.empire_alliances a
                JOIN {S}.empire_players p ON p.id = a.leader_id
                ORDER BY a.total_score DESC
            """)
            cols_list = ['id','name','tag','emblem','description','race','members','score',
                    'planets','recruiting','min_score','leader']
            return ok({'alliances': [dict(zip(cols_list, r)) for r in cur.fetchall()]})

        # ── МОЙ АЛЬЯНС ─────────────────────────────────────────────────────────
        if action == 'my_alliance':
            if not player or not player['alliance_id']:
                return err('Вы не в альянсе', 404)
            cur.execute(f"""
                SELECT a.id, COALESCE(a.alliance_name, a.name), COALESCE(a.alliance_tag, a.tag),
                       a.emblem, COALESCE(a.alliance_desc, a.description), a.race,
                       a.members_count, a.total_score, a.planets_controlled, a.leader_id,
                       p.nickname
                FROM {S}.empire_alliances a
                JOIN {S}.empire_players p ON p.id = a.leader_id
                WHERE a.id=%s
            """, (player['alliance_id'],))
            r = cur.fetchone()
            if not r:
                return err('Альянс не найден', 404)

            cur.execute(f"""
                SELECT id, nickname, race, score, is_online, last_seen_at
                FROM {S}.empire_players WHERE alliance_id=%s ORDER BY score DESC
            """, (player['alliance_id'],))
            members = [{'id':m[0],'nickname':m[1],'race':m[2],'score':m[3],
                        'online':m[4],'last_seen':str(m[5])} for m in cur.fetchall()]
            return ok({
                'id':r[0],'name':r[1],'tag':r[2],'emblem':r[3],'description':r[4],'race':r[5],
                'members_count':r[6],'score':r[7],'planets':r[8],'leader_id':r[9],
                'leader_name':r[10],'members':members,
            })

        # ── СОЗДАТЬ АЛЬЯНС ─────────────────────────────────────────────────────
        if action == 'create_alliance' and method == 'POST':
            if not player:
                return err('Не авторизован', 401)
            if player['alliance_id']:
                return err('Покиньте текущий альянс')
            name = body.get('name', '').strip()
            tag  = body.get('tag', '').strip().upper()
            emblem = body.get('emblem', '⭐')
            desc = body.get('description', '').strip()
            if len(name) < 2 or len(name) > 30:
                return err('Название: 2-30 символов')
            if len(tag) < 2 or len(tag) > 6:
                return err('Тег: 2-6 символов')
            cur.execute(f"SELECT id FROM {S}.empire_alliances WHERE name=%s OR tag=%s", (name, tag))
            if cur.fetchone():
                return err('Альянс с таким именем или тегом уже существует')
            cur.execute(f"""
                INSERT INTO {S}.empire_alliances (name, tag, leader_id, emblem, description, race, total_score, alliance_name, alliance_tag, alliance_desc)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
            """, (name, tag, player['id'], emblem, desc, player['race'], player['score'], name, tag, desc))
            aid = cur.fetchone()[0]
            cur.execute(f"UPDATE {S}.empire_players SET alliance_id=%s WHERE id=%s", (aid, player['id']))
            conn.commit()
            return ok({'created': True, 'alliance_id': aid, 'name': name, 'tag': tag})

        # ── ВСТУПИТЬ В АЛЬЯНС ──────────────────────────────────────────────────
        if action == 'join_alliance' and method == 'POST':
            if not player:
                return err('Не авторизован', 401)
            if player['alliance_id']:
                return err('Покиньте текущий альянс')
            aid = body.get('alliance_id')
            cur.execute(f"SELECT id, min_score_to_join, is_recruiting FROM {S}.empire_alliances WHERE id=%s", (aid,))
            a = cur.fetchone()
            if not a:
                return err('Альянс не найден')
            if not a[2]:
                return err('Альянс не набирает участников')
            if player['score'] < a[1]:
                return err(f'Минимальный рейтинг для вступления: {a[1]}')
            cur.execute(f"UPDATE {S}.empire_players SET alliance_id=%s WHERE id=%s", (aid, player['id']))
            cur.execute(f"UPDATE {S}.empire_alliances SET members_count=members_count+1, total_score=total_score+%s WHERE id=%s", (player['score'], aid))
            conn.commit()
            return ok({'joined': True, 'alliance_id': aid})

        # ── ПОКИНУТЬ АЛЬЯНС ────────────────────────────────────────────────────
        if action == 'leave_alliance' and method == 'POST':
            if not player or not player['alliance_id']:
                return err('Вы не в альянсе')
            cur.execute(f"SELECT leader_id FROM {S}.empire_alliances WHERE id=%s", (player['alliance_id'],))
            a = cur.fetchone()
            if a and a[0] == player['id']:
                return err('Лидер не может покинуть альянс. Назначьте нового лидера')
            cur.execute(f"UPDATE {S}.empire_players SET alliance_id=NULL WHERE id=%s", (player['id'],))
            cur.execute(f"UPDATE {S}.empire_alliances SET members_count=GREATEST(0,members_count-1) WHERE id=%s", (player['alliance_id'],))
            conn.commit()
            return ok({'left': True})

        # ── ДИПЛОМАТИЯ ─────────────────────────────────────────────────────────
        if action == 'diplomacy':
            if not player:
                return err('Не авторизован', 401)
            cur.execute(f"""
                SELECT d.id, d.relation_type, d.status, d.diplo_message, d.expires_at,
                       CASE WHEN d.sender_id=%s THEN r.nickname ELSE s.nickname END,
                       CASE WHEN d.sender_id=%s THEN 'sent' ELSE 'received' END
                FROM {S}.empire_diplomacy d
                JOIN {S}.empire_players s ON s.id = d.sender_id
                JOIN {S}.empire_players r ON r.id = d.receiver_id
                WHERE (d.sender_id=%s OR d.receiver_id=%s) AND d.expires_at > now()
                ORDER BY d.created_at DESC
            """, (player['id'], player['id'], player['id'], player['id']))
            return ok({'offers': [{'id':r[0],'type':r[1],'status':r[2],'message':r[3],
                                    'expires_at':str(r[4]),'other_player':r[5],'direction':r[6]}
                                   for r in cur.fetchall()]})

        # ── ОТПРАВИТЬ ДИПЛОМАТИЧЕСКОЕ ПРЕДЛОЖЕНИЕ ──────────────────────────────
        if action == 'send_offer' and method == 'POST':
            if not player:
                return err('Не авторизован', 401)
            receiver_id  = body.get('receiver_id')
            relation_type = body.get('type', 'peace')
            msg = body.get('message', '')[:200]
            if not receiver_id or int(receiver_id) == player['id']:
                return err('Неверный получатель')
            cur.execute(f"SELECT id, nickname FROM {S}.empire_players WHERE id=%s", (receiver_id,))
            if not cur.fetchone():
                return err('Игрок не найден')
            cur.execute(f"""
                INSERT INTO {S}.empire_diplomacy (sender_id, receiver_id, relation_type, diplo_message)
                VALUES (%s,%s,%s,%s) RETURNING id
            """, (player['id'], receiver_id, relation_type, msg))
            conn.commit()
            return ok({'sent': True})

        # ── ОТВЕТИТЬ НА ПРЕДЛОЖЕНИЕ ────────────────────────────────────────────
        if action == 'respond_offer' and method == 'POST':
            if not player:
                return err('Не авторизован', 401)
            offer_id = body.get('offer_id')
            accept   = body.get('accept', False)
            cur.execute(f"SELECT id, sender_id FROM {S}.empire_diplomacy WHERE id=%s AND receiver_id=%s", (offer_id, player['id']))
            if not cur.fetchone():
                return err('Предложение не найдено')
            status = 'accepted' if accept else 'rejected'
            cur.execute(f"UPDATE {S}.empire_diplomacy SET status=%s WHERE id=%s", (status, offer_id))
            conn.commit()
            return ok({'responded': True, 'accepted': accept})

        # ── ТОРГОВАЯ ПЛОЩАДКА ──────────────────────────────────────────────────
        if action == 'trade_market':
            cur.execute(f"""
                SELECT t.id, t.offer_resource, t.offer_amount, t.want_resource, t.want_amount,
                       p.nickname, p.race, t.created_at, t.expires_at
                FROM {S}.empire_trade t
                JOIN {S}.empire_players p ON p.id = t.seller_id
                WHERE COALESCE(t.trade_status, t.status)='open' AND t.expires_at > now()
                ORDER BY t.created_at DESC LIMIT 50
            """)
            cols_list = ['id','offer_res','offer_amt','want_res','want_amt','seller','race','created','expires']
            return ok({'trades': [dict(zip(cols_list, r)) for r in cur.fetchall()]})

        # ── СОЗДАТЬ ТОРГОВОЕ ПРЕДЛОЖЕНИЕ ────────────────────────────────────────
        if action == 'create_trade' and method == 'POST':
            if not player:
                return err('Не авторизован', 401)
            offer_res = body.get('offer_resource')
            offer_amt = int(body.get('offer_amount', 0))
            want_res  = body.get('want_resource')
            want_amt  = int(body.get('want_amount', 0))
            valid_res = ['metal', 'energy', 'crystals', 'fuel', 'dark_matter']
            if offer_res not in valid_res or want_res not in valid_res:
                return err('Неверный ресурс')
            if offer_amt <= 0 or want_amt <= 0:
                return err('Укажите количество')
            cur.execute(f"SELECT {offer_res} FROM {S}.empire_players WHERE id=%s", (player['id'],))
            avail = cur.fetchone()[0]
            if avail < offer_amt:
                return err(f'Недостаточно {offer_res}')
            cur.execute(f"UPDATE {S}.empire_players SET {offer_res}={offer_res}-%s WHERE id=%s", (offer_amt, player['id']))
            cur.execute(f"""
                INSERT INTO {S}.empire_trade (seller_id, offer_resource, offer_amount, want_resource, want_amount)
                VALUES (%s,%s,%s,%s,%s) RETURNING id
            """, (player['id'], offer_res, offer_amt, want_res, want_amt))
            conn.commit()
            return ok({'created': True})

        # ── ПРИНЯТЬ СДЕЛКУ ─────────────────────────────────────────────────────
        if action == 'accept_trade' and method == 'POST':
            if not player:
                return err('Не авторизован', 401)
            trade_id = body.get('trade_id')
            cur.execute(f"""
                SELECT id, seller_id, offer_resource, offer_amount, want_resource, want_amount
                FROM {S}.empire_trade WHERE id=%s AND COALESCE(trade_status, status)='open' AND expires_at > now()
            """, (trade_id,))
            trade = cur.fetchone()
            if not trade:
                return err('Сделка не найдена или истекла')
            if trade[1] == player['id']:
                return err('Нельзя принять свою сделку')
            cur.execute(f"SELECT {trade[4]} FROM {S}.empire_players WHERE id=%s", (player['id'],))
            avail = cur.fetchone()[0]
            if avail < trade[5]:
                return err(f'Недостаточно {trade[4]}')
            # Покупатель отдаёт want_resource, получает offer_resource
            cur.execute(f"UPDATE {S}.empire_players SET {trade[4]}={trade[4]}-%s, {trade[2]}={trade[2]}+%s WHERE id=%s",
                        (trade[5], trade[3], player['id']))
            # Продавец получает want_resource
            cur.execute(f"UPDATE {S}.empire_players SET {trade[4]}={trade[4]}+%s WHERE id=%s", (trade[5], trade[1]))
            cur.execute(f"UPDATE {S}.empire_trade SET trade_status='completed', status='completed', buyer_id=%s WHERE id=%s", (player['id'], trade_id))
            conn.commit()
            return ok({'traded': True, 'got_resource': trade[2], 'got_amount': trade[3]})

        return err('Неизвестное действие', 404)

    finally:
        cur.close()
        conn.close()