"""
Инициация платежа через Т-Банк эквайринг.
Принимает товары из корзины, создаёт платёж и возвращает ссылку для оплаты.
"""
import json
import os
import hashlib
import requests
import psycopg2


TBANK_API_URL = "https://securepay.tinkoff.ru/v2/Init"
TBANK_QR_URL = "https://securepay.tinkoff.ru/v2/GetQr"
TBANK_STATE_URL = "https://securepay.tinkoff.ru/v2/GetState"
SCHEMA = 't_p83915249_biotech_anime_store'


def get_keys():
    """Берёт ключи из таблицы payment_settings, fallback на секреты окружения."""
    terminal_key = ""
    secret_key = ""
    enabled = True
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        try:
            cur.execute(
                f"SELECT terminal_key, secret_key, enabled FROM {SCHEMA}.payment_settings WHERE provider = 'tbank'"
            )
            row = cur.fetchone()
            if row:
                terminal_key = row[0] or ""
                secret_key = row[1] or ""
                enabled = bool(row[2])
        finally:
            cur.close()
            conn.close()
    except Exception:
        pass
    if not terminal_key:
        terminal_key = os.environ.get("TBANK_TERMINAL_KEY", "")
    if not secret_key:
        secret_key = os.environ.get("TBANK_SECRET_KEY", "")
    return terminal_key, secret_key, enabled


def generate_token(params: dict, secret_key: str) -> str:
    """Генерация подписи для Т-Банк API (только скалярные корневые поля)."""
    filtered = {}
    for k, v in params.items():
        if k in ("Token", "Receipt", "DATA", "Items"):
            continue
        if v is None:
            continue
        if isinstance(v, (dict, list)):
            continue
        if isinstance(v, bool):
            filtered[k] = "true" if v else "false"
        else:
            filtered[k] = str(v)
    filtered["Password"] = secret_key
    sorted_values = "".join(filtered[k] for k in sorted(filtered.keys()))
    return hashlib.sha256(sorted_values.encode()).hexdigest()


