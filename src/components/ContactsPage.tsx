import { useState } from "react";
import Icon from "@/components/ui/icon";

export default function ContactsPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl animate-fade-in">
      <h1 className="text-3xl font-black mb-8" style={{ fontFamily: "Montserrat, sans-serif" }}>Контакты</h1>

      <div className="grid sm:grid-cols-2 gap-6 mb-8">
        {[
          { icon: "Phone", label: "Телефон", value: "+7 (800) 000-00-00", sub: "Бесплатный звонок по России" },
          { icon: "Mail", label: "Email", value: "info@mtb-market.ru", sub: "Ответим в течение 24 часов" },
          { icon: "MapPin", label: "Адрес", value: "Москва, ул. Биотехническая, 1", sub: "Пн–Пт: 9:00–18:00" },
          { icon: "Clock", label: "Режим работы", value: "Пн–Пт 9:00–18:00", sub: "Сб–Вс: выходной" },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-2xl border border-border p-5 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Icon name={item.icon} fallback="Star" size={20} className="text-primary" />
            </div>
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-0.5">{item.label}</div>
              <div className="font-bold text-sm text-foreground">{item.value}</div>
              <div className="text-xs text-muted-foreground">{item.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-border p-6">
        <h2 className="text-xl font-black mb-5" style={{ fontFamily: "Montserrat, sans-serif" }}>Написать нам</h2>
        {sent ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">🐻</div>
            <div className="font-bold text-lg mb-1">Сообщение отправлено!</div>
            <div className="text-muted-foreground text-sm">Мы свяжемся с вами в ближайшее время</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Ваше имя</label>
              <input required className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Иван Иванов" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Телефон</label>
              <input required className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+7 (___) ___-__-__" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Сообщение</label>
              <textarea required rows={4} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Ваш вопрос..." />
            </div>
            <button type="submit" className="bear-btn w-full bg-primary text-primary-foreground font-bold py-3 rounded-2xl">
              Отправить
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
