"""
Космические Путешественники — ИИ Терминаторы.
GET  action=shop          — список товаров магазина ИИ
POST action=buy           — купить корабль/технологию/ремонтный ресурс
GET  action=agreements    — мои соглашения с ИИ
POST action=make_agreement {type: trade|tech|ceasefire, tech_id?} — заключить соглашение
POST action=ai_attack     — ИИ атакует игрока (триггерится если атакуют ИИ-планету)
POST action=repair_ship   — починить корабль (использует repair_kit + repair_bot)
GET  action=ai_status     — статус ИИ и незаселённые планеты
"""
import json, os, psycopg2, random

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p83915249_biotech_anime_store')

# Магазин ИИ — Терминаторы продают за металл/кристаллы
AI_SHOP = {
    # Корабли (покупка у ИИ — требуют спец. ремонт)
    'terminator_scout':      {'name': 'Т-Разведчик',     'icon': '🤖', 'type': 'ship',
                              'attack': 30, 'defense': 20, 'ai_only_repair': True,
                              'cost': {'metal': 300, 'crystals': 100}},
    'terminator_fighter':    {'name': 'Т-Истребитель',   'icon': '🦾', 'type': 'ship',
                              'attack': 80, 'defense': 60, 'ai_only_repair': True,
                              'cost': {'metal': 600, 'crystals': 250}},
    'terminator_cruiser':    {'name': 'Т-Крейсер',       'icon': '🔩', 'type': 'ship',
                              'attack': 200, 'defense': 180, 'ai_only_repair': True,
                              'cost': {'metal': 1200, 'crystals': 500}},
    'terminator_overlord':   {'name': 'Т-Повелитель',    'icon': '☠️', 'type': 'ship',
                              'attack': 500, 'defense': 450, 'ai_only_repair': True,
                              'cost': {'metal': 2500, 'crystals': 1000, 'energy': 500}},
    # Технологии ИИ
    'ai_nanoshield':         {'name': 'Нанощит ИИ',      'icon': '🔷', 'type': 'tech',
                              'effect': '+30% защита всего флота',
                              'cost': {'crystals': 600, 'metal': 400}},
    'ai_targeting':          {'name': 'ИИ-наведение',    'icon': '🎯', 'type': 'tech',
                              'effect': '+35% атака флота',
                              'cost': {'crystals': 700, 'metal': 350}},
    'ai_warp_core':          {'name': 'Варп-ядро ИИ',    'icon': '🌀', 'type': 'tech',
                              'effect': '+50% скорость строительства',
                              'cost': {'crystals': 800, 'energy': 600}},
    # Ремонтные ресурсы
    'repair_kit':            {'name': 'Ремонтный комплект', 'icon': '🔧', 'type': 'repair_kit',
                              'cost': {'metal': 150, 'crystals': 50}},
    'repair_bot':            {'name': 'Ремонтный бот',    'icon': '🤖', 'type': 'repair_bot',
                              'cost': {'metal': 300, 'crystals': 100, 'energy': 80}},
}

# Соглашения
AGREEMENT_COSTS = {
    'trade':     {'metal': 500,  'crystals': 200},
    'tech':      {'metal': 800,  'crystals': 400},
    'ceasefire': {'metal': 300,  'crystals': 150},
}

