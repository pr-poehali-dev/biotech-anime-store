"""
Инициация платежа через Т-Банк эквайринг.
Принимает товары из корзины, создаёт платёж и возвращает ссылку для оплаты.
"""
import json
import os
import hashlib
import requests


TBANK_API_URL = "https://securepay.tinkoff.ru/v2/Init"


def generate_token(params: dict, secret_key: str) -> str:
    """Генерация подписи для Т-Банк API."""
    filtered = {k: v for k, v in params.items() if k not in ("Token", "Receipt", "DATA", "Items")}
    filtered["Password"] = secret_key
    sorted_values = "".join(str(v) for k, v in sorted(filtered.items()))
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

    cart = body.get("cart", [])
    order_id = body.get("orderId", "order-1")
    success_url = body.get("successUrl", "")
    fail_url = body.get("failUrl", "")

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

    terminal_key = os.environ.get("TBANK_TERMINAL_KEY", "")
    secret_key = os.environ.get("TBANK_SECRET_KEY", "")

    if not terminal_key or not secret_key:
        return {
            "statusCode": 500,
            "headers": cors_headers,
            "body": json.dumps({"error": "Платёжные ключи не настроены. Добавьте TBANK_TERMINAL_KEY и TBANK_SECRET_KEY в секреты."}),
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
        "RedirectDueDate": None,
    }

    if success_url:
        payload["SuccessURL"] = success_url
    if fail_url:
        payload["FailURL"] = fail_url

    payload["Token"] = generate_token(payload, secret_key)

    if receipt_items:
        payload["Receipt"] = {
            "Email": body.get("email", ""),
            "Phone": body.get("phone", ""),
            "Taxation": "usn_income",
            "Items": receipt_items,
        }

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

    if not data.get("Success"):
        return {
            "statusCode": 400,
            "headers": cors_headers,
            "body": json.dumps({"error": data.get("Message", "Ошибка создания платежа"), "details": data}),
        }

    return {
        "statusCode": 200,
        "headers": cors_headers,
        "body": json.dumps({
            "success": True,
            "paymentUrl": data.get("PaymentURL"),
            "paymentId": data.get("PaymentId"),
            "orderId": order_id,
            "amount": amount_rub,
        }),
    }