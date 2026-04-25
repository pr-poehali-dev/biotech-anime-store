import Icon from "@/components/ui/icon";
import ProductCard from "@/components/ProductCard";
import type { Page, Product } from "@/App";

type Props = {
  setPage: (p: Page) => void;
  products: Product[];
  addToCart: (p: Product) => void;
};

const CATEGORIES = [
  { icon: "🧬", label: "Биотехнологии", key: "Биотехнологии" },
  { icon: "💊", label: "Нутрицевтика", key: "Нутрицевтика" },
  { icon: "🌿", label: "Детокс", key: "Детокс" },
  { icon: "💻", label: "Компьютеры", key: "Компьютеры" },
  { icon: "👟", label: "Одежда и обувь", key: "Одежда и обувь" },
  { icon: "🔧", label: "Услуги", key: "Услуги" },
  { icon: "🎖️", label: "Ветеранам", key: "Ветеранам" },
];

const BEAR_URL = "https://cdn.poehali.dev/projects/bdc6b0f1-9d51-4bfd-8a1e-7d2779701ef2/files/06d573e8-89dd-4724-ab0e-a053e7d5790b.jpg";
const VET_BEAR_URL = "https://cdn.poehali.dev/projects/bdc6b0f1-9d51-4bfd-8a1e-7d2779701ef2/files/6d6aa334-77cf-4882-8c40-3c4eea7b5ccd.jpg";

