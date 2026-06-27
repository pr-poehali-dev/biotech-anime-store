import json
import os
import base64
import uuid
import psycopg2
import boto3

ADMIN_PASSWORD = '567765'
SCHEMA = 't_p83915249_biotech_anime_store'


def handler(event, context):
    '''Настройки сайта, товары и загрузка файлов: ?type=products — товары, ?type=upload — загрузка картинки.'''
    method = event.get('httpMethod', 'GET')
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
    }
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    params = event.get('queryStringParameters') or {}
    is_products = (params.get('type') == 'products')

    upload_type = params.get('type')
    if upload_type in ('upload', 'vetdoc') and method == 'POST':
        if upload_type == 'upload':
            headers = event.get('headers') or {}
            pwd = headers.get('X-Admin-Password') or headers.get('x-admin-password') or ''
            if pwd != ADMIN_PASSWORD:
                return {'statusCode': 403, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'forbidden'})}
        body = json.loads(event.get('body') or '{}')
        file_b64 = body.get('file', '')
        content_type = body.get('contentType', 'image/png')
        if ',' in file_b64:
            file_b64 = file_b64.split(',', 1)[1]
        try:
            file_bytes = base64.b64decode(file_b64)
        except Exception:
            return {'statusCode': 400, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'Неверный файл'})}
        if len(file_bytes) > 10 * 1024 * 1024:
            return {'statusCode': 400, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'Файл слишком большой (макс. 10 МБ)'})}
        ext = 'png'
        if 'jpeg' in content_type or 'jpg' in content_type:
            ext = 'jpg'
        elif 'webp' in content_type:
            ext = 'webp'
        elif 'svg' in content_type:
            ext = 'svg'
        elif 'pdf' in content_type:
            ext = 'pdf'
        folder = 'vetdocs' if upload_type == 'vetdoc' else 'uploads'
        key = f"{folder}/{uuid.uuid4().hex}.{ext}"
        s3 = boto3.client(
            's3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        )
        s3.put_object(Bucket='files', Key=key, Body=file_bytes, ContentType=content_type)
        url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
        return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'success': True, 'url': url})}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    try:
        if is_products:
            if method == 'GET':
                cur.execute(f"SELECT data FROM {SCHEMA}.products_store WHERE id = 1")
                row = cur.fetchone()
                data = row[0] if row else []
                return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps(data, ensure_ascii=False)}
            if method == 'POST':
                headers = event.get('headers') or {}
                pwd = headers.get('X-Admin-Password') or headers.get('x-admin-password') or ''
                if pwd != ADMIN_PASSWORD:
                    return {'statusCode': 403, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'forbidden'})}
                body = json.loads(event.get('body') or '[]')
                payload = json.dumps(body, ensure_ascii=False).replace("'", "''")
                cur.execute(f"UPDATE {SCHEMA}.products_store SET data = '{payload}'::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = 1")
                conn.commit()
                return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'success': True})}
            return {'statusCode': 405, 'headers': cors, 'body': 'Method not allowed'}

        if method == 'GET':
            cur.execute(f"SELECT data FROM {SCHEMA}.site_settings WHERE id = 1")
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
            cur.execute(f"UPDATE {SCHEMA}.site_settings SET data = '{payload}'::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = 1")
            conn.commit()
            return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'success': True})}

        return {'statusCode': 405, 'headers': cors, 'body': 'Method not allowed'}
    finally:
        cur.close()
        conn.close()