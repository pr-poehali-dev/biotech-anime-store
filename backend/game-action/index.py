"""
Игровые действия: движение базы, развертывание, производство войск, импланты, атака, альянсы.
POST /move-base — переместить базу (сбрасывает уровень до 10)
POST /deploy-base — развернуть/свернуть базу
POST /upgrade-base — улучшить базу (требует ресурсы)
POST /train-unit — обучить юнита
POST /implant-unit — установить имплант солдату
POST /attack — атаковать врага / монстра
POST /create-alliance — создать альянс
POST /join-alliance — вступить в альянс
POST /land-planet — высадиться на планету
POST /add-defense — добавить защиту базы
POST /upgrade-commander — прокачать командира
"""
import json
import os
import psycopg2
import math

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p83915249_biotech_anime_store')

UNIT_COSTS = {
    'warrior':    {'gold': 100, 'metal': 50,  'crystal': 0,   'bio': 20,  'energy': 5},
    'sniper':     {'gold': 200, 'metal': 80,  'crystal': 30,  'bio': 50,  'energy': 8},
    'assault':    {'gold': 150, 'metal': 120, 'crystal': 20,  'bio': 40,  'energy': 6},
    'saboteur':   {'gold': 180, 'metal': 60,  'crystal': 50,  'bio': 80,  'energy': 10},
    'drone_op':   {'gold': 220, 'metal': 100, 'crystal': 80,  'bio': 30,  'energy': 12},
    'technician': {'gold': 250, 'metal': 150, 'crystal': 100, 'bio': 20,  'energy': 15},
}

UNIT_STATS = {
    'warrior':    {'hp': 120, 'atk': 15, 'def': 10},
    'sniper':     {'hp': 80,  'atk': 40, 'def': 5},
    'assault':    {'hp': 150, 'atk': 25, 'def': 20},
    'saboteur':   {'hp': 90,  'atk': 35, 'def': 8},
    'drone_op':   {'hp': 100, 'atk': 20, 'def': 12},
    'technician': {'hp': 110, 'atk': 18, 'def': 15},
}

IMPLANT_COSTS = {
    'eye_implant':      {'gold': 300, 'crystal': 150, 'bio': 200},
    'arm_implant':      {'gold': 400, 'metal': 200,   'bio': 150},
    'leg_implant':      {'gold': 350, 'metal': 180,   'bio': 180},
    'spine_implant':    {'gold': 500, 'crystal': 200, 'bio': 300},
    'brain_implant':    {'gold': 600, 'crystal': 300, 'bio': 400},
    'comm_implant':     {'gold': 450, 'crystal': 250, 'bio': 200},
    'tech_implant':     {'gold': 550, 'metal': 300,   'bio': 250},
    'armor_implant':    {'gold': 400, 'metal': 300,   'bio': 100},
}

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
    cur.execute(f"SELECT id, nickname, faction, energy, gold, metal, crystal, bio_matter, score, alliance_id, planet_id FROM {SCHEMA}.players WHERE session_token=%s", (token,))
    r = cur.fetchone()
    if not r:
        return None
    return {'id': r[0], 'nickname': r[1], 'faction': r[2], 'energy': r[3], 'gold': r[4], 'metal': r[5], 'crystal': r[6], 'bio_matter': r[7], 'score': r[8], 'alliance_id': r[9], 'planet_id': r[10]}

