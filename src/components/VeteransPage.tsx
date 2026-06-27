import { useState } from "react";
import ProductCard from "@/components/ProductCard";
import Icon from "@/components/ui/icon";
import type { Product } from "@/App";
import func2url from "../../backend/func2url.json";

const SEND_EMAIL_URL = (func2url as Record<string, string>)["send-email"];
const VETDOC_URL = (func2url as Record<string, string>)["settings"] + "?type=vetdoc";

type Props = {
  products: Product[];
  addToCart: (p: Product) => void;
};

export default function VeteransPage({ products, addToCart }: Props) {
  const vetProducts = products.filter((p) => p.isVeteran);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [vetStatus, setVetStatus] = useState("");
  const [comment, setComment] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [docName, setDocName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("Файл слишком большой (макс. 10 МБ)");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch(VETDOC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: base64, contentType: file.type }),
      });
      const data = await res.json();
      if (data.url) {
        setDocUrl(data.url);
        setDocName(file.name);
      } else {
        setError(data.error || "Не удалось загрузить документ");
      }
    } catch {
      setError("Ошибка при загрузке документа");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const submit = async () => {
    if (!name.trim() || !phone.trim()) {
      setError("Укажите ФИО и телефон");
      return;
    }
    if (!docUrl) {
      setError("Приложите документ, подтверждающий статус");
      return;
    }
    setError("");
    setSending(true);
    try {
      const res = await fetch(SEND_EMAIL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formType: "veteran",
          name, phone, email, address, vetStatus, comment, docUrl,
          cart: vetProducts.map((p) => ({ name: p.name, qty: 1 })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSent(true);
      } else {
        setError(data.error || "Не удалось отправить заявку");
      }
    } catch {
      setError("Ошибка отправки заявки");
    } finally {
      setSending(false);
    }
  };

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

      <section className="py-10 px-4 bg-white border-t border-border">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-xl font-black mb-2 text-center" style={{ fontFamily: "Montserrat, sans-serif" }}>
            Заявка на бесплатное получение
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Заполните форму и приложите документ — мы свяжемся с вами для бесплатной доставки
          </p>

          {sent ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Icon name="CheckCircle2" fallback="Check" size={40} className="text-green-600" />
              </div>
              <h3 className="font-black text-lg mb-1">Заявка отправлена!</h3>
              <p className="text-sm text-muted-foreground">
                Спасибо. Мы проверим документ и свяжемся с вами по указанному телефону.
              </p>
            </div>
          ) : (
            <div className="bg-slate-50 border border-border rounded-2xl p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="ФИО *" value={name} onChange={setName} placeholder="Иванов Иван Иванович" />
                <Field label="Телефон *" value={phone} onChange={setPhone} placeholder="+7 (___) ___-__-__" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Email" value={email} onChange={setEmail} placeholder="email@example.com" />
                <Field label="Статус (ветеран / семья)" value={vetStatus} onChange={setVetStatus} placeholder="Участник СВО" />
              </div>
              <Field label="Адрес доставки" value={address} onChange={setAddress} placeholder="Город, улица, дом, квартира" />
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Комментарий</label>
                <textarea
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Какие товары интересуют, дополнительная информация"
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                  Документ, подтверждающий статус * (фото, скан или PDF)
                </label>
                <label className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-xl px-3 py-4 text-sm font-semibold cursor-pointer transition-colors ${docUrl ? "border-green-300 bg-green-50 text-green-700" : "border-border hover:bg-white"} ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
                  <Icon name={uploading ? "Loader2" : docUrl ? "CheckCircle2" : "Upload"} fallback="Upload" size={18} className={uploading ? "animate-spin" : ""} />
                  {uploading ? "Загружаем…" : docUrl ? `Загружено: ${docName}` : "Загрузить документ"}
                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleDoc} />
                </label>
                <p className="text-[11px] text-muted-foreground mt-1">Военный билет, удостоверение или справка. До 10 МБ.</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2">{error}</div>
              )}

              <button
                onClick={submit}
                disabled={sending}
                className="bear-btn w-full bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-2xl disabled:opacity-60"
              >
                {sending ? "Отправляем…" : "Отправить заявку"}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground mb-1 block">{label}</label>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}