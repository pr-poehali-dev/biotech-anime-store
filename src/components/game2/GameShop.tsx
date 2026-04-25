const TINKOFF_URL = 'https://functions.poehali.dev/c32d0a92-5be1-4706-a6f2-802136bbceb1';

const SHOP_ITEMS = [
  { id: 'energy_100', name: '100 энергоячеек', emoji: '⚡', price: 59, desc: 'Быстро восстановить 100 единиц энергии', resource: 'energy', amount: 100 },
  { id: 'energy_500', name: '500 энергоячеек', emoji: '⚡', price: 249, desc: '500 энергоячеек — выгода 15%', resource: 'energy', amount: 500 },
  { id: 'energy_full', name: 'Полное восстановление', emoji: '🔋', price: 399, desc: 'Восстановить до 1000 ед. энергии мгновенно', resource: 'energy', amount: 1000 },
  { id: 'gold_pack', name: '5000 золота', emoji: '💰', price: 199, desc: 'Добавить 5000 единиц золота', resource: 'gold', amount: 5000 },
  { id: 'metal_pack', name: '3000 металла', emoji: '⚙️', price: 149, desc: 'Добавить 3000 единиц металла', resource: 'metal', amount: 3000 },
  { id: 'crystal_pack', name: '2000 кристаллов', emoji: '💎', price: 199, desc: 'Добавить 2000 кристаллов', resource: 'crystal', amount: 2000 },
  { id: 'resource_bundle', name: 'Набор ресурсов', emoji: '🎒', price: 499, desc: '5000 золота + 3000 металла + 2000 кристаллов + 1000 биоматерии', resource: 'all', amount: 5000 },
  { id: 'implant_kit', name: 'Набор имплантов', emoji: '🔬', price: 699, desc: 'Все ресурсы для установки 5 имплантов', resource: 'implant_kit', amount: 0 },
  { id: 'commander_boost', name: 'Буст командира ×5', emoji: '⭐', price: 299, desc: 'Прокачать командира на 5 уровней сразу', resource: 'commander', amount: 5 },
];

type Props = {
  onClose: () => void;
};

export default function GameShop({ onClose }: Props) {
  const handleBuy = (item: typeof SHOP_ITEMS[0]) => {
    const orderId = `game_${item.id}_${Date.now()}`;
    const description = `Эпоха Звёзд: ${item.name}`;
    const paymentUrl = `https://securepayments.tinkoff.ru/pay?amount=${item.price * 100}&orderId=${orderId}&description=${encodeURIComponent(description)}&successURL=${encodeURIComponent(window.location.href)}&failURL=${encodeURIComponent(window.location.href)}`;
    const popup = window.open(paymentUrl, 'tinkoff_pay', 'width=600,height=700,left=200,top=100');
    const timer = setInterval(() => {
      if (popup?.closed) {
        clearInterval(timer);
      }
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-slate-900 rounded-t-2xl">
          <div>
            <h2 className="text-white font-black text-xl">🛒 Игровой магазин</h2>
            <p className="text-slate-400 text-xs">Оплата через Тинькофф Банк · Безопасно</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">✕</button>
        </div>

        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          {/* Tinkoff badge */}
          <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
            <span className="text-3xl">🏦</span>
            <div>
              <div className="text-yellow-400 font-bold text-sm">Тинькофф Касса</div>
              <div className="text-slate-400 text-xs">Карты · СБП · Mir Pay · Оплата в рублях</div>
            </div>
          </div>

          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Энергия</div>
          {SHOP_ITEMS.filter(i => i.resource === 'energy').map(item => (
            <ShopItem key={item.id} item={item} onBuy={handleBuy} />
          ))}

          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-2">Ресурсы</div>
          {SHOP_ITEMS.filter(i => !['energy'].includes(i.resource)).map(item => (
            <ShopItem key={item.id} item={item} onBuy={handleBuy} />
          ))}
        </div>

        <div className="p-4 border-t border-white/10 text-center rounded-b-2xl">
          <p className="text-slate-500 text-xs">Платежи обрабатываются АО «Тинькофф Банк» · Данные карты не хранятся</p>
        </div>
      </div>
    </div>
  );
}

function ShopItem({ item, onBuy }: { item: typeof SHOP_ITEMS[0]; onBuy: (i: typeof SHOP_ITEMS[0]) => void }) {
  return (
    <div className="bg-slate-800 rounded-xl p-4 flex items-center gap-4">
      <div className="text-3xl shrink-0">{item.emoji}</div>
      <div className="flex-1 min-w-0">
        <div className="text-white font-bold text-sm">{item.name}</div>
        <div className="text-slate-400 text-xs">{item.desc}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-white font-black text-lg">{item.price} ₽</div>
        <button onClick={() => onBuy(item)}
          className="mt-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-1.5 rounded-lg text-sm transition-colors">
          Купить
        </button>
      </div>
    </div>
  );
}