# Флот ИИ на незаселённых планетах
AI_FLEET_TIERS = [
    {'attack': 200,  'defense': 150,  'name': 'Патруль ИИ',     'reward': {'metal': 150, 'crystals': 80}},
    {'attack': 500,  'defense': 400,  'name': 'Страж ИИ',       'reward': {'metal': 300, 'crystals': 150}},
    {'attack': 1000, 'defense': 800,  'name': 'Элита ИИ',       'reward': {'metal': 600, 'crystals': 300}},
    {'attack': 2000, 'defense': 1800, 'name': 'Терминатор-Омега','reward': {'metal': 1200,'crystals': 600, 'energy': 400}},
]

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
    cur.execute(f"""SELECT id, nickname, race, resources, ships, techs, score,
                           repair_bots, repair_kits, alliance_id
                   FROM {SCHEMA}.players WHERE session_token=%s""", (token,))
    r = cur.fetchone()
    if not r:
        return None
    return {'id': r[0], 'nickname': r[1], 'race': r[2],
            'resources': r[3] or {}, 'ships': r[4] or {}, 'techs': r[5] or {},
            'score': r[6], 'repair_bots': r[7], 'repair_kits': r[8], 'alliance_id': r[9]}

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    method = event.get('httpMethod', 'GET')
    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token', '')
    params = event.get('queryStringParameters') or {}
    body = {}
    if event.get('body'):
        body = json.loads(event['body'])
    action = body.get('action') if method == 'POST' else params.get('action', 'shop')

    c = get_conn()
    cur = c.cursor()

    try:
        player = get_player(cur, token) if token else None

        # ── МАГАЗИН ──────────────────────────────────────────────────────────
        if action == 'shop':
            items = []
            for item_id, item in AI_SHOP.items():
                items.append({'id': item_id, **item})
            return ok({'shop': items, 'ai_name': 'Терминаторы',
                       'ai_icon': '🤖', 'ai_desc': 'Древняя раса машин. Торгуют технологиями и боевыми кораблями.'})

        # ── ПОКУПКА ───────────────────────────────────────────────────────────
        if action == 'buy' and method == 'POST':
            if not player:
                return err('Не авторизован', 401)
            item_id = body.get('item_id', '')
            qty     = max(1, int(body.get('quantity', 1)))
            if item_id not in AI_SHOP:
                return err('Товар не найден')
            item = AI_SHOP[item_id]
            res  = player['resources']

            total_cost = {k: v * qty for k, v in item['cost'].items()}
            for k, v in total_cost.items():
                if (res.get(k, 0)) < v:
                    return err(f"Недостаточно {k}: нужно {v}, есть {res.get(k, 0)}")

            # Списываем ресурсы
            new_res = {k: res.get(k, 0) - total_cost.get(k, 0) for k in res}
            # Для недостающих ключей
            for k in total_cost:
                if k not in new_res:
                    new_res[k] = -total_cost[k]

            ships = player['ships']
            techs = player['techs']

            if item['type'] == 'ship':
                ships[item_id] = ships.get(item_id, 0) + qty
            elif item['type'] == 'tech':
                techs[item_id] = 1
            elif item['type'] == 'repair_kit':
                cur.execute(f"UPDATE {SCHEMA}.players SET repair_kits=repair_kits+%s WHERE id=%s", (qty, player['id']))
            elif item['type'] == 'repair_bot':
                cur.execute(f"UPDATE {SCHEMA}.players SET repair_bots=repair_bots+%s WHERE id=%s", (qty, player['id']))

            cur.execute(f"""UPDATE {SCHEMA}.players
                           SET resources=%s, ships=%s, techs=%s, score=score+10
                           WHERE id=%s""",
                        (json.dumps(new_res), json.dumps(ships), json.dumps(techs), player['id']))

            # Запись в журнал покупок
            cur.execute(f"""INSERT INTO {SCHEMA}.shop_purchases
                           (player_id, item_type, item_id, quantity, cost_metal, cost_energy, cost_crystals)
                           VALUES (%s,%s,%s,%s,%s,%s,%s)""",
                        (player['id'], item['type'], item_id, qty,
                         total_cost.get('metal', 0), total_cost.get('energy', 0), total_cost.get('crystals', 0)))
            c.commit()
            return ok({'bought': True, 'item': item['name'], 'quantity': qty,
                       'resources': new_res, 'ships': ships, 'techs': techs})

        # ── МОИ СОГЛАШЕНИЯ ────────────────────────────────────────────────────
        if action == 'agreements':
            if not player:
                return err('Не авторизован', 401)
            cur.execute(f"""SELECT id, agreement_type, tech_id, expires_at, created_at
                           FROM {SCHEMA}.ai_trade_agreements WHERE player_id=%s AND expires_at > now()
                           ORDER BY created_at DESC""", (player['id'],))
            return ok({'agreements': [{'id': r[0], 'type': r[1], 'tech_id': r[2],
                                        'expires_at': str(r[3]), 'created_at': str(r[4])}
                                       for r in cur.fetchall()]})

        # ── ЗАКЛЮЧИТЬ СОГЛАШЕНИЕ ──────────────────────────────────────────────
        if action == 'make_agreement' and method == 'POST':
            if not player:
                return err('Не авторизован', 401)
            agr_type = body.get('type', 'trade')
            tech_id  = body.get('tech_id')
            if agr_type not in AGREEMENT_COSTS:
                return err('Неизвестный тип соглашения')
            cost = AGREEMENT_COSTS[agr_type]
            res  = player['resources']
            for k, v in cost.items():
                if res.get(k, 0) < v:
                    return err(f"Недостаточно ресурсов для соглашения. Нужно: {cost}")

            # Проверяем, нет ли уже такого активного соглашения
            cur.execute(f"""SELECT id FROM {SCHEMA}.ai_trade_agreements
                           WHERE player_id=%s AND agreement_type=%s AND expires_at > now()""",
                        (player['id'], agr_type))
            if cur.fetchone():
                return err('У вас уже есть активное соглашение этого типа')

            new_res = {k: res.get(k, 0) - cost.get(k, 0) for k in res}
            cur.execute(f"UPDATE {SCHEMA}.players SET resources=%s WHERE id=%s",
                        (json.dumps(new_res), player['id']))
            cur.execute(f"""INSERT INTO {SCHEMA}.ai_trade_agreements
                           (player_id, agreement_type, tech_id, duration_ticks, expires_at)
                           VALUES (%s,%s,%s,200, now() + interval '48 hours') RETURNING id""",
                        (player['id'], agr_type, tech_id))
            aid = cur.fetchone()[0]
            c.commit()

            msg = {'trade': 'Торговое соглашение заключено! Скидка 20% в магазине на 48 часов.',
                   'tech':  'Технологическое соглашение! Доступны технологии ИИ.',
                   'ceasefire': 'Перемирие заключено! ИИ не будет атаковать вас 48 часов.'}
            return ok({'signed': True, 'agreement_id': aid, 'message': msg.get(agr_type, ''),
                       'resources': new_res})

        # ── АТАКА ИИ НА ИГРОКА ────────────────────────────────────────────────
        if action == 'ai_attack' and method == 'POST':
            if not player:
                return err('Не авторизован', 401)
            tier = min(int(body.get('tier', 0)), len(AI_FLEET_TIERS) - 1)
            ai_fleet = AI_FLEET_TIERS[tier]

            # Считаем силу флота игрока
            ships    = player['ships']
            all_ship_stats = {
                'scout': (5, 3), 'fighter': (15, 10), 'cruiser': (40, 30),
                'battleship': (100, 80), 'dreadnought': (250, 200),
                'terminator_scout': (30, 20), 'terminator_fighter': (80, 60),
                'terminator_cruiser': (200, 180), 'terminator_overlord': (500, 450),
            }
            techs = player['techs']
            player_atk  = sum(all_ship_stats.get(s, (0,0))[0] * n for s, n in ships.items())
            player_def  = sum(all_ship_stats.get(s, (0,0))[1] * n for s, n in ships.items())

            # Бонусы от технологий
            if techs.get('plasma'):   player_atk  *= 1.15 * int(techs['plasma'])
            if techs.get('shields'):  player_def  *= 1.15 * int(techs['shields'])
            if techs.get('ai_nanoshield'):  player_def *= 1.30
            if techs.get('ai_targeting'):   player_atk *= 1.35

            # Проверяем перемирие
            cur.execute(f"""SELECT id FROM {SCHEMA}.ai_trade_agreements
                           WHERE player_id=%s AND agreement_type='ceasefire' AND expires_at > now()""",
                        (player['id'],))
            if cur.fetchone():
                return ok({'result': 'ceasefire', 'message': 'Перемирие активно — Терминаторы не атакуют!'})

            roll    = random.uniform(0.8, 1.2)
            p_score = (player_atk * 0.6 + player_def * 0.4) * roll
            ai_score= ai_fleet['attack'] * 0.6 + ai_fleet['defense'] * 0.4

            log = [f"🤖 Терминаторы атакуют! Флот: «{ai_fleet['name']}»",
                   f"Ваши силы — Атака: {int(player_atk)}, Защита: {int(player_def)}",
                   f"ИИ — Атака: {ai_fleet['attack']}, Защита: {ai_fleet['defense']}"]

            res = player['resources']
            if p_score >= ai_score:
                log.append("✅ Атака отражена! Терминаторы отступили.")
                reward = ai_fleet['reward']
                new_res = {k: res.get(k, 0) + reward.get(k, 0) for k in set(list(res.keys()) + list(reward.keys()))}
                cur.execute(f"UPDATE {SCHEMA}.players SET resources=%s, score=score+30 WHERE id=%s",
                            (json.dumps(new_res), player['id']))
                c.commit()
                return ok({'result': 'victory', 'log': log, 'reward': reward, 'resources': new_res})
            else:
                loss_pct = 0.25
                new_ships = {k: max(0, int(v * (1 - loss_pct))) for k, v in ships.items()}
                res_loss = {'metal': int(res.get('metal', 0) * 0.1), 'energy': int(res.get('energy', 0) * 0.1)}
                new_res = {k: max(0, res.get(k, 0) - res_loss.get(k, 0)) for k in res}
                log.append(f"❌ Атака успешна! Вы потеряли ~25% флота и 10% ресурсов.")
                cur.execute(f"UPDATE {SCHEMA}.players SET resources=%s, ships=%s WHERE id=%s",
                            (json.dumps(new_res), json.dumps(new_ships), player['id']))
                c.commit()
                return ok({'result': 'defeat', 'log': log, 'ships': new_ships, 'resources': new_res})

        # ── РЕМОНТ КОРАБЛЕЙ ───────────────────────────────────────────────────
        if action == 'repair_ship' and method == 'POST':
            if not player:
                return err('Не авторизован', 401)
            ship_id = body.get('ship_id', '')
            if ship_id not in player['ships']:
                return err('Корабль не найден')
            if player['repair_bots'] < 1 or player['repair_kits'] < 1:
                return err('Нужен ремонтный бот и ремонтный комплект (купите в магазине ИИ)')
            cur.execute(f"""UPDATE {SCHEMA}.players
                           SET repair_bots=repair_bots-1, repair_kits=repair_kits-1
                           WHERE id=%s""", (player['id'],))
            c.commit()
            return ok({'repaired': True, 'ship_id': ship_id,
                       'message': f'Корабль {ship_id} отремонтирован. Использован 1 бот и 1 комплект.'})

        # ── СТАТУС ИИ ─────────────────────────────────────────────────────────
        if action == 'ai_status':
            # Возвращаем незаселённые планеты (под управлением ИИ) и описание ИИ
            cur.execute(f"""SELECT id, name, type, pos_x, pos_y, size
                           FROM {SCHEMA}.planets WHERE controlling_alliance_id IS NULL
                           ORDER BY id LIMIT 20""")
            planets = [{'id': r[0], 'name': r[1], 'type': r[2],
                        'pos_x': float(r[3]), 'pos_y': float(r[4]), 'size': r[5]} for r in cur.fetchall()]
            return ok({
                'ai_race': {'name': 'Терминаторы', 'icon': '☠️',
                            'desc': 'Древняя раса машин, контролирующая незаселённые системы.',
                            'fleets': AI_FLEET_TIERS},
                'ai_planets': planets,
                'shop_items': len(AI_SHOP)
            })

        return err('Неизвестное действие', 404)

    finally:
        cur.close()
        c.close()
