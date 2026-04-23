import Icon from "@/components/ui/icon";

export default function DeliveryPage() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl animate-fade-in">
      <h1 className="text-3xl font-black mb-8" style={{ fontFamily: "Montserrat, sans-serif" }}>Доставка и оплата</h1>

      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Icon name="Truck" size={22} className="text-primary" />
            </div>
            <h2 className="text-lg font-black" style={{ fontFamily: "Montserrat, sans-serif" }}>Доставка</h2>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex justify-between py-2 border-b border-border">
              <span>Почта России</span><span className="font-semibold text-foreground">от 250 ₽ / 5–14 дней</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span>СДЭК (пункты выдачи)</span><span className="font-semibold text-foreground">от 350 ₽ / 2–5 дней</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span>СДЭК (курьер)</span><span className="font-semibold text-foreground">от 450 ₽ / 2–5 дней</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Для ветеранов СВО</span><span className="font-semibold text-green-600">Бесплатно</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Icon name="CreditCard" size={22} className="text-yellow-600" />
            </div>
            <h2 className="text-lg font-black" style={{ fontFamily: "Montserrat, sans-serif" }}>Способы оплаты</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
              <span className="text-2xl">🏦</span>
              <div>
                <div className="font-bold text-sm">Т-Банк (Тинькофф)</div>
                <div className="text-xs text-muted-foreground">Банковская карта, онлайн-оплата — безопасно и быстро</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-border">
              <span className="text-2xl">💳</span>
              <div>
                <div className="font-bold text-sm">Банковские карты</div>
                <div className="text-xs text-muted-foreground">Visa, MasterCard, МИР — при оформлении заказа</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
          <div className="flex items-start gap-3">
            <Icon name="Info" size={20} className="text-primary mt-0.5 flex-shrink-0" />
            <div className="text-sm text-foreground">
              <div className="font-bold mb-1">Возврат товара</div>
              Возврат и обмен товара осуществляется в течение 14 дней с момента получения при наличии упаковки и чека, согласно Закону о защите прав потребителей РФ.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