def spend_energy(cur, conn, player_id, amount):
    cur.execute(f"UPDATE {SCHEMA}.players SET energy = energy - %s WHERE id = %s AND energy >= %s RETURNING energy", (amount, player_id, amount))
    r = cur.fetchone()
    conn.commit()
    return r is not None

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
    body = {}
    if event.get('body'):
        body = json.loads(event['body'])
    action = body.get('action', '')

    conn = get_conn()
    cur = conn.cursor()

    try:
        player = get_player(cur, token)
        if not player:
            return err('Не авторизован', 401)

        pid = player['id']

        # Переместить базу
        if action == 'move-base':
            base_id = body.get('base_id')
            new_x = float(body.get('x', 50))
            new_y = float(body.get('y', 50))
            planet_id = body.get('planet_id')
            if not spend_energy(cur, conn, pid, 20):
                return err('Недостаточно энергии (нужно 20)')
            cur.execute(f"SELECT id, level, is_deployed FROM {SCHEMA}.bases WHERE id=%s AND owner_id=%s", (base_id, pid))
            base = cur.fetchone()
            if not base:
                return err('База не найдена')
            if base[2]:
                return err('Сначала сверните базу')
            new_level = min(base[1], 10)
            cur.execute(f"UPDATE {SCHEMA}.bases SET pos_x=%s, pos_y=%s, planet_id=%s, level=%s WHERE id=%s", (new_x, new_y, planet_id, new_level, base_id))
            cur.execute(f"UPDATE {SCHEMA}.players SET planet_id=%s, pos_x=%s, pos_y=%s WHERE id=%s", (planet_id, new_x, new_y, pid))
            conn.commit()
            return ok({'success': True, 'new_level': new_level, 'message': f'База перемещена. Уровень сброшен до {new_level}'})

        # Развернуть/свернуть базу
        if action == 'deploy-base':
            base_id = body.get('base_id')
            deploy = body.get('deploy', True)
            if not spend_energy(cur, conn, pid, 10):
                return err('Недостаточно энергии (нужно 10)')
            cur.execute(f"UPDATE {SCHEMA}.bases SET is_deployed=%s WHERE id=%s AND owner_id=%s", (deploy, base_id, pid))
            conn.commit()
            action = 'развёрнута' if deploy else 'свёрнута'
            return ok({'success': True, 'message': f'База {action}'})

        # Улучшить базу (бесконечный уровень)
        if action == 'upgrade-base':
            base_id = body.get('base_id')
            cur.execute(f"SELECT level, is_deployed FROM {SCHEMA}.bases WHERE id=%s AND owner_id=%s", (base_id, pid))
            base = cur.fetchone()
            if not base:
                return err('База не найдена')
            if not base[1]:
                return err('База должна быть развёрнута')
            lvl = base[0]
            cost_gold = 200 * lvl
            cost_metal = 150 * lvl
            cost_crystal = 100 * lvl
            if player['gold'] < cost_gold or player['metal'] < cost_metal or player['crystal'] < cost_crystal:
                return err(f'Нужно: {cost_gold}💰 {cost_metal}⚙️ {cost_crystal}💎')
            new_hp = 1000 + lvl * 500
            if not spend_energy(cur, conn, pid, 5):
                return err('Недостаточно энергии (нужно 5)')
            cur.execute(f"UPDATE {SCHEMA}.players SET gold=gold-%s, metal=metal-%s, crystal=crystal-%s WHERE id=%s", (cost_gold, cost_metal, cost_crystal, pid))
            cur.execute(f"UPDATE {SCHEMA}.bases SET level=level+1, max_hp=%s, hp=%s WHERE id=%s", (new_hp, new_hp, base_id))
            conn.commit()
            return ok({'success': True, 'new_level': lvl + 1})

        # Обучить юнита
        if action == 'train-unit':
            base_id = body.get('base_id')
            unit_type = body.get('unit_type', 'warrior')
            if unit_type not in UNIT_COSTS:
                return err('Неизвестный тип юнита')
            cur.execute(f"SELECT id, is_deployed, planet_id, pos_x, pos_y FROM {SCHEMA}.bases WHERE id=%s AND owner_id=%s AND is_deployed=true", (base_id, pid))
            base = cur.fetchone()
            if not base:
                return err('База не найдена или не развёрнута')
            cost = UNIT_COSTS[unit_type]
            stats = UNIT_STATS[unit_type]
            if player['gold'] < cost['gold'] or player['metal'] < cost['metal'] or player['crystal'] < cost['crystal'] or player['bio_matter'] < cost['bio']:
                return err(f"Нужно: 💰{cost['gold']} ⚙️{cost['metal']} 💎{cost['crystal']} 🧬{cost['bio']}")
            if not spend_energy(cur, conn, pid, cost['energy']):
                return err(f"Недостаточно энергии (нужно {cost['energy']})")
            cur.execute(f"UPDATE {SCHEMA}.players SET gold=gold-%s, metal=metal-%s, crystal=crystal-%s, bio_matter=bio_matter-%s WHERE id=%s",
                        (cost['gold'], cost['metal'], cost['crystal'], cost['bio'], pid))
            cur.execute(f"""INSERT INTO {SCHEMA}.units (owner_id, base_id, planet_id, type, specialization, hp, max_hp, attack_power, defense_power, pos_x, pos_y)
                           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                        (pid, base_id, base[2], unit_type, 'none', stats['hp'], stats['hp'], stats['atk'], stats['def'], base[3], base[4]))
            unit_id = cur.fetchone()[0]
            conn.commit()
            return ok({'success': True, 'unit_id': unit_id, 'unit_type': unit_type})

        # Установить имплант
        if action == 'implant-unit':
            unit_id = body.get('unit_id')
            implant = body.get('implant')
            if implant not in IMPLANT_COSTS:
                return err('Неизвестный имплант')
            cur.execute(f"SELECT id, implants, type, attack_power, defense_power FROM {SCHEMA}.units WHERE id=%s AND owner_id=%s AND is_alive=true", (unit_id, pid))
            unit = cur.fetchone()
            if not unit:
                return err('Юнит не найден')
            cost = IMPLANT_COSTS[implant]
            cg = cost.get('gold', 0); cm = cost.get('metal', 0); cc = cost.get('crystal', 0); cb = cost.get('bio', 0)
            if player['gold'] < cg or player['metal'] < cm or player['crystal'] < cc or player['bio_matter'] < cb:
                return err(f"Нужно: 💰{cg} ⚙️{cm} 💎{cc} 🧬{cb}")
            if not spend_energy(cur, conn, pid, 15):
                return err('Недостаточно энергии (нужно 15)')
            existing = unit[1] if unit[1] else []
            existing.append(implant)
            # Бонусы от имплантов
            bonus_atk = 5 if 'eye' in implant or 'arm' in implant else 0
            bonus_def = 8 if 'armor' in implant or 'leg' in implant else 0
            cur.execute(f"UPDATE {SCHEMA}.players SET gold=gold-%s, metal=metal-%s, crystal=crystal-%s, bio_matter=bio_matter-%s WHERE id=%s", (cg, cm, cc, cb, pid))
            cur.execute(f"UPDATE {SCHEMA}.units SET implants=%s, attack_power=attack_power+%s, defense_power=defense_power+%s WHERE id=%s",
                        (json.dumps(existing), bonus_atk, bonus_def, unit_id))
            # Специализация по импланту
            spec_map = {'eye_implant': 'sniper', 'arm_implant': 'assault', 'leg_implant': 'assault',
                        'spine_implant': 'saboteur', 'comm_implant': 'drone_op',
                        'tech_implant': 'technician', 'brain_implant': 'technician'}
            if implant in spec_map:
                cur.execute(f"UPDATE {SCHEMA}.units SET specialization=%s WHERE id=%s", (spec_map[implant], unit_id))
            conn.commit()
            return ok({'success': True, 'implant': implant, 'implants': existing})

        # Атака
        if action == 'attack':
            target_type = body.get('target_type', 'monster')
            target_id = body.get('target_id')
            if not spend_energy(cur, conn, pid, 25):
                return err('Недостаточно энергии (нужно 25)')
            cur.execute(f"SELECT SUM(attack_power) FROM {SCHEMA}.units WHERE owner_id=%s AND is_alive=true", (pid,))
            total_atk = cur.fetchone()[0] or 10
            import random
            if target_type == 'monster':
                monster_hp = random.randint(50, 300)
                won = total_atk > monster_hp
                loot = {'gold': random.randint(50, 200), 'metal': random.randint(20, 100), 'crystal': random.randint(10, 80), 'bio': random.randint(30, 150)} if won else {}
                if won:
                    cur.execute(f"UPDATE {SCHEMA}.players SET gold=gold+%s, metal=metal+%s, crystal=crystal+%s, bio_matter=bio_matter+%s, score=score+50 WHERE id=%s",
                                (loot['gold'], loot['metal'], loot['crystal'], loot['bio'], pid))
                conn.commit()
                msg = f"Монстр побеждён! +{loot.get('gold',0)}💰 +{loot.get('metal',0)}⚙️ +{loot.get('crystal',0)}💎 +{loot.get('bio',0)}🧬" if won else "Монстр слишком силён. Усильте армию!"
                return ok({'success': won, 'message': msg, 'loot': loot})
            else:
                return ok({'success': False, 'message': 'Неизвестная цель'})

        # Создать альянс
        if action == 'create-alliance':
            name = body.get('name', '').strip()
            faction = body.get('faction', player['faction'])
            emblem = body.get('emblem', '⚔️')
            desc = body.get('description', '')
            if not name:
                return err('Введите название альянса')
            if player['alliance_id']:
                return err('Вы уже состоите в альянсе')
            if player['gold'] < 1000:
                return err('Нужно 1000 💰 для создания альянса')
            cur.execute(f"INSERT INTO {SCHEMA}.alliances (name, faction, leader_id, emblem, description) VALUES (%s, %s, %s, %s, %s) RETURNING id", (name, faction, pid, emblem, desc))
            alliance_id = cur.fetchone()[0]
            cur.execute(f"UPDATE {SCHEMA}.players SET alliance_id=%s, gold=gold-1000 WHERE id=%s", (alliance_id, pid))
            conn.commit()
            return ok({'success': True, 'alliance_id': alliance_id})

        # Вступить в альянс
        if action == 'join-alliance':
            alliance_id = body.get('alliance_id')
            if player['alliance_id']:
                return err('Вы уже состоите в альянсе')
            cur.execute(f"SELECT id FROM {SCHEMA}.alliances WHERE id=%s", (alliance_id,))
            if not cur.fetchone():
                return err('Альянс не найден')
            cur.execute(f"UPDATE {SCHEMA}.players SET alliance_id=%s WHERE id=%s", (alliance_id, pid))
            conn.commit()
            return ok({'success': True})

        # Добавить защиту базы
        if action == 'add-defense':
            base_id = body.get('base_id')
            defense_type = body.get('defense_type')
            cur.execute(f"SELECT defenses, is_deployed FROM {SCHEMA}.bases WHERE id=%s AND owner_id=%s", (base_id, pid))
            base = cur.fetchone()
            if not base or not base[1]:
                return err('База не найдена или не развёрнута')
            defenses = base[0]
            costs = {
                'towers': {'gold': 300, 'metal': 200},
                'anti_tank': {'gold': 500, 'metal': 400, 'crystal': 100},
                'anti_drone': {'gold': 400, 'metal': 300, 'crystal': 150},
                'anti_rocket': {'gold': 600, 'metal': 500},
                'energy_dome': {'gold': 1000, 'crystal': 500, 'metal': 300},
            }
            if defense_type not in costs:
                return err('Неизвестный тип защиты')
            c = costs[defense_type]
            if player['gold'] < c.get('gold', 0) or player['metal'] < c.get('metal', 0) or player['crystal'] < c.get('crystal', 0):
                return err('Недостаточно ресурсов')
            if not spend_energy(cur, conn, pid, 10):
                return err('Недостаточно энергии')
            cur.execute(f"UPDATE {SCHEMA}.players SET gold=gold-%s, metal=metal-%s, crystal=crystal-%s WHERE id=%s",
                        (c.get('gold', 0), c.get('metal', 0), c.get('crystal', 0), pid))
            if defense_type == 'towers':
                defenses['towers'] = defenses.get('towers', 0) + 1
            else:
                defenses[defense_type] = True
            cur.execute(f"UPDATE {SCHEMA}.bases SET defenses=%s WHERE id=%s", (json.dumps(defenses), base_id))
            conn.commit()
            return ok({'success': True, 'defenses': defenses})

        # Прокачка командира (до 200 уровня)
        if action == 'upgrade-commander':
            base_id = body.get('base_id')
            implant_type = body.get('implant_type', 'neural')
            cur.execute(f"SELECT commander_level, commander_implants, is_deployed FROM {SCHEMA}.bases WHERE id=%s AND owner_id=%s", (base_id, pid))
            base = cur.fetchone()
            if not base or not base[2]:
                return err('База не найдена или не развёрнута')
            clvl = base[0]
            if clvl >= 200:
                return err('Командир достиг максимального уровня (200)')
            cost_gold = 500 + clvl * 100
            cost_crystal = 200 + clvl * 50
            if player['gold'] < cost_gold or player['crystal'] < cost_crystal:
                return err(f'Нужно: 💰{cost_gold} 💎{cost_crystal}')
            if not spend_energy(cur, conn, pid, 20):
                return err('Недостаточно энергии (нужно 20)')
            implants = base[1] if base[1] else {}
            implants[implant_type] = implants.get(implant_type, 0) + 1
            cur.execute(f"UPDATE {SCHEMA}.players SET gold=gold-%s, crystal=crystal-%s WHERE id=%s", (cost_gold, cost_crystal, pid))
            cur.execute(f"UPDATE {SCHEMA}.bases SET commander_level=commander_level+1, commander_implants=%s WHERE id=%s", (json.dumps(implants), base_id))
            conn.commit()
            return ok({'success': True, 'new_level': clvl + 1, 'implants': implants})

        # Высадиться на планету
        if action == 'land-planet':
            planet_id = body.get('planet_id')
            cur.execute(f"SELECT id, name FROM {SCHEMA}.planets WHERE id=%s", (planet_id,))
            planet = cur.fetchone()
            if not planet:
                return err('Планета не найдена')
            if not spend_energy(cur, conn, pid, 50):
                return err('Недостаточно энергии (нужно 50)')
            cur.execute(f"UPDATE {SCHEMA}.players SET planet_id=%s WHERE id=%s", (planet_id, pid))
            cur.execute(f"UPDATE {SCHEMA}.bases SET planet_id=%s WHERE owner_id=%s", (planet_id, pid))
            conn.commit()
            return ok({'success': True, 'planet': planet[1]})

        return err('Not found', 404)

    finally:
        cur.close()
        conn.close()