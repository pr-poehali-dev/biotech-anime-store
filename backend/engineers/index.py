import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

ADMIN_PASSWORD = '567765'
SCHEMA = 't_p83915249_biotech_anime_store'

def esc(v):
    if v is None:
        return 'NULL'
    if isinstance(v, bool):
        return 'TRUE' if v else 'FALSE'
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"

def handler(event, context):
    '''Управление инженерами и их вход. GET — список (для админа), POST — действия'''
    method = event.get('httpMethod', 'GET')
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
    }
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    headers = event.get('headers') or {}
    admin_pwd = headers.get('X-Admin-Password') or headers.get('x-admin-password') or ''
    is_admin = admin_pwd == ADMIN_PASSWORD

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        if method == 'GET':
            if not is_admin:
                return {'statusCode': 403, 'headers': cors, 'body': json.dumps({'error': 'forbidden'})}
            cur.execute(f"SELECT id, name, login, phone, specialty, active, created_at FROM {SCHEMA}.engineers ORDER BY id DESC")
            rows = cur.fetchall()
            data = [dict(r) for r in rows]
            for d in data:
                if d.get('created_at'):
                    d['created_at'] = d['created_at'].isoformat()
            return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps(data, ensure_ascii=False)}

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            action = body.get('action', '')

            if action == 'login':
                login = body.get('login', '')
                password = body.get('password', '')
                cur.execute(f"SELECT id, name, login, phone, specialty, active FROM {SCHEMA}.engineers WHERE login = {esc(login)} AND password = {esc(password)} AND active = TRUE LIMIT 1")
                row = cur.fetchone()
                if not row:
                    return {'statusCode': 401, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'invalid'})}
                return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'success': True, 'engineer': dict(row)}, ensure_ascii=False)}

            if not is_admin:
                return {'statusCode': 403, 'headers': cors, 'body': json.dumps({'error': 'forbidden'})}

            if action == 'create':
                name = body.get('name', '').strip()
                login = body.get('login', '').strip()
                password = body.get('password', '').strip()
                phone = body.get('phone', '')
                specialty = body.get('specialty', '')
                if not name or not login or not password:
                    return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'missing fields'})}
                cur.execute(f"INSERT INTO {SCHEMA}.engineers (name, login, password, phone, specialty) VALUES ({esc(name)}, {esc(login)}, {esc(password)}, {esc(phone)}, {esc(specialty)}) RETURNING id")
                eid = cur.fetchone()['id']
                conn.commit()
                return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'success': True, 'id': eid})}

            if action == 'update':
                eid = body.get('id')
                fields = []
                for k in ['name', 'login', 'password', 'phone', 'specialty']:
                    if k in body:
                        fields.append(f"{k} = {esc(body[k])}")
                if 'active' in body:
                    fields.append(f"active = {esc(bool(body['active']))}")
                if not fields:
                    return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'nothing to update'})}
                cur.execute(f"UPDATE {SCHEMA}.engineers SET {', '.join(fields)} WHERE id = {int(eid)}")
                conn.commit()
                return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'success': True})}

            if action == 'delete':
                eid = int(body.get('id'))
                cur.execute(f"UPDATE {SCHEMA}.engineers SET active = FALSE WHERE id = {eid}")
                conn.commit()
                return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'success': True})}

            return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'unknown action'})}

        return {'statusCode': 405, 'headers': cors, 'body': 'Method not allowed'}
    finally:
        cur.close()
        conn.close()
