import { SHOP_ITEMS } from "./gameData";
import { type Resources } from "./gameData";

type Props = {
  onClose: () => void;
  onPurchase: (item: typeof SHOP_ITEMS[0]) => void;
  playerResources: Resources;
};

export default function GameShop({ onClose, onPurchase, playerResources }: Props) {
  const handleBuy = (item: typeof SHOP_ITEMS[0]) => {
    // Тинькофф: открываем платёжную форму (заглушка — ждёт подключения API)
    const paymentUrl = `https://securepayments.tinkoff.ru/pay?amount=${item.price * 100}&orderId=game_${item.id}_${Date.now()}&description=${encodeURIComponent(item.description)}&successURL=${encodeURIComponent(window.location.href)}`;
    const popup = window.open(paymentUrl, "tinkoff_pay", "width=600,height=700,left=200,top=100");
    // После закрытия окна — начисляем ресурсы (в реальном проекте нужен вебхук)
    const timer = setInterval(() => {
      if (popup?.closed) {
        clearInterval(timer);
        onPurchase(item);
      }
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-slate-900">
          <div>
            <h2 className="text-white font-black text-xl">🛒 Магазин</h2>
            <p className="text-slate-400 text-xs">Оплата через Тинькофф · Безопасно</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">✕</button>
        </div>

        <div className="p-5 space-y-3">
          {/* Tinkoff badge */}
          <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-4">
            <span className="text-2xl">🏦</span>
            <div>
              <div className="text-yellow-400 font-bold text-sm">Тинькофф Кассa</div>
              <div className="text-slate-400 text-xs">Карты, СБП, Mir Pay — без комиссии для покупателя</div>
            </div>
          </div>

          {SHOP_ITEMS.map((item) => (
            <div key={item.id} className="bg-slate-800 rounded-xl p-4 flex items-center gap-4">
              <div className="text-4xl shrink-0">{item.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold text-sm">{item.name}</div>
                <div className="text-slate-400 text-xs">{item.description}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-white font-black text-lg">{item.price} ₽</div>
                <button
                  onClick={() => handleBuy(item)}
                  className="mt-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-1.5 rounded-lg text-sm transition-colors"
                >
                  Купить
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-white/10 text-center">
          <p className="text-slate-500 text-xs">
            Платежи обрабатываются АО «Тинькофф Банк» · Данные карты не хранятся на сервере
          </p>
        </div>
      </div>
    </div>
  );
}
