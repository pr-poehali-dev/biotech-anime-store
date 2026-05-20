import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

ADMIN_PASSWORD = '567765'
SCHEMA = 't_p83915249_biotech_anime_store'

def esc(v):
    if v is None or v == '':
        return 'NULL'
    if isinstance(v, bool):
        return 'TRUE' if v else 'FALSE'
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"

def row_to_dict(row):
    d = dict(row)
    for k in ['created_at', 'updated_at', 'report_at', 'accepted_at', 'deadline']:
        if d.get(k):
            d[k] = d[k].isoformat() if hasattr(d[k], 'isoformat') else d[k]
    if d.get('price') is not None:
        d['price'] = float(d['price'])
    return d

def handler(event, context):
    '''Задачи: GET — список (всем), POST — создание/редактирование/отчёт/приёмка'''
    method = event.get('httpMethod', 'GET')
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password, X-Engineer-Login, X-Engineer-Password',
    }
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    headers = event.get('headers') or {}
    admin_pwd = headers.get('X-Admin-Password') or headers.get('x-admin-password') or ''
    is_admin = admin_pwd == ADMIN_PASSWORD

    eng_login = headers.get('X-Engineer-Login') or headers.get('x-engineer-login') or ''
    eng_pwd = headers.get('X-Engineer-Password') or headers.get('x-engineer-password') or ''

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor(cursor_factory=RealDictCursor)

    eng_id = None
    if eng_login and eng_pwd:
        cur.execute(f"SELECT id FROM {SCHEMA}.engineers WHERE login = {esc(eng_login)} AND password = {esc(eng_pwd)} AND active = TRUE LIMIT 1")
        r = cur.fetchone()
        if r:
            eng_id = r['id']

    try:
        if method == 'GET':
            cur.execute(f"""
                SELECT t.*, e.name as engineer_name, e.specialty as engineer_specialty
                FROM {SCHEMA}.tasks t
                LEFT JOIN {SCHEMA}.engineers e ON e.id = t.engineer_id
                ORDER BY t.created_at DESC
            """)
            rows = cur.fetchall()
            data = [row_to_dict(r) for r in rows]
            return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps(data, ensure_ascii=False)}

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            action = body.get('action', '')

            if action == 'report':
                if not eng_id:
                    return {'statusCode': 401, 'headers': cors, 'body': json.dumps({'error': 'engineer auth required'})}
                tid = int(body.get('id'))
                report = body.get('report', '')
                cur.execute(f"UPDATE {SCHEMA}.tasks SET engineer_report = {esc(report)}, status = 'reported', report_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = {tid} AND engineer_id = {eng_id}")
                conn.commit()
                return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'success': True})}

            if action == 'take':
                if not eng_id:
                    return {'statusCode': 401, 'headers': cors, 'body': json.dumps({'error': 'engineer auth required'})}
                tid = int(body.get('id'))
                cur.execute(f"UPDATE {SCHEMA}.tasks SET engineer_id = {eng_id}, status = 'in_progress', updated_at = CURRENT_TIMESTAMP WHERE id = {tid} AND (engineer_id IS NULL OR engineer_id = {eng_id})")
                conn.commit()
                return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'success': True})}

            if not is_admin:
                return {'statusCode': 403, 'headers': cors, 'body': json.dumps({'error': 'forbidden'})}

            if action == 'create':
                title = body.get('title', '').strip()
                if not title:
                    return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'title required'})}
                description = body.get('description', '')
                customer = body.get('customer', '')
                address = body.get('address', '')
                price = body.get('price') or 0
                deadline = body.get('deadline') or None
                engineer_id = body.get('engineer_id') or None
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.tasks (title, description, customer, address, price, deadline, engineer_id, status)
                    VALUES ({esc(title)}, {esc(description)}, {esc(customer)}, {esc(address)}, {esc(price)}, {esc(deadline)}, {esc(engineer_id)}, {esc('assigned' if engineer_id else 'new')})
                    RETURNING id
                """)
                tid = cur.fetchone()['id']
                conn.commit()
                return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'success': True, 'id': tid})}

            if action == 'update':
                tid = int(body.get('id'))
                fields = []
                for k in ['title', 'description', 'customer', 'address']:
                    if k in body:
                        fields.append(f"{k} = {esc(body[k])}")
                if 'price' in body:
                    fields.append(f"price = {esc(body['price'] or 0)}")
                if 'deadline' in body:
                    fields.append(f"deadline = {esc(body['deadline'] or None)}")
                if 'engineer_id' in body:
                    fields.append(f"engineer_id = {esc(body['engineer_id'] or None)}")
                if 'status' in body:
                    fields.append(f"status = {esc(body['status'])}")
                fields.append("updated_at = CURRENT_TIMESTAMP")
                cur.execute(f"UPDATE {SCHEMA}.tasks SET {', '.join(fields)} WHERE id = {tid}")
                conn.commit()
                return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'success': True})}

            if action == 'accept':
                tid = int(body.get('id'))
                cur.execute(f"UPDATE {SCHEMA}.tasks SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = {tid}")
                conn.commit()
                return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'success': True})}

            if action == 'reject':
                tid = int(body.get('id'))
                reason = body.get('reason', '')
                cur.execute(f"UPDATE {SCHEMA}.tasks SET status = 'in_progress', rejection_reason = {esc(reason)}, updated_at = CURRENT_TIMESTAMP WHERE id = {tid}")
                conn.commit()
                return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'success': True})}

            if action == 'delete':
                tid = int(body.get('id'))
                cur.execute(f"UPDATE {SCHEMA}.tasks SET status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE id = {tid}")
                conn.commit()
                return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'success': True})}

            return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'unknown action'})}

        return {'statusCode': 405, 'headers': cors, 'body': 'Method not allowed'}
    finally:
        cur.close()
        conn.close()
