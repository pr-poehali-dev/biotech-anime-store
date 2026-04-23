import { useState } from "react";
import Icon from "@/components/ui/icon";
import type { Page } from "@/App";

type Props = {
  setPage: (p: Page) => void;
};

const PERSONAL_SERVICES = [
  { icon: "🔍", name: "Диагностика ПК / ноутбука", price: "500 ₽", time: "1–2 часа", desc: "Полная диагностика железа и ПО, письменное заключение о состоянии устройства" },
  { icon: "🖥️", name: "Замена матрицы ноутбука", price: "от 2 500 ₽", time: "1–3 часа", desc: "Оригинальные и совместимые экраны, гарантия 6 месяцев на работу и комплектующие" },
  { icon: "⚙️", name: "Установка Windows 10 / 11", price: "1 200 ₽", time: "2–3 часа", desc: "Чистая установка, все драйверы, базовый софт, антивирус, активация" },
  { icon: "🧹", name: "Чистка от пыли + термопаста", price: "800 ₽", time: "1 час", desc: "Разборка, очистка кулеров и радиаторов, замена термопасты, проверка температур" },
  { icon: "🔑", name: "Удаление вирусов и рекламы", price: "1 000 ₽", time: "2 часа", desc: "Полное сканирование, удаление вредоносного ПО, настройка защиты" },
  { icon: "📦", name: "Перенос данных / резервная копия", price: "700 ₽", time: "1–3 часа", desc: "Перенос файлов, документов, фото на новый ПК, создание резервной копии" },
];

const BUSINESS_PLANS = [
  {
    name: "Старт",
    price: "2 900 ₽/мес",
    unit: "до 5 ПК",
    color: "border-slate-200 bg-white",
    headerColor: "bg-slate-50",
    badge: null,
    features: [
      "Удалённая поддержка — безлимит",
      "Плановое ТО — 1 раз в квартал",
      "Выезд инженера — 1 раз в месяц",
      "SLA: ответ за 8 часов",
      "Антивирусная защита",
      "Отчёт о состоянии техники",
    ],
    notIncluded: ["Выделенный инженер", "Замена оборудования"],
  },
  {
    name: "Базовый",
    price: "4 900 ₽/мес",
    unit: "до 10 ПК",
    color: "border-primary bg-white",
    headerColor: "hero-gradient text-white",
    badge: "Популярный",
    features: [
      "Удалённая поддержка — безлимит",
      "Плановое ТО — ежеквартально",
      "Выезд инженера — 2 раза в месяц",
      "SLA: ответ за 4 часа",
      "Антивирусная защита",
      "Резервное копирование",
      "Отчёт о состоянии техники",
      "Консультации по закупке ПК",
    ],
    notIncluded: ["Выделенный инженер"],
  },
  {
    name: "Бизнес",
    price: "9 900 ₽/мес",
    unit: "до 25 ПК",
    color: "border-slate-200 bg-white",
    headerColor: "bg-slate-800 text-white",
    badge: null,
    features: [
      "Удалённая поддержка — безлимит",
      "Плановое ТО — ежемесячно",
      "Выезд инженера — еженедельно",
      "SLA: ответ за 2 часа",
      "Антивирусная защита корпоративная",
      "Резервное копирование + облако",
      "Замена оборудования из фонда",
      "Консультации и закупка техники",
      "Личный кабинет с историей",
    ],
    notIncluded: [],
  },
  {
    name: "Корпоративный",
    price: "14 900 ₽/мес",
    unit: "до 50 ПК",
    color: "border-amber-300 bg-amber-50/30",
    headerColor: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
    badge: "Для бизнеса",
    features: [
      "Выделенный инженер в штате",
      "Удалённый мониторинг 24/7",
      "Ежедневное ТО и мониторинг",
      "SLA: ответ за 1 час",
      "Корпоративная антивирусная защита",
      "Резервное копирование + облако",
      "Замена оборудования из фонда",
      "Закупка и поставка техники",
      "Личный кабинет + API",
      "Подключение до 3 офисов",
    ],
    notIncluded: [],
  },
];

const EMAIL_URL = "https://functions.poehali.dev/96724469-2c55-4fdb-8962-080fa1f53e80";

export default function ServicesPage({ setPage }: Props) {
  const [form, setForm] = useState({ name: "", company: "", phone: "", email: "", plan: "", comment: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"personal" | "business">("personal");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(EMAIL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formType: form.plan || "Заявка с сайта", ...form }),
      });
      const data = await res.json();
      if (data.success) {
        setSent(true);
      } else {
        setError(data.error || "Ошибка отправки");
      }
    } catch {
      setError("Не удалось отправить заявку. Позвоните нам напрямую.");
    } finally {
      setLoading(false);
    }
  };

  const selectPlan = (planName: string) => {
    setForm((f) => ({ ...f, plan: planName }));
    setActiveTab("business");
    setTimeout(() => {
      document.getElementById("request-form")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div className="animate-fade-in">
      {/* HERO */}
      <section className="hero-gradient text-white py-14 px-4">
        <div className="container mx-auto text-center">
          <div className="text-5xl mb-4">🔧</div>
          <h1 className="text-4xl font-black mb-3" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Обслуживание и ремонт ПК
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-8">
            Профессиональный ремонт для частных лиц и комплексное IT-обслуживание предприятий по договору. Быстро, надёжно, с гарантией.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => setActiveTab("personal")}
              className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === "personal" ? "bg-white text-blue-900" : "bg-white/20 text-white hover:bg-white/30"}`}
            >
              👤 Частным лицам
            </button>
            <button
              onClick={() => setActiveTab("business")}
              className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === "business" ? "bg-white text-blue-900" : "bg-white/20 text-white hover:bg-white/30"}`}
            >
              🏢 Предприятиям
            </button>
          </div>
        </div>
      </section>

      {/* USP */}
      <section className="py-8 px-4 bg-white border-b border-border">
        <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { icon: "Zap", label: "Быстро", sub: "Выезд в день обращения" },
            { icon: "Shield", label: "Гарантия", sub: "До 12 месяцев на работы" },
            { icon: "FileText", label: "Договор", sub: "Официально, с документами" },
            { icon: "Headphones", label: "Поддержка", sub: "Пн–Сб с 9:00 до 20:00" },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-2 p-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center">
                <Icon name={item.icon} fallback="Star" size={22} className="text-primary" />
              </div>
              <div className="font-bold text-sm">{item.label}</div>
              <div className="text-xs text-muted-foreground">{item.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PERSONAL SERVICES */}
      {activeTab === "personal" && (
        <section className="py-10 px-4">
          <div className="container mx-auto">
            <h2 className="text-2xl font-black mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>Услуги для частных лиц</h2>
            <p className="text-muted-foreground text-sm mb-8">Ремонт и настройка компьютеров и ноутбуков — приём в сервисе или выезд на дом</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PERSONAL_SERVICES.map((s) => (
                <div key={s.name} className="bg-white rounded-2xl border border-border p-5 card-hover flex flex-col gap-3">
                  <div className="text-3xl">{s.icon}</div>
                  <div>
                    <div className="font-black text-sm mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>{s.name}</div>
                    <div className="text-xs text-muted-foreground mb-2">{s.desc}</div>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <div>
                      <div className="font-black text-primary text-base">{s.price}</div>
                      <div className="text-xs text-muted-foreground">⏱ {s.time}</div>
                    </div>
                    <button
                      onClick={() => { setForm((f) => ({ ...f, plan: s.name, comment: `Интересует услуга: ${s.name}` })); setActiveTab("business"); document.getElementById("request-form")?.scrollIntoView({ behavior: "smooth" }); }}
                      className="bear-btn bg-primary text-primary-foreground text-xs font-bold px-3 py-2 rounded-xl"
                    >
                      Заказать
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 bg-blue-50 rounded-2xl border border-blue-200 p-5 flex items-start gap-3">
              <Icon name="Info" size={20} className="text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm text-foreground">
                <div className="font-bold mb-1">Выезд на дом</div>
                Стоимость выезда в пределах города — <strong>500 ₽</strong>. Если при диагностике на месте принято решение о ремонте — выезд бесплатно.
              </div>
            </div>
          </div>
        </section>
      )}

      {/* BUSINESS PLANS */}
      {activeTab === "business" && (
        <section className="py-10 px-4">
          <div className="container mx-auto">
            <h2 className="text-2xl font-black mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>Тарифы для предприятий</h2>
            <p className="text-muted-foreground text-sm mb-8">Комплексное обслуживание по договору — фиксированная ежемесячная стоимость, без скрытых платежей</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
              {BUSINESS_PLANS.map((plan) => (
                <div key={plan.name} className={`rounded-3xl border-2 overflow-hidden flex flex-col ${plan.color}`}>
                  <div className={`p-5 relative ${plan.headerColor}`}>
                    {plan.badge && (
                      <div className="absolute top-3 right-3 bg-white/20 text-white text-xs font-black px-2 py-1 rounded-lg border border-white/30">
                        {plan.badge}
                      </div>
                    )}
                    <div className="font-black text-xl mb-1" style={{ fontFamily: "Montserrat, sans-serif" }}>{plan.name}</div>
                    <div className="text-sm opacity-80">{plan.unit}</div>
                    <div className="mt-3 font-black text-2xl">{plan.price}</div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <ul className="space-y-2 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                          <span>{f}</span>
                        </li>
                      ))}
                      {plan.notIncluded.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-slate-300 mt-0.5 flex-shrink-0">✗</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => selectPlan(plan.name)}
                      className="bear-btn mt-5 w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-xl text-sm"
                    >
                      Выбрать тариф
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 rounded-2xl border border-border p-5 mb-10">
              <div className="font-black text-base mb-3" style={{ fontFamily: "Montserrat, sans-serif" }}>Что входит в договор на обслуживание</div>
              <div className="grid sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                {[
                  "Официальный договор с печатью и подписями",
                  "Акты выполненных работ ежемесячно",
                  "Инвентаризация и паспортизация техники",
                  "Рекомендации по модернизации парка ПК",
                  "Настройка сети, принтеров, сканеров",
                  "Помощь при переезде офиса",
                  "Консультации сотрудников по работе с ПК",
                  "Закупка расходников и комплектующих",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* REQUEST FORM */}
      <section id="request-form" className="py-12 px-4 bg-white border-t border-border">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-2xl font-black mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>Оставить заявку</h2>
          <p className="text-muted-foreground text-sm mb-6">Перезвоним в течение 30 минут в рабочее время</p>
          {sent ? (
            <div className="text-center py-12 bg-green-50 rounded-3xl border border-green-200">
              <div className="text-6xl mb-4">🐻</div>
              <div className="font-black text-xl mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>Заявка принята!</div>
              <div className="text-muted-foreground text-sm">Наш специалист свяжется с вами в течение 30 минут</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-slate-50 rounded-3xl border border-border p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Ваше имя *</label>
                  <input required className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-primary/30" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Иван Петров" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Компания</label>
                  <input className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-primary/30" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="ООО «Ромашка»" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Телефон *</label>
                  <input required className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-primary/30" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+7 (___) ___-__-__" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Email</label>
                  <input type="email" className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-primary/30" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="info@company.ru" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Тариф / услуга</label>
                <select className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-primary/30" value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
                  <option value="">— Выберите —</option>
                  <optgroup label="Частным лицам">
                    {PERSONAL_SERVICES.map((s) => <option key={s.name} value={s.name}>{s.name} — {s.price}</option>)}
                  </optgroup>
                  <optgroup label="Предприятиям (договор)">
                    {BUSINESS_PLANS.map((p) => <option key={p.name} value={p.name}>{p.name} — {p.price} ({p.unit})</option>)}
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Комментарий</label>
                <textarea rows={3} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-primary/30 resize-none" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} placeholder="Опишите задачу или вопрос..." />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading} className="bear-btn w-full bg-primary text-primary-foreground font-black py-3 rounded-2xl text-base flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? <><Icon name="Loader2" size={18} className="animate-spin" />Отправляем...</> : <><Icon name="Send" size={18} />Отправить заявку</>}
              </button>
              <p className="text-xs text-muted-foreground text-center">Нажимая кнопку, вы соглашаетесь с обработкой персональных данных</p>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}