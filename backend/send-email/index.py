"""
Отправка заявок с форм сайта на почту владельца ZVERONG@yandex.ru.
Принимает данные формы и отправляет письмо через Яндекс SMTP.
"""
import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

SMTP_HOST = "smtp.yandex.ru"
SMTP_PORT = 465
FROM_EMAIL = "ZVERONG@yandex.ru"
TO_EMAIL = "ZVERONG@yandex.ru"


def handler(event: dict, context) -> dict:
    """Принимает данные формы заявки и отправляет письмо на ZVERONG@yandex.ru."""
    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers, "body": ""}

    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        return {"statusCode": 400, "headers": cors_headers, "body": json.dumps({"error": "Invalid JSON"})}

    form_type = body.get("formType", "Заявка")
    name = body.get("name", "—")
    phone = body.get("phone", "—")
    email = body.get("email", "—")
    company = body.get("company", "")
    plan = body.get("plan", "")
    comment = body.get("comment", "")
    cart = body.get("cart", [])

    smtp_password = os.environ.get("YANDEX_SMTP_PASSWORD", "")
    if not smtp_password:
        return {
            "statusCode": 500,
            "headers": cors_headers,
            "body": json.dumps({"error": "SMTP не настроен. Добавьте YANDEX_SMTP_PASSWORD в секреты."}),
        }

    now = datetime.now().strftime("%d.%m.%Y %H:%M")

    if form_type == "order" and cart:
        subject = f"🛒 Новый заказ — Маркет Товаров и Биотехнологий"
        items_html = "".join(
            f"<tr><td style='padding:4px 8px;border-bottom:1px solid #eee'>{i.get('name','')}</td>"
            f"<td style='padding:4px 8px;border-bottom:1px solid #eee;text-align:center'>{i.get('qty',1)} шт.</td>"
            f"<td style='padding:4px 8px;border-bottom:1px solid #eee;text-align:right'>"
            f"{'Бесплатно' if i.get('isVeteran') else str(i.get('price',0)*i.get('qty',1)) + ' ₽'}</td></tr>"
            for i in cart
        )
        total = sum(i.get("price", 0) * i.get("qty", 1) for i in cart if not i.get("isVeteran"))
        html_body = f"""
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <div style="background:linear-gradient(135deg,#0d2b6b,#1a4fa8);padding:24px;border-radius:12px 12px 0 0">
    <h2 style="color:white;margin:0;font-size:20px">🛒 Новый заказ</h2>
    <p style="color:#93c5fd;margin:4px 0 0;font-size:13px">Маркет Товаров и Биотехнологий · {now}</p>
  </div>
  <div style="background:#f8fafc;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0">
    <h3 style="margin:0 0 12px;color:#1e293b;font-size:15px">Покупатель</h3>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
      <tr><td style="color:#64748b;padding:3px 0;width:120px">Имя:</td><td style="font-weight:bold">{name}</td></tr>
      <tr><td style="color:#64748b;padding:3px 0">Телефон:</td><td style="font-weight:bold">{phone}</td></tr>
      <tr><td style="color:#64748b;padding:3px 0">Email:</td><td><a href="mailto:{email}">{email}</a></td></tr>
    </table>
    <h3 style="margin:0 0 12px;color:#1e293b;font-size:15px">Состав заказа</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead><tr style="background:#e2e8f0">
        <th style="padding:6px 8px;text-align:left">Товар</th>
        <th style="padding:6px 8px;text-align:center">Кол-во</th>
        <th style="padding:6px 8px;text-align:right">Сумма</th>
      </tr></thead>
      <tbody>{items_html}</tbody>
      <tfoot><tr style="background:#dbeafe">
        <td colspan="2" style="padding:8px;font-weight:bold">Итого к оплате</td>
        <td style="padding:8px;font-weight:bold;text-align:right;color:#1d4ed8">{total} ₽</td>
      </tr></tfoot>
    </table>
  </div>
</div>"""
    else:
        subject = f"📋 Новая заявка — {form_type}"
        rows = [
            ("Имя", name), ("Телефон", phone), ("Email", email),
        ]
        if company:
            rows.append(("Компания", company))
        if plan:
            rows.append(("Тариф / услуга", plan))
        if comment:
            rows.append(("Комментарий", comment))

        rows_html = "".join(
            f"<tr><td style='color:#64748b;padding:5px 0;width:140px;vertical-align:top'>{k}:</td>"
            f"<td style='font-weight:bold;padding:5px 0'>{v}</td></tr>"
            for k, v in rows
        )
        html_body = f"""
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <div style="background:linear-gradient(135deg,#0d2b6b,#1a4fa8);padding:24px;border-radius:12px 12px 0 0">
    <h2 style="color:white;margin:0;font-size:20px">📋 Новая заявка</h2>
    <p style="color:#93c5fd;margin:4px 0 0;font-size:13px">Маркет Товаров и Биотехнологий · {now}</p>
  </div>
  <div style="background:#f8fafc;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0">
    <table style="width:100%;border-collapse:collapse">{rows_html}</table>
  </div>
</div>"""

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = FROM_EMAIL
    msg["To"] = TO_EMAIL
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
        server.login(FROM_EMAIL, smtp_password)
        server.sendmail(FROM_EMAIL, TO_EMAIL, msg.as_string())

    return {
        "statusCode": 200,
        "headers": cors_headers,
        "body": json.dumps({"success": True, "message": "Письмо отправлено"}),
    }