export default function HomePage({ setPage, products, addToCart }: Props) {
  const hits = products.filter((p) => !p.isVeteran).slice(0, 4);

  return (
    <div className="animate-fade-in">
      {/* HERO */}
      <section className="hero-gradient text-white py-14 px-4">
        <div className="container mx-auto flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-block bg-white/15 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4 tracking-widest uppercase">
              Официальный маркетплейс
            </div>
            <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">
              МТМ Маркет<br />
              <span className="text-blue-200">Услуги профессионалов</span>
            </h1>
            <p className="text-blue-100 text-lg mb-8 max-w-md">
              Передовые биотехнологические продукты для вашего здоровья. Лицензированная продукция, доставка по всей России.
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <button
                onClick={() => setPage("catalog")}
                className="bear-btn bg-white text-blue-900 font-bold px-6 py-3 rounded-2xl flex items-center gap-2"
              >
                <Icon name="Grid3X3" size={18} />
                Перейти в каталог
              </button>
              <button
                onClick={() => setPage("veterans")}
                className="bear-btn bg-red-600 text-white font-bold px-6 py-3 rounded-2xl flex items-center gap-2 border-2 border-red-400"
              >
                🎖️ Товары для ветеранов СВО
              </button>
            </div>
          </div>
          <div className="flex gap-4 justify-center">
            <div className="relative">
              <img src={BEAR_URL} alt="Мишка-маскот" className="w-36 h-36 md:w-48 md:h-48 rounded-3xl border-4 border-white/30 shadow-2xl object-cover" />
              <div className="absolute -bottom-3 -right-3 bg-amber-400 text-amber-900 text-xs font-black px-2 py-1 rounded-lg">🛒 В корзину!</div>
            </div>
            <div className="relative mt-8">
              <img src={VET_BEAR_URL} alt="Мишка ветеран" className="w-28 h-28 md:w-36 md:h-36 rounded-3xl border-4 border-red-400/50 shadow-2xl object-cover" />
              <div className="absolute -bottom-3 -left-3 bg-red-600 text-white text-xs font-black px-2 py-1 rounded-lg">🎖️ СВО</div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-10 px-4 bg-white border-b border-border">
        <div className="container mx-auto">
          <h2 className="text-xl font-black mb-6 text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>Категории</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => cat.key === "Ветеранам" ? setPage("veterans") : cat.key === "Услуги" ? setPage("services") : setPage("catalog")}
                className={`bear-btn flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 font-semibold text-sm transition-all ${
                  cat.key === "Ветеранам"
                    ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                    : cat.key === "Услуги"
                    ? "border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"
                    : "border-border bg-background hover:border-primary hover:bg-blue-50 text-foreground"
                }`}
              >
                <span className="text-3xl">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* VETERANS BANNER */}
      <section className="py-8 px-4 vet-gradient text-white">
        <div className="container mx-auto flex flex-col sm:flex-row items-center gap-6">
          <img src={VET_BEAR_URL} alt="Мишка ветеран" className="w-24 h-24 rounded-2xl object-cover border-2 border-white/30 shadow-xl" />
          <div className="flex-1 text-center sm:text-left">
            <div className="text-xs font-bold tracking-widest text-blue-300 uppercase mb-1">Специальный раздел</div>
            <h3 className="text-2xl font-black mb-2">Товары для ветеранов СВО</h3>
            <p className="text-blue-200 text-sm mb-4">Бесплатные и льготные биотехнологические продукты для восстановления здоровья участников специальной военной операции</p>
            <button
              onClick={() => setPage("veterans")}
              className="bear-btn bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl inline-flex items-center gap-2"
            >
              🎖️ Получить бесплатно
            </button>
          </div>
        </div>
      </section>

      {/* HITS */}
      <section className="py-10 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>Хиты продаж</h2>
            <button onClick={() => setPage("catalog")} className="text-primary text-sm font-semibold flex items-center gap-1 hover:underline">
              Все товары <Icon name="ChevronRight" size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {hits.map((p) => (
              <ProductCard key={p.id} product={p} onAdd={addToCart} />
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES PROMO */}
      <section className="py-12 px-4 bg-gradient-to-br from-slate-50 to-blue-50 border-t border-border">
        <div className="container mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-3">
            <div>
              <div className="text-xs font-bold tracking-widest text-primary uppercase mb-1">Профессиональный сервис</div>
              <h2 className="text-2xl font-black text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Услуги профессионалов
              </h2>
              <p className="text-muted-foreground text-sm mt-1">Ремонт ПК, установка ПО, техническое обслуживание</p>
            </div>
            <button
              onClick={() => setPage("services")}
              className="bear-btn flex items-center gap-2 bg-primary text-primary-foreground font-bold px-5 py-2.5 rounded-xl text-sm shrink-0"
            >
              Все услуги <Icon name="ChevronRight" size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: "🔍", name: "Диагностика ПК / ноутбука",   price: "500 ₽",      time: "1–2 часа" },
              { icon: "⚙️", name: "Установка Windows 10 / 11",   price: "1 200 ₽",    time: "2–3 часа" },
              { icon: "🧹", name: "Чистка от пыли + термопаста", price: "800 ₽",      time: "1 час"    },
              { icon: "🔑", name: "Удаление вирусов и рекламы",  price: "1 000 ₽",    time: "2 часа"   },
              { icon: "🖥️", name: "Замена матрицы ноутбука",     price: "от 2 500 ₽", time: "1–3 часа" },
              { icon: "📦", name: "Перенос данных / резервная копия", price: "700 ₽", time: "1–3 часа" },
            ].map((s) => (
              <button
                key={s.name}
                onClick={() => setPage("services")}
                className="bear-btn text-left bg-white border border-border rounded-2xl p-5 hover:border-primary hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{s.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-foreground leading-snug mb-1 group-hover:text-primary transition-colors">
                      {s.name}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-primary font-black text-sm">{s.price}</span>
                      <span className="text-muted-foreground text-xs">· {s.time}</span>
                    </div>
                  </div>
                  <Icon name="ChevronRight" size={16} className="text-muted-foreground group-hover:text-primary mt-1 shrink-0 transition-colors" />
                </div>
              </button>
            ))}
          </div>

          {/* CTA полоска */}
          <div className="mt-6 bg-primary/5 border border-primary/20 rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-center gap-4 justify-between">
            <div className="text-center sm:text-left">
              <p className="font-bold text-foreground text-sm">Нужен выезд специалиста?</p>
              <p className="text-muted-foreground text-xs mt-0.5">Работаем по всей России · Гарантия на все работы</p>
            </div>
            <button
              onClick={() => setPage("contacts")}
              className="bear-btn bg-primary text-primary-foreground font-bold px-5 py-2.5 rounded-xl text-sm shrink-0"
            >
              📞 Связаться
            </button>
          </div>
        </div>
      </section>

      {/* USP ROW */}
      <section className="py-10 px-4 bg-white border-t border-border">
        <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: "Truck", label: "Доставка по России", sub: "от 1-3 дней" },
            { icon: "Shield", label: "Гарантия качества", sub: "Сертификаты GMP" },
            { icon: "CreditCard", label: "Оплата Т-Банк", sub: "Безопасно" },
            { icon: "Phone", label: "Поддержка 24/7", sub: "Всегда на связи" },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                <Icon name={item.icon} fallback="Star" size={24} className="text-primary" />
              </div>
              <div className="font-bold text-sm text-foreground">{item.label}</div>
              <div className="text-xs text-muted-foreground">{item.sub}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="py-6 px-4 bg-slate-900 text-slate-400 text-center text-xs">
        <div className="container mx-auto">
          © 2025 МТМ Маркет — Медтех · Ремонт ПК · Биотехнологии. Все права защищены.
          <br />
          Продукция сертифицирована и имеет необходимые разрешения.
        </div>
      </footer>
    </div>
  );
}