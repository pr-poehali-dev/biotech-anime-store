import ProductCard from "@/components/ProductCard";
import Icon from "@/components/ui/icon";
import type { Product } from "@/App";

type Props = {
  products: Product[];
  addToCart: (p: Product) => void;
};

export default function VeteransPage({ products, addToCart }: Props) {
  const vetProducts = products.filter((p) => p.isVeteran);

  return (
    <div className="animate-fade-in">
      <section className="vet-gradient text-white py-14 px-4">
        <div className="container mx-auto text-center">
          <div className="text-5xl mb-4">🎖️</div>
          <h1 className="text-4xl font-black mb-3" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Товары для ветеранов СВО
          </h1>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto">
            Специальная программа поддержки участников специальной военной операции и их семей.
            Биотехнологические продукты для восстановления здоровья — бесплатно.
          </p>
        </div>
      </section>

      <section className="py-8 px-4 bg-white border-b border-border">
        <div className="container mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: "Gift", label: "Бесплатно", sub: "Для участников СВО и их семей" },
            { icon: "FileText", label: "Нужен документ", sub: "Военный билет или справка" },
            { icon: "Truck", label: "Бесплатная доставка", sub: "По всей России" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <Icon name={item.icon} fallback="Star" size={24} className="text-red-600" />
              </div>
              <div>
                <div className="font-bold text-sm text-foreground">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-10 px-4">
        <div className="container mx-auto">
          <h2 className="text-xl font-black mb-6" style={{ fontFamily: "Montserrat, sans-serif" }}>Доступные программы</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vetProducts.map((p) => (
              <ProductCard key={p.id} product={p} onAdd={addToCart} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 px-4 bg-slate-50 border-t border-border">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-xl font-black mb-4 text-center" style={{ fontFamily: "Montserrat, sans-serif" }}>Как получить товары</h2>
          <div className="space-y-3">
            {[
              { n: "1", text: "Выберите нужные товары и добавьте в корзину" },
              { n: "2", text: "В поле комментария укажите ваш статус ветерана СВО" },
              { n: "3", text: "Приложите скан/фото документа, подтверждающего статус" },
              { n: "4", text: "Получите товары бесплатно с доставкой на дом" },
            ].map((step) => (
              <div key={step.n} className="flex items-start gap-3 bg-white p-4 rounded-xl border border-border">
                <div className="w-8 h-8 rounded-full badge-vet flex items-center justify-center text-sm font-black flex-shrink-0">
                  {step.n}
                </div>
                <p className="text-sm text-foreground font-medium pt-1">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
