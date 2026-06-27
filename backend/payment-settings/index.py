import json
import os
import psycopg2

ADMIN_PASSWORD = '567765'
SCHEMA = 't_p83915249_biotech_anime_store'


def _mask(value):
    if not value:
        return ''
    if len(value) <= 4:
        return '••••'
    return '••••' + value[-4:]


def handler(event, context):
    '''Настройки эквайринга Т-Банка: GET — статус (без секретов), POST — сохранить ключи (только админ)'''
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
            cur.execute(
                f"SELECT terminal_key, secret_key, is_test, enabled FROM {SCHEMA}.payment_settings WHERE provider = 'tbank'"
            )
            row = cur.fetchone()
            if not row:
                data = {'configured': False, 'terminalKeyMasked': '', 'secretKeySet': False, 'isTest': True, 'enabled': False}
            else:
                terminal_key, secret_key, is_test, enabled = row
                data = {
                    'configured': bool(terminal_key) and bool(secret_key),
                    'terminalKeyMasked': _mask(terminal_key),
                    'secretKeySet': bool(secret_key),
                    'isTest': bool(is_test),
                    'enabled': bool(enabled),
                }
            return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps(data, ensure_ascii=False)}

        if method == 'POST':
            headers = event.get('headers') or {}
            pwd = headers.get('X-Admin-Password') or headers.get('x-admin-password') or ''
            if pwd != ADMIN_PASSWORD:
                return {'statusCode': 403, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'forbidden'})}

            body = json.loads(event.get('body') or '{}')
            sets = []

            terminal_key = body.get('terminalKey')
            if terminal_key is not None and str(terminal_key).strip() != '':
                tk = str(terminal_key).strip().replace("'", "''")
                sets.append(f"terminal_key = '{tk}'")

            secret_key = body.get('secretKey')
            if secret_key is not None and str(secret_key).strip() != '':
                sk = str(secret_key).strip().replace("'", "''")
                sets.append(f"secret_key = '{sk}'")

            if 'isTest' in body:
                sets.append(f"is_test = {'TRUE' if body.get('isTest') else 'FALSE'}")

            if 'enabled' in body:
                sets.append(f"enabled = {'TRUE' if body.get('enabled') else 'FALSE'}")

            if sets:
                sets.append('updated_at = CURRENT_TIMESTAMP')
                cur.execute(
                    f"UPDATE {SCHEMA}.payment_settings SET {', '.join(sets)} WHERE provider = 'tbank'"
                )
                conn.commit()

            return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'success': True})}

        return {'statusCode': 405, 'headers': cors, 'body': 'Method not allowed'}
    finally:
        cur.close()
        conn.close()