def handler(event: dict, context) -> dict:
    """Создаёт платёж в Т-Банк и возвращает URL для оплаты."""
    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers, "body": ""}

    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        return {"statusCode": 400, "headers": cors_headers, "body": json.dumps({"error": "Invalid JSON"})}

    if body.get("action") == "status":
        payment_id = body.get("paymentId")
        if not payment_id:
            return {"statusCode": 400, "headers": cors_headers, "body": json.dumps({"error": "Не указан paymentId"})}
        terminal_key, secret_key, _enabled = get_keys()
        state_payload = {"TerminalKey": terminal_key, "PaymentId": str(payment_id)}
        state_payload["Token"] = generate_token(state_payload, secret_key)
        try:
            st_resp = requests.post(TBANK_STATE_URL, json=state_payload, timeout=15)
            st_resp.raise_for_status()
            st_data = st_resp.json()
        except requests.RequestException as e:
            return {"statusCode": 502, "headers": cors_headers, "body": json.dumps({"error": f"Ошибка проверки статуса: {str(e)}"})}
        status = st_data.get("Status", "")
        paid = status in ("CONFIRMED", "AUTHORIZED")
        return {
            "statusCode": 200,
            "headers": cors_headers,
            "body": json.dumps({"success": True, "status": status, "paid": paid}, ensure_ascii=False),
        }

    cart = body.get("cart", [])
    order_id = body.get("orderId", "order-1")
    success_url = body.get("successUrl", "")
    fail_url = body.get("failUrl", "")
    pay_method = body.get("method", "card")

    if not cart:
        return {"statusCode": 400, "headers": cors_headers, "body": json.dumps({"error": "Корзина пуста"})}

    amount_rub = sum(item.get("price", 0) * item.get("qty", 1) for item in cart if not item.get("isVeteran"))
    amount_kopecks = int(amount_rub * 100)

    if amount_kopecks <= 0:
        return {
            "statusCode": 200,
            "headers": cors_headers,
            "body": json.dumps({"success": True, "free": True, "message": "Товары для ветеранов СВО предоставляются бесплатно. Заявка принята."}),
        }

    terminal_key, secret_key, enabled = get_keys()

    if not enabled:
        return {
            "statusCode": 400,
            "headers": cors_headers,
            "body": json.dumps({"error": "Приём оплаты временно отключён. Обратитесь к продавцу."}),
        }

    if not terminal_key or not secret_key:
        return {
            "statusCode": 500,
            "headers": cors_headers,
            "body": json.dumps({"error": "Платёжные ключи не настроены. Заполните их в админ-панели на вкладке «Оплата»."}),
        }

    description = f"Заказ #{order_id} — Маркет Товаров и Биотехнологий"

    receipt_items = []
    for item in cart:
        if item.get("isVeteran"):
            continue
        receipt_items.append({
            "Name": item.get("name", "Товар")[:128],
            "Price": int(item.get("price", 0) * 100),
            "Quantity": item.get("qty", 1),
            "Amount": int(item.get("price", 0) * item.get("qty", 1) * 100),
            "Tax": "none",
        })

    payload = {
        "TerminalKey": terminal_key,
        "Amount": amount_kopecks,
        "OrderId": str(order_id),
        "Description": description,
    }

    if success_url:
        payload["SuccessURL"] = success_url
    if fail_url:
        payload["FailURL"] = fail_url

    payload["Token"] = generate_token(payload, secret_key)

    if receipt_items:
        receipt = {
            "Taxation": "usn_income",
            "Items": receipt_items,
        }
        email = body.get("email", "")
        phone = body.get("phone", "")
        if email:
            receipt["Email"] = email
        if phone:
            receipt["Phone"] = phone
        if not email and not phone:
            receipt["Email"] = "noreply@example.com"
        payload["Receipt"] = receipt

    try:
        resp = requests.post(TBANK_API_URL, json=payload, timeout=15)
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as e:
        return {
            "statusCode": 502,
            "headers": cors_headers,
            "body": json.dumps({"error": f"Ошибка связи с Т-Банк: {str(e)}"}),
        }

    print("TBANK_RESPONSE:", json.dumps(data, ensure_ascii=False))

    if not data.get("Success"):
        err = data.get("Message", "Ошибка создания платежа")
        details = data.get("Details", "")
        msg = f"{err} {details}".strip()
        return {
            "statusCode": 400,
            "headers": cors_headers,
            "body": json.dumps({"error": msg, "code": data.get("ErrorCode"), "details": data}, ensure_ascii=False),
        }

    payment_id = data.get("PaymentId")

    if pay_method == "sbp":
        qr_payload = {
            "TerminalKey": terminal_key,
            "PaymentId": str(payment_id),
            "DataType": "PAYLOAD",
        }
        qr_payload["Token"] = generate_token(qr_payload, secret_key)
        try:
            qr_resp = requests.post(TBANK_QR_URL, json=qr_payload, timeout=15)
            qr_resp.raise_for_status()
            qr_data = qr_resp.json()
        except requests.RequestException as e:
            return {
                "statusCode": 502,
                "headers": cors_headers,
                "body": json.dumps({"error": f"Ошибка получения QR: {str(e)}"}),
            }

        print("TBANK_QR_RESPONSE:", json.dumps(qr_data, ensure_ascii=False))

        if not qr_data.get("Success"):
            err = qr_data.get("Message", "Ошибка получения QR-кода СБП")
            details = qr_data.get("Details", "")
            return {
                "statusCode": 400,
                "headers": cors_headers,
                "body": json.dumps({"error": f"{err} {details}".strip(), "code": qr_data.get("ErrorCode")}, ensure_ascii=False),
            }

        return {
            "statusCode": 200,
            "headers": cors_headers,
            "body": json.dumps({
                "success": True,
                "method": "sbp",
                "qrPayload": qr_data.get("Data"),
                "paymentId": payment_id,
                "orderId": order_id,
                "amount": amount_rub,
            }, ensure_ascii=False),
        }

    return {
        "statusCode": 200,
        "headers": cors_headers,
        "body": json.dumps({
            "success": True,
            "method": "card",
            "paymentUrl": data.get("PaymentURL"),
            "paymentId": payment_id,
            "orderId": order_id,
            "amount": amount_rub,
        }),
    }