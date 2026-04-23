import { useState } from "react";
import Icon from "@/components/ui/icon";
import type { CartItem, Page } from "@/App";

const PAYMENT_URL = "https://functions.poehali.dev/c32d0a92-5be1-4706-a6f2-802136bbceb1";

type Props = {
  cart: CartItem[];
  removeFromCart: (id: number) => void;
  updateQty: (id: number, qty: number) => void;
  setPage: (p: Page) => void;
};

export default function CartPage({ cart, removeFromCart, updateQty, setPage }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const hasVet = cart.some((i) => i.isVeteran);

  const handleTBankPay = async () => {
    setLoading(true);
    setError("");
    try {
      const orderId = `order-${Date.now()}`;
      const res = await fetch(PAYMENT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart: cart.map((i) => ({
            name: i.name,
            price: i.price,
            qty: i.qty,
            isVeteran: i.isVeteran ?? false,
          })),
          orderId,
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

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2 mb-3">
                {error}
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
              Безопасная оплата через Т-Банк (Тинькофф). SSL-шифрование.
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
    </div>
  );
}