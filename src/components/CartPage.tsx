import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import type { CartItem, Page } from "@/App";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

const PAYMENT_URL = "https://functions.poehali.dev/c32d0a92-5be1-4706-a6f2-802136bbceb1";

type Props = {
  cart: CartItem[];
  removeFromCart: (id: number) => void;
  updateQty: (id: number, qty: number) => void;
  setPage: (p: Page) => void;
  clearCart: () => void;
};

export default function CartPage({ cart, removeFromCart, updateQty, setPage, clearCart }: Props) {
  const [loading, setLoading] = useState(false);
  const [sbpLoading, setSbpLoading] = useState(false);
  const [error, setError] = useState("");
  const [qrPayload, setQrPayload] = useState("");
  const [paid, setPaid] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);
  const [failed, setFailed] = useState(false);
  const [sbpPaymentId, setSbpPaymentId] = useState("");
  const [showManualSbp, setShowManualSbp] = useState(false);
  const { settings } = useSiteSettings();
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const hasVet = cart.some((i) => i.isVeteran);
  const paidHandled = useRef(false);

  const markPaid = (amount: number) => {
    setPaidAmount(amount);
    setPaid(true);
    setQrPayload("");
    clearCart();
  };

  const markFailed = () => {
    setFailed(true);
    setQrPayload("");
    setSbpPaymentId("");
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (paidHandled.current) return;
    if (params.get("payment") === "success") {
      paidHandled.current = true;
      markPaid(0);
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("payment") === "fail") {
      paidHandled.current = true;
      markFailed();
      window.history.replaceState({}, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!sbpPaymentId || paid) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(PAYMENT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "status", paymentId: sbpPaymentId }),
        });
        const data = await res.json();
        if (data.paid) {
          clearInterval(interval);
          markPaid(total);
        } else if (["REJECTED", "CANCELED", "DEADLINE_EXPIRED", "AUTH_FAIL"].includes(data.status)) {
          clearInterval(interval);
          markFailed();
        }
      } catch {
        // повторим на следующей итерации
      }
    }, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sbpPaymentId, paid]);

  const buildCart = () =>
    cart.map((i) => ({
      name: i.name,
      price: i.price,
      qty: i.qty,
      isVeteran: i.isVeteran ?? false,
    }));

  const handleTBankPay = async () => {
    setLoading(true);
    setError("");
    try {
      const orderId = `order-${Date.now()}`;
      const res = await fetch(PAYMENT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart: buildCart(),
          orderId,
          method: "card",
          successUrl: window.location.href + "?payment=success",
          failUrl: window.location.href + "?payment=fail",
        }),
      });
      const data = await res.json();
      if (data.free) {
        alert("🎖️ " + data.message);
        return;
      }
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        setError(data.error || "Ошибка при создании платежа");
      }
    } catch {
      setError("Не удалось подключиться к платёжному сервису");
    } finally {
      setLoading(false);
    }
  };

  const handleSbpPay = async () => {
    setError("");
    if (settings.sbpLink || settings.sbpQrImage) {
      setShowManualSbp(true);
      return;
    }
    setSbpLoading(true);
    try {
      const orderId = `order-${Date.now()}`;
      const res = await fetch(PAYMENT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart: buildCart(),
          orderId,
          method: "sbp",
        }),
      });
      const data = await res.json();
      if (data.free) {
        alert("🎖️ " + data.message);
        return;
      }
      if (data.qrPayload) {
        setQrPayload(data.qrPayload);
        if (data.paymentId) setSbpPaymentId(String(data.paymentId));
      } else {
        setError(data.error || "Ошибка при создании QR-кода СБП");
      }
    } catch {
      setError("Не удалось подключиться к платёжному сервису");
    } finally {
      setSbpLoading(false);
    }
  };

  const qrImageUrl = qrPayload
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(qrPayload)}`
    : "";

  const isImageUrl = (u: string) =>
    /\.(png|jpe?g|webp|svg|gif)(\?.*)?$/i.test(u) || u.includes("cdn.poehali.dev");

  const manualQrSrc = settings.sbpQrImage && isImageUrl(settings.sbpQrImage)
    ? settings.sbpQrImage
    : settings.sbpLink || (settings.sbpQrImage && !isImageUrl(settings.sbpQrImage) ? settings.sbpQrImage : "")
      ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(settings.sbpLink || settings.sbpQrImage)}`
      : "";

  if (paid) {
    return (
      <div className="container mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <Icon name="CheckCircle2" fallback="Check" size={56} className="text-green-600" />
        </div>
        <h2 className="text-3xl font-black mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>Оплачено</h2>
        <p className="text-muted-foreground mb-2">Спасибо за заказ! Платёж успешно принят.</p>
        {paidAmount > 0 && (
          <p className="font-black text-xl text-primary mb-6">{paidAmount.toLocaleString("ru")} ₽</p>
        )}
        <button
          onClick={() => { setPaid(false); setPage("catalog"); }}
          className="bear-btn bg-primary text-primary-foreground font-bold px-8 py-3 rounded-2xl"
        >
          Вернуться в магазин
        </button>
      </div>
    );
  }

  if (failed) {
    return (
      <div className="container mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <Icon name="XCircle" fallback="X" size={56} className="text-red-600" />
        </div>
        <h2 className="text-3xl font-black mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>Не получилось оплатить</h2>
        <p className="text-muted-foreground mb-6">Платёж не прошёл. Попробуйте ещё раз или выберите другой способ оплаты.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => { setFailed(false); if (cart.length === 0) setPage("catalog"); }}
            className="bear-btn bg-primary text-primary-foreground font-bold px-8 py-3 rounded-2xl"
          >
            Попробовать снова
          </button>
          <button
            onClick={() => { setFailed(false); setPage("catalog"); }}
            className="border border-border font-semibold px-8 py-3 rounded-2xl hover:bg-secondary transition-colors"
          >
            Вернуться в магазин
          </button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="text-7xl mb-6">🐻</div>
        <h2 className="text-2xl font-black mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>Корзина пуста</h2>
        <p className="text-muted-foreground mb-6">Добавьте товары из каталога</p>
        <button
          onClick={() => setPage("catalog")}
          className="bear-btn bg-primary text-primary-foreground font-bold px-6 py-3 rounded-2xl"
        >
          Перейти в каталог
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in max-w-4xl">
      <h1 className="text-3xl font-black mb-6" style={{ fontFamily: "Montserrat, sans-serif" }}>Корзина</h1>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-3">
          {cart.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-4 border border-border flex gap-4 items-center">
              <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 rounded-xl object-cover border border-border flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-foreground truncate" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  {item.name}
                </div>
                <div className="text-xs text-muted-foreground">{item.category}</div>
                <div className="font-black text-primary mt-1">
                  {item.isVeteran ? "Бесплатно" : `${(item.price * item.qty).toLocaleString("ru")} ₽`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQty(item.id, item.qty - 1)}
                  className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                >
                  <Icon name="Minus" size={14} />
                </button>
                <span className="w-6 text-center font-bold text-sm">{item.qty}</span>
                <button
                  onClick={() => updateQty(item.id, item.qty + 1)}
                  className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                >
                  <Icon name="Plus" size={14} />
                </button>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="w-8 h-8 rounded-lg text-red-400 hover:bg-red-50 flex items-center justify-center transition-colors ml-1"
                >
                  <Icon name="Trash2" size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl border border-border p-5 sticky top-24">
            <h3 className="font-black text-lg mb-4" style={{ fontFamily: "Montserrat, sans-serif" }}>Итого</h3>
            <div className="space-y-2 mb-4">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between text-sm text-muted-foreground">
                  <span className="truncate max-w-[140px]">{item.name}</span>
                  <span className="font-medium text-foreground ml-2">
                    {item.isVeteran ? "0 ₽" : `${(item.price * item.qty).toLocaleString("ru")} ₽`}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 mb-4">
              <div className="flex justify-between font-black text-lg">
                <span>Итого:</span>
                <span className="text-primary">{total.toLocaleString("ru")} ₽</span>
              </div>
              {hasVet && (
                <div className="text-xs text-green-600 font-semibold mt-1">🎖️ Ветеранские товары бесплатны</div>
              )}
            </div>

            <button
              onClick={handleTBankPay}
              disabled={loading}
              className="bear-btn w-full bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 disabled:cursor-not-allowed text-gray-900 font-black py-3 rounded-2xl flex items-center justify-center gap-2 mb-3 text-base"
            >
              {loading ? (
                <>
                  <Icon name="Loader2" size={20} className="animate-spin" />
                  Создаём платёж...
                </>
              ) : (
                <>
                  <span className="text-xl">🏦</span>
                  Оплатить через Т-Банк
                </>
              )}
            </button>

            <button
              onClick={handleSbpPay}
              disabled={sbpLoading}
              className="bear-btn w-full bg-[#1D1346] hover:bg-[#2a1d63] disabled:opacity-60 disabled:cursor-not-allowed text-white font-black py-3 rounded-2xl flex items-center justify-center gap-2 mb-3 text-base"
            >
              {sbpLoading ? (
                <>
                  <Icon name="Loader2" size={20} className="animate-spin" />
                  Готовим QR-код...
                </>
              ) : (
                <>
                  <Icon name="QrCode" size={20} />
                  Оплатить по СБП (QR)
                </>
              )}
            </button>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2 mb-3">
                {error}
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
              Оплата картой или по СБП через Т-Банк. SSL-шифрование.
            </p>

            <button
              onClick={() => setPage("catalog")}
              className="w-full mt-3 border border-border py-2.5 rounded-xl text-sm font-semibold hover:bg-secondary transition-colors"
            >
              Продолжить покупки
            </button>
          </div>
        </div>
      </div>

      {showManualSbp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in"
          onClick={() => setShowManualSbp(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 w-full max-w-sm text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowManualSbp(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center"
            >
              <Icon name="X" size={18} />
            </button>
            <div className="text-3xl mb-2">📱</div>
            <h3 className="font-black text-lg mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Оплата по СБП
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Отсканируйте QR-код или перейдите по ссылке для оплаты
            </p>
            {manualQrSrc && (
              <div className="bg-white border border-border rounded-2xl p-3 inline-block mb-4">
                <img src={manualQrSrc} alt="QR-код для оплаты по СБП" className="w-[260px] h-[260px] object-contain" />
              </div>
            )}
            <div className="font-black text-xl text-primary mb-3">{total.toLocaleString("ru")} ₽</div>
            {settings.sbpLink && (
              <a
                href={settings.sbpLink}
                target="_blank"
                rel="noopener noreferrer"
                className="bear-btn block w-full bg-primary text-primary-foreground font-bold py-3 rounded-2xl mb-3"
              >
                Перейти к оплате СБП
              </a>
            )}
            <button
              onClick={() => markPaid(total)}
              className="bear-btn block w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-2xl mb-3"
            >
              Я оплатил
            </button>
            <p className="text-xs text-muted-foreground">
              После оплаты нажмите «Я оплатил» — корзина очистится. Сохраните чек.
            </p>
          </div>
        </div>
      )}

      {qrPayload && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in"
          onClick={() => setQrPayload("")}
        >
          <div
            className="bg-white rounded-3xl p-6 w-full max-w-sm text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setQrPayload("")}
              className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center"
            >
              <Icon name="X" size={18} />
            </button>
            <div className="text-3xl mb-2">📱</div>
            <h3 className="font-black text-lg mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Оплата по СБП
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Отсканируйте QR-код камерой телефона или приложением банка
            </p>
            <div className="bg-white border border-border rounded-2xl p-3 inline-block mb-4">
              <img src={qrImageUrl} alt="QR-код для оплаты по СБП" className="w-[260px] h-[260px]" />
            </div>
            <div className="font-black text-xl text-primary mb-3">{total.toLocaleString("ru")} ₽</div>
            <a
              href={qrPayload}
              target="_blank"
              rel="noopener noreferrer"
              className="bear-btn block w-full bg-primary text-primary-foreground font-bold py-3 rounded-2xl mb-2"
            >
              Открыть в приложении банка
            </a>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Icon name="Loader2" size={14} className="animate-spin" />
              Ожидаем подтверждение оплаты...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}