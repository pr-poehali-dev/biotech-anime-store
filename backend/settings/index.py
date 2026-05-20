import json
import os
import psycopg2

ADMIN_PASSWORD = '567765'

def handler(event, context):
    '''Управление настройками сайта: GET — получить, POST — сохранить (только админ)'''
    method = event.get('httpMethod', 'GET')
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
    }
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    try:
        if method == 'GET':
            cur.execute("SELECT data FROM t_p83915249_biotech_anime_store.site_settings WHERE id = 1")
            row = cur.fetchone()
            data = row[0] if row else {}
            return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps(data, ensure_ascii=False)}

        if method == 'POST':
            headers = event.get('headers') or {}
            pwd = headers.get('X-Admin-Password') or headers.get('x-admin-password') or ''
            if pwd != ADMIN_PASSWORD:
                return {'statusCode': 403, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'forbidden'})}
            body = json.loads(event.get('body') or '{}')
            payload = json.dumps(body, ensure_ascii=False).replace("'", "''")
            cur.execute(f"UPDATE t_p83915249_biotech_anime_store.site_settings SET data = '{payload}'::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = 1")
            conn.commit()
            return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'success': True})}

        return {'statusCode': 405, 'headers': cors, 'body': 'Method not allowed'}
    finally:
        cur.close()
        conn.close()
