import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import type { Product } from "@/App";
import { useSiteSettings, type MenuItem, type ContactItem, type SiteSettings, type PageTexts } from "@/contexts/SiteSettingsContext";
import type { Task } from "@/components/TasksPage";
import func2url from "../../backend/func2url.json";

const TASKS_URL = (func2url as Record<string, string>)["tasks"];
const ENGINEERS_URL = (func2url as Record<string, string>)["engineers"];
const ADMIN_PASSWORD = "567765";

type Props = {
  products: Product[];
  setProducts: (p: Product[]) => void;
};

const EMPTY: Omit<Product, "id"> = {
  name: "",
  price: 0,
  oldPrice: undefined,
  image: "",
  category: "Биотехнологии",
  isVeteran: false,
  description: "",
  badge: "",
  outOfStock: false,
};

const CATEGORIES = ["Биотехнологии", "Нутрицевтика", "Детокс", "Компьютеры", "Одежда и обувь", "Услуги", "Ветеранам"];

type Tab = "site" | "texts" | "menu" | "contacts" | "products" | "payment" | "orders" | "engineers" | "tasks";

const PAYMENT_URL = (func2url as Record<string, string>)["payment-settings"];
const TBANK_URL = (func2url as Record<string, string>)["tbank-payment"];

export default function AdminPage({ products, setProducts }: Props) {
  const [password, setPassword] = useState("");
  const [auth, setAuth] = useState(false);
  const [tab, setTab] = useState<Tab>("site");
  const { settings, updateSettings, updateTexts, setMenu, setContacts, resetToDefault } = useSiteSettings();

  if (!auth) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-border p-8 w-full max-w-sm shadow-xl animate-fade-in">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl hero-gradient flex items-center justify-center mx-auto mb-3">
              <Icon name="Lock" size={28} className="text-white" />
            </div>
            <h2 className="text-xl font-black" style={{ fontFamily: "Montserrat, sans-serif" }}>Админ-панель</h2>
            <p className="text-sm text-muted-foreground mt-1">Введите пароль для доступа</p>
          </div>
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && password === ADMIN_PASSWORD && setAuth(true)}
            className="w-full border border-border rounded-xl px-4 py-2.5 mb-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={() => password === ADMIN_PASSWORD ? setAuth(true) : alert("Неверный пароль")}
            className="bear-btn w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-xl"
          >
            Войти
          </button>
          <p className="text-xs text-muted-foreground text-center mt-3">Доступ только для администратора</p>
        </div>
      </div>
    );
  }

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "site", label: "Сайт", icon: "Globe" },
    { id: "texts", label: "Тексты", icon: "Type" },
    { id: "menu", label: "Меню", icon: "Menu" },
    { id: "contacts", label: "Контакты", icon: "Phone" },
    { id: "products", label: "Товары", icon: "Package" },
    { id: "payment", label: "Оплата", icon: "CreditCard" },
    { id: "orders", label: "Заказы", icon: "Receipt" },
    { id: "engineers", label: "Инженеры", icon: "HardHat" },
    { id: "tasks", label: "Задачи", icon: "ClipboardList" },
  ];

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black" style={{ fontFamily: "Montserrat, sans-serif" }}>Админ-панель</h1>
          <p className="text-muted-foreground text-sm">Управление всем проектом</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={async () => { if (confirm("Сбросить ВСЕ настройки сайта к исходным?")) await resetToDefault(ADMIN_PASSWORD); }}
            className="px-4 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-secondary transition-colors"
          >
            <Icon name="RotateCcw" size={16} className="inline mr-1" />
            Сброс
          </button>
          <button onClick={() => setAuth(false)} className="px-4 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-secondary transition-colors">
            Выйти
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
              tab === t.id ? "bg-primary text-primary-foreground" : "bg-white border border-border hover:bg-secondary"
            }`}
          >
            <Icon name={t.icon} fallback="Circle" size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "site" && <SiteTab settings={settings} updateSettings={updateSettings} />}
      {tab === "texts" && <TextsTab settings={settings} updateTexts={updateTexts} />}
      {tab === "menu" && <MenuTab menu={settings.menu} setMenu={setMenu} />}
      {tab === "contacts" && <ContactsTab contacts={settings.contacts} setContacts={setContacts} />}
      {tab === "products" && <ProductsTab products={products} setProducts={setProducts} />}
      {tab === "payment" && <PaymentTab />}
      {tab === "orders" && <OrdersTab />}
      {tab === "engineers" && <EngineersTab />}
      {tab === "tasks" && <TasksTab />}
    </div>
  );
}

function SiteTab({ settings, updateSettings }: { settings: SiteSettings; updateSettings: (p: Partial<SiteSettings>, pwd: string) => Promise<void> }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
      <h2 className="font-black text-lg mb-2">Название сайта</h2>
      <Field label="Название (в шапке)" value={settings.siteName} onChange={(v) => updateSettings({ siteName: v }, ADMIN_PASSWORD)} />
      <Field label="Подзаголовок (под названием)" value={settings.siteSubtitle} onChange={(v) => updateSettings({ siteSubtitle: v }, ADMIN_PASSWORD)} />
      <Field label="Полное название компании" value={settings.siteFullName} onChange={(v) => updateSettings({ siteFullName: v }, ADMIN_PASSWORD)} />
      <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-900">
        ✓ Изменения сохраняются в облаке и видны всем посетителям сайта.
      </div>
    </div>
  );
}

type PaymentStatus = {
  configured: boolean;
  terminalKeyMasked: string;
  secretKeySet: boolean;
  isTest: boolean;
  enabled: boolean;
};

function PaymentTab() {
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [terminalKey, setTerminalKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [isTest, setIsTest] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(PAYMENT_URL);
      if (res.ok) {
        const data: PaymentStatus = await res.json();
        setStatus(data);
        setIsTest(data.isTest);
        setEnabled(data.enabled);
      }
    } catch (e) {
      console.warn("payment load failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    const payload: Record<string, unknown> = { isTest, enabled };
    if (terminalKey.trim()) payload.terminalKey = terminalKey.trim();
    if (secretKey.trim()) payload.secretKey = secretKey.trim();
    try {
      const res = await fetch(PAYMENT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Password": ADMIN_PASSWORD },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setTerminalKey("");
        setSecretKey("");
        setSaved(true);
        await load();
      } else {
        alert("Не удалось сохранить ключи");
      }
    } catch (e) {
      console.warn("payment save failed", e);
      alert("Ошибка сети при сохранении");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="bg-white rounded-2xl border border-border p-6 text-sm text-muted-foreground">Загрузка…</div>;
  }

  return (
    <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-black text-lg">Эквайринг Т-Банка</h2>
        {status?.configured ? (
          <span className="flex items-center gap-1.5 text-xs font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full">
            <Icon name="CheckCircle2" fallback="Check" size={14} /> Подключено
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
            <Icon name="AlertCircle" fallback="Circle" size={14} /> Не настроено
          </span>
        )}
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1 block">
          Terminal Key (идентификатор терминала)
        </label>
        <input
          className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          value={terminalKey}
          placeholder={status?.terminalKeyMasked || "Введите Terminal Key"}
          onChange={(e) => setTerminalKey(e.target.value)}
        />
        {status?.terminalKeyMasked && (
          <p className="text-[11px] text-muted-foreground mt-1">Текущий: {status.terminalKeyMasked}</p>
        )}
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1 block">
          Secret Key / Password (секретный ключ)
        </label>
        <input
          type="password"
          autoComplete="new-password"
          className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          value={secretKey}
          placeholder={status?.secretKeySet ? "•••• (сохранён, оставьте пустым, чтобы не менять)" : "Введите Secret Key"}
          onChange={(e) => setSecretKey(e.target.value)}
        />
      </div>

      <label className="flex items-center gap-3 border border-border rounded-xl px-3 py-2.5 cursor-pointer">
        <input type="checkbox" className="w-4 h-4 accent-primary" checked={isTest} onChange={(e) => setIsTest(e.target.checked)} />
        <div>
          <div className="text-sm font-semibold">Тестовый режим</div>
          <div className="text-xs text-muted-foreground">Платежи не списываются по-настоящему. Снимите для приёма реальных оплат.</div>
        </div>
      </label>

      <label className="flex items-center gap-3 border border-border rounded-xl px-3 py-2.5 cursor-pointer">
        <input type="checkbox" className="w-4 h-4 accent-primary" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        <div>
          <div className="text-sm font-semibold">Приём оплаты включён</div>
          <div className="text-xs text-muted-foreground">Включает оплату картой на сайте.</div>
        </div>
      </label>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900">
        🔒 Ключи хранятся в защищённом хранилище сервера и никогда не отображаются на сайте. Получить их в Т-Банке: Личный кабинет → Магазины → реквизиты терминала.
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="bear-btn w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-xl disabled:opacity-60"
      >
        {saving ? "Сохранение…" : saved ? "Сохранено ✓" : "Сохранить настройки оплаты"}
      </button>

      <SbpManualBlock />

      <RefundBlock />
    </div>
  );
}

function SbpManualBlock() {
  const { settings, updateSettings } = useSiteSettings();
  const [link, setLink] = useState(settings.sbpLink || "");
  const [qr, setQr] = useState(settings.sbpQrImage || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    await updateSettings({ sbpLink: link.trim(), sbpQrImage: qr.trim() }, ADMIN_PASSWORD);
    setSaving(false);
    setSaved(true);
  };

  return (
    <div className="border-t border-border pt-5 mt-2 space-y-3">
      <div className="flex items-center gap-2">
        <Icon name="QrCode" size={18} className="text-primary" />
        <h3 className="font-black text-base">Оплата по СБП (своя ссылка / QR)</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Вставьте свою ссылку на оплату СБП и/или картинку QR-кода от Т-Банка. Они будут показаны покупателю в корзине при выборе оплаты по СБП.
      </p>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Ссылка на оплату по СБП</label>
        <input
          className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          value={link}
          placeholder="https://www.tbank.ru/..."
          onChange={(e) => setLink(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Ссылка на картинку QR-кода</label>
        <input
          className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          value={qr}
          placeholder="https://...qr.png"
          onChange={(e) => setQr(e.target.value)}
        />
        {qr && (
          <div className="mt-2">
            <img src={qr} alt="Превью QR" className="w-32 h-32 object-contain border border-border rounded-xl bg-white" />
          </div>
        )}
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="bear-btn w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-xl disabled:opacity-60"
      >
        {saving ? "Сохранение…" : saved ? "Сохранено ✓" : "Сохранить ссылку и QR для СБП"}
      </button>
    </div>
  );
}

function RefundBlock() {
  const [paymentId, setPaymentId] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const doRefund = async () => {
    if (!paymentId.trim()) {
      setResult({ ok: false, text: "Укажите номер платежа" });
      return;
    }
    if (!confirm("Оформить возврат средств покупателю? Деньги вернутся на счёт, с которого была оплата.")) return;
    setLoading(true);
    setResult(null);
    try {
      const body: Record<string, unknown> = { action: "refund", paymentId: paymentId.trim() };
      if (amount.trim()) body.amount = Number(amount.trim());
      const res = await fetch(TBANK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Password": ADMIN_PASSWORD },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ ok: true, text: data.message || "Возврат оформлен. Деньги вернутся на счёт покупателя." });
        setPaymentId("");
        setAmount("");
      } else {
        setResult({ ok: false, text: data.error || "Не удалось оформить возврат" });
      }
    } catch {
      setResult({ ok: false, text: "Ошибка сети при оформлении возврата" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-t border-border pt-5 mt-2 space-y-3">
      <div className="flex items-center gap-2">
        <Icon name="Undo2" fallback="RotateCcw" size={18} className="text-primary" />
        <h3 className="font-black text-base">Возврат средств покупателю</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Если покупатель вернул товар и оформил возврат — введите номер платежа. Деньги автоматически вернутся на ту же карту/счёт, с которого была оплата.
      </p>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Номер платежа (PaymentId)</label>
        <input
          className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          value={paymentId}
          placeholder="Например: 5391234567"
          onChange={(e) => setPaymentId(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Сумма возврата, ₽ (пусто = полный возврат)</label>
        <input
          className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          value={amount}
          placeholder="Оставьте пустым для полного возврата"
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      {result && (
        <div className={`rounded-xl px-3 py-2 text-xs ${result.ok ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {result.ok ? "✓ " : "⚠ "}{result.text}
        </div>
      )}
      <button
        onClick={doRefund}
        disabled={loading}
        className="bear-btn w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl disabled:opacity-60"
      >
        {loading ? "Оформляем возврат…" : "Оформить возврат средств"}
      </button>
    </div>
  );
}

type Order = {
  orderId: string;
  paymentId: string;
  amount: number;
  method: string;
  status: string;
  items: { name: string; price: number; qty: number; isVeteran?: boolean }[];
  createdAt: string;
};

const STATUS_LABELS: Record<string, { text: string; cls: string }> = {
  NEW: { text: "Ожидает оплаты", cls: "bg-amber-100 text-amber-700" },
  CONFIRMED: { text: "Оплачен", cls: "bg-green-100 text-green-700" },
  AUTHORIZED: { text: "Оплачен", cls: "bg-green-100 text-green-700" },
  REFUNDED: { text: "Возвращён", cls: "bg-gray-200 text-gray-700" },
  PARTIAL_REFUNDED: { text: "Частичный возврат", cls: "bg-gray-200 text-gray-700" },
  REJECTED: { text: "Отклонён", cls: "bg-red-100 text-red-700" },
  CANCELED: { text: "Отменён", cls: "bg-red-100 text-red-700" },
  DEADLINE_EXPIRED: { text: "Истёк срок", cls: "bg-red-100 text-red-700" },
};

function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(TBANK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Password": ADMIN_PASSWORD },
        body: JSON.stringify({ action: "orders" }),
      });
      const data = await res.json();
      if (data.success) setOrders(data.orders || []);
    } catch (e) {
      console.warn("orders load failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const refund = async (o: Order) => {
    if (!confirm(`Оформить возврат ${o.amount.toLocaleString("ru")} ₽ покупателю? Деньги вернутся на счёт, с которого была оплата.`)) return;
    setBusyId(o.paymentId);
    try {
      const res = await fetch(TBANK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Password": ADMIN_PASSWORD },
        body: JSON.stringify({ action: "refund", paymentId: o.paymentId }),
      });
      const data = await res.json();
      if (data.success) {
        alert("✓ " + (data.message || "Возврат оформлен"));
        await load();
      } else {
        alert("⚠ " + (data.error || "Не удалось оформить возврат"));
      }
    } catch {
      alert("⚠ Ошибка сети при возврате");
    } finally {
      setBusyId("");
    }
  };

  if (loading) {
    return <div className="bg-white rounded-2xl border border-border p-6 text-sm text-muted-foreground">Загрузка заказов…</div>;
  }

  return (
    <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-black text-lg">Журнал заказов</h2>
        <button onClick={load} className="text-sm font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border hover:bg-secondary transition-colors">
          <Icon name="RefreshCw" size={14} /> Обновить
        </button>
      </div>

      {orders.length === 0 && (
        <div className="text-sm text-muted-foreground py-8 text-center">Пока нет ни одного заказа.</div>
      )}

      <div className="space-y-3">
        {orders.map((o) => {
          const st = STATUS_LABELS[o.status] || { text: o.status, cls: "bg-gray-100 text-gray-600" };
          const isPaid = o.status === "CONFIRMED" || o.status === "AUTHORIZED";
          const dt = o.createdAt ? new Date(o.createdAt) : null;
          return (
            <div key={o.paymentId || o.orderId} className="border border-border rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black">{o.amount.toLocaleString("ru")} ₽</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${st.cls}`}>{st.text}</span>
                    <span className="text-xs text-muted-foreground">{o.method === "sbp" ? "СБП" : "Карта"}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Платёж №{o.paymentId} {dt && `· ${dt.toLocaleString("ru")}`}
                  </div>
                  <div className="text-xs text-foreground mt-1 truncate max-w-md">
                    {o.items.map((i) => `${i.name}×${i.qty}`).join(", ")}
                  </div>
                </div>
                {isPaid && (
                  <button
                    onClick={() => refund(o)}
                    disabled={busyId === o.paymentId}
                    className="bear-btn bg-red-500 hover:bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-xl disabled:opacity-60 whitespace-nowrap"
                  >
                    {busyId === o.paymentId ? "Возврат…" : "Вернуть деньги"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TextsTab({ settings, updateTexts }: { settings: SiteSettings; updateTexts: (p: Partial<PageTexts>, pwd: string) => Promise<void> }) {
  const t = settings.texts;
  const groups: { title: string; fields: { key: keyof PageTexts; label: string; multiline?: boolean }[] }[] = [
    {
      title: "Главная страница (Hero)",
      fields: [
        { key: "heroBadge", label: "Бейдж (вверху)" },
        { key: "heroTitle", label: "Заголовок" },
        { key: "heroSubtitle", label: "Подзаголовок" },
        { key: "heroDescription", label: "Описание", multiline: true },
      ],
    },
    {
      title: "Баннер «Ветеранам СВО»",
      fields: [
        { key: "veteransBannerTitle", label: "Заголовок" },
        { key: "veteransBannerText", label: "Описание", multiline: true },
      ],
    },
    {
      title: "Услуги (промо)",
      fields: [
        { key: "servicesPromoTitle", label: "Заголовок" },
        { key: "servicesPromoText", label: "Описание", multiline: true },
      ],
    },
    {
      title: "Заголовки страниц",
      fields: [
        { key: "catalogTitle", label: "Каталог" },
        { key: "servicesTitle", label: "Услуги" },
        { key: "veteransTitle", label: "Ветеранам" },
        { key: "deliveryTitle", label: "Доставка" },
        { key: "contactsTitle", label: "Контакты" },
        { key: "contactsFormTitle", label: "Контакты — форма" },
        { key: "tasksTitle", label: "Задачи (страница инженеров)" },
      ],
    },
    {
      title: "Подвал сайта",
      fields: [{ key: "footerText", label: "Текст подвала", multiline: true }],
    },
  ];

  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <div key={g.title} className="bg-white rounded-2xl border border-border p-6 space-y-3">
          <h2 className="font-black text-lg">{g.title}</h2>
          {g.fields.map((f) => (
            <Field
              key={f.key}
              label={f.label}
              value={t[f.key]}
              onChange={(v) => updateTexts({ [f.key]: v } as Partial<PageTexts>, ADMIN_PASSWORD)}
              multiline={f.multiline}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

const PAGE_OPTIONS = [
  { value: "home", label: "Главная" },
  { value: "catalog", label: "Каталог" },
  { value: "services", label: "Услуги" },
  { value: "tasks", label: "Задачи" },
  { value: "veterans", label: "Ветеранам" },
  { value: "delivery", label: "Доставка" },
  { value: "contacts", label: "Контакты" },
];

function MenuTab({ menu, setMenu }: { menu: MenuItem[]; setMenu: (m: MenuItem[], pwd: string) => Promise<void> }) {
  const [local, setLocal] = useState<MenuItem[]>(menu);
  useEffect(() => setLocal(menu), [menu]);

  const save = (next: MenuItem[]) => { setLocal(next); setMenu(next, ADMIN_PASSWORD); };
  const update = (i: number, patch: Partial<MenuItem>) => save(local.map((m, idx) => idx === i ? { ...m, ...patch } : m));
  const remove = (i: number) => { if (confirm("Удалить раздел из меню?")) save(local.filter((_, idx) => idx !== i)); };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= local.length) return;
    const next = [...local];
    [next[i], next[j]] = [next[j], next[i]];
    save(next);
  };
  const add = () => save([...local, { id: `item_${Date.now()}`, label: "Новый раздел", page: "home" }]);

  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-black text-lg">Разделы меню (шапка)</h2>
        <button onClick={add} className="bear-btn bg-primary text-primary-foreground font-bold px-3 py-2 rounded-xl flex items-center gap-1 text-sm">
          <Icon name="Plus" size={16} /> Добавить
        </button>
      </div>
      <div className="space-y-2">
        {local.map((m, i) => (
          <div key={m.id} className="flex items-center gap-2 border border-border rounded-xl p-3 bg-slate-50">
            <div className="flex flex-col gap-1">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1 disabled:opacity-30 hover:bg-white rounded">
                <Icon name="ChevronUp" size={14} />
              </button>
              <button onClick={() => move(i, 1)} disabled={i === local.length - 1} className="p-1 disabled:opacity-30 hover:bg-white rounded">
                <Icon name="ChevronDown" size={14} />
              </button>
            </div>
            <input className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-white" value={m.label} onChange={(e) => update(i, { label: e.target.value })} />
            <select className="border border-border rounded-lg px-2 py-2 text-sm bg-white" value={m.page} onChange={(e) => update(i, { page: e.target.value })}>
              {PAGE_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <button onClick={() => remove(i)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
              <Icon name="Trash2" size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const ICON_OPTIONS = ["Phone", "Mail", "MapPin", "Clock", "MessageCircle", "Send", "Globe", "Building", "User"];

function ContactsTab({ contacts, setContacts }: { contacts: ContactItem[]; setContacts: (c: ContactItem[], pwd: string) => Promise<void> }) {
  const [local, setLocal] = useState<ContactItem[]>(contacts);
  useEffect(() => setLocal(contacts), [contacts]);

  const save = (next: ContactItem[]) => { setLocal(next); setContacts(next, ADMIN_PASSWORD); };
  const update = (i: number, patch: Partial<ContactItem>) => save(local.map((c, idx) => idx === i ? { ...c, ...patch } : c));
  const remove = (i: number) => { if (confirm("Удалить контакт?")) save(local.filter((_, idx) => idx !== i)); };
  const add = () => save([...local, { icon: "Phone", label: "Новый контакт", value: "", sub: "" }]);

  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-black text-lg">Контактные данные</h2>
        <button onClick={add} className="bear-btn bg-primary text-primary-foreground font-bold px-3 py-2 rounded-xl flex items-center gap-1 text-sm">
          <Icon name="Plus" size={16} /> Добавить
        </button>
      </div>
      <div className="space-y-4">
        {local.map((c, i) => (
          <div key={i} className="border border-border rounded-xl p-4 bg-slate-50 grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Иконка</label>
              <select className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white" value={c.icon} onChange={(e) => update(i, { icon: e.target.value })}>
                {ICON_OPTIONS.map((ic) => <option key={ic}>{ic}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Подпись</label>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white" value={c.label} onChange={(e) => update(i, { label: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Значение</label>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white" value={c.value} onChange={(e) => update(i, { value: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Уточнение</label>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white" value={c.sub} onChange={(e) => update(i, { sub: e.target.value })} />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <button onClick={() => remove(i)} className="text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1">
                <Icon name="Trash2" size={14} /> Удалить
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductsTab({ products, setProducts }: Props) {
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Omit<Product, "id">>(EMPTY);
  const [showForm, setShowForm] = useState(false);

  const openNew = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (p: Product) => { setEditing(p); setForm({ name: p.name, price: p.price, oldPrice: p.oldPrice, image: p.image, category: p.category, isVeteran: p.isVeteran, description: p.description, badge: p.badge, outOfStock: p.outOfStock }); setShowForm(true); };

  const saveProduct = () => {
    if (!form.name.trim()) return alert("Введите название товара");
    if (editing) setProducts(products.map((p) => p.id === editing.id ? { ...form, id: editing.id } : p));
    else {
      const newId = Math.max(0, ...products.map((p) => p.id)) + 1;
      setProducts([...products, { ...form, id: newId }]);
    }
    setShowForm(false);
  };
  const deleteProduct = (id: number) => { if (confirm("Удалить товар?")) setProducts(products.filter((p) => p.id !== id)); };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={openNew} className="bear-btn bg-primary text-primary-foreground font-bold px-4 py-2.5 rounded-xl flex items-center gap-2">
          <Icon name="Plus" size={18} /> Добавить товар
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-black mb-5">{editing ? "Редактировать товар" : "Новый товар"}</h2>
            <div className="space-y-3">
              <Field label="Название" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Цена (₽)</label>
                  <input type="number" className="w-full border border-border rounded-xl px-3 py-2 text-sm" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Старая цена</label>
                  <input type="number" className="w-full border border-border rounded-xl px-3 py-2 text-sm" value={form.oldPrice ?? ""} onChange={(e) => setForm({ ...form, oldPrice: e.target.value ? +e.target.value : undefined })} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Категория</label>
                <select className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-white" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value, isVeteran: e.target.value === "Ветеранам" })}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <Field label="URL изображения" value={form.image} onChange={(v) => setForm({ ...form, image: v })} />
              <Field label="Описание" value={form.description} onChange={(v) => setForm({ ...form, description: v })} multiline />
              <Field label="Бейдж" value={form.badge ?? ""} onChange={(v) => setForm({ ...form, badge: v })} />
              <label className={`flex items-center gap-3 border rounded-xl px-3 py-2.5 cursor-pointer ${form.outOfStock ? "border-amber-400 bg-amber-50" : "border-border"}`}>
                <input type="checkbox" className="w-4 h-4 accent-amber-500" checked={!!form.outOfStock} onChange={(e) => setForm({ ...form, outOfStock: e.target.checked })} />
                <div>
                  <div className="text-sm font-semibold">Нет в наличии (заморозить покупку)</div>
                  <div className="text-xs text-muted-foreground">Клиенты не смогут добавить товар в корзину</div>
                </div>
              </label>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={saveProduct} className="bear-btn flex-1 bg-primary text-primary-foreground font-bold py-2.5 rounded-xl">{editing ? "Сохранить" : "Добавить"}</button>
              <button onClick={() => setShowForm(false)} className="flex-1 border border-border py-2.5 rounded-xl font-semibold text-sm hover:bg-secondary">Отмена</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Товар</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Категория</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Цена</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Действия</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          {p.name}
                          {p.outOfStock && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Нет в наличии</span>}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-1">{p.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{p.category}</td>
                  <td className="px-4 py-3 font-bold">{p.price === 0 ? "Бесплатно" : `${p.price} ₽`}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setProducts(products.map((x) => x.id === p.id ? { ...x, outOfStock: !x.outOfStock } : x))}
                      className={`p-2 rounded-lg mr-1 ${p.outOfStock ? "text-amber-600 hover:bg-amber-50" : "text-green-600 hover:bg-green-50"}`}
                      title={p.outOfStock ? "Вернуть в продажу" : "Заморозить покупку"}
                    >
                      <Icon name={p.outOfStock ? "Snowflake" : "Check"} fallback="Circle" size={16} />
                    </button>
                    <button onClick={() => openEdit(p)} className="text-primary hover:bg-blue-50 p-2 rounded-lg mr-1"><Icon name="Pencil" size={16} /></button>
                    <button onClick={() => deleteProduct(p.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg"><Icon name="Trash2" size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

type EngineerRow = { id: number; name: string; login: string; phone?: string; specialty?: string; active: boolean; created_at?: string };

function EngineersTab() {
  const [list, setList] = useState<EngineerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EngineerRow | null>(null);
  const [form, setForm] = useState({ name: "", login: "", password: "", phone: "", specialty: "" });
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(ENGINEERS_URL, { headers: { "X-Admin-Password": ADMIN_PASSWORD } });
      const data = await res.json();
      setList(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm({ name: "", login: "", password: "", phone: "", specialty: "" }); setShowForm(true); };
  const openEdit = (e: EngineerRow) => { setEditing(e); setForm({ name: e.name, login: e.login, password: "", phone: e.phone || "", specialty: e.specialty || "" }); setShowForm(true); };

  const save = async () => {
    if (!form.name || !form.login || (!editing && !form.password)) return alert("Заполните имя, логин, пароль");
    const body: Record<string, unknown> = editing
      ? { action: "update", id: editing.id, name: form.name, login: form.login, phone: form.phone, specialty: form.specialty, ...(form.password ? { password: form.password } : {}) }
      : { action: "create", ...form };
    await fetch(ENGINEERS_URL, { method: "POST", headers: { "Content-Type": "application/json", "X-Admin-Password": ADMIN_PASSWORD }, body: JSON.stringify(body) });
    setShowForm(false);
    load();
  };

  const toggle = async (e: EngineerRow) => {
    await fetch(ENGINEERS_URL, { method: "POST", headers: { "Content-Type": "application/json", "X-Admin-Password": ADMIN_PASSWORD }, body: JSON.stringify({ action: "update", id: e.id, active: !e.active }) });
    load();
  };

  const remove = async (e: EngineerRow) => {
    if (!confirm(`Деактивировать инженера ${e.name}?`)) return;
    await fetch(ENGINEERS_URL, { method: "POST", headers: { "Content-Type": "application/json", "X-Admin-Password": ADMIN_PASSWORD }, body: JSON.stringify({ action: "delete", id: e.id }) });
    load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="font-black text-lg">Партнёры-инженеры</h2>
          <p className="text-xs text-muted-foreground">Учётки для входа на странице «Задачи»</p>
        </div>
        <button onClick={openNew} className="bear-btn bg-primary text-primary-foreground font-bold px-4 py-2.5 rounded-xl flex items-center gap-2">
          <Icon name="Plus" size={18} /> Добавить инженера
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="font-black text-lg mb-4">{editing ? "Редактировать инженера" : "Новый инженер"}</h2>
            <div className="space-y-3">
              <Field label="ФИО" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <Field label="Логин" value={form.login} onChange={(v) => setForm({ ...form, login: v })} />
              <Field label={editing ? "Новый пароль (оставьте пустым)" : "Пароль"} value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
              <Field label="Телефон" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              <Field label="Специализация" value={form.specialty} onChange={(v) => setForm({ ...form, specialty: v })} placeholder="Ремонт ПК, сети..." />
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={save} className="bear-btn flex-1 bg-primary text-primary-foreground font-bold py-2.5 rounded-xl">{editing ? "Сохранить" : "Создать"}</button>
              <button onClick={() => setShowForm(false)} className="flex-1 border border-border py-2.5 rounded-xl font-semibold text-sm hover:bg-secondary">Отмена</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
        ) : list.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Инженеров пока нет</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Инженер</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Логин</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Телефон</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Статус</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Действия</th>
              </tr>
            </thead>
            <tbody>
              {list.map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{e.name}</div>
                    <div className="text-xs text-muted-foreground">{e.specialty}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{e.login}</td>
                  <td className="px-4 py-3">{e.phone || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded ${e.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {e.active ? "Активен" : "Отключён"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => toggle(e)} className="p-2 hover:bg-secondary rounded-lg mr-1" title={e.active ? "Отключить" : "Включить"}>
                      <Icon name={e.active ? "PowerOff" : "Power"} fallback="Circle" size={16} />
                    </button>
                    <button onClick={() => openEdit(e)} className="p-2 text-primary hover:bg-blue-50 rounded-lg mr-1"><Icon name="Pencil" size={16} /></button>
                    <button onClick={() => remove(e)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Icon name="Trash2" size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function TasksTab() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [engineers, setEngineers] = useState<EngineerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState({ title: "", description: "", customer: "", address: "", price: 0, deadline: "", engineer_id: "" });
  const [showForm, setShowForm] = useState(false);
  const [rejectFor, setRejectFor] = useState<Task | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [tRes, eRes] = await Promise.all([
        fetch(TASKS_URL),
        fetch(ENGINEERS_URL, { headers: { "X-Admin-Password": ADMIN_PASSWORD } }),
      ]);
      const tData = await tRes.json();
      const eData = await eRes.json();
      setTasks(Array.isArray(tData) ? tData : []);
      setEngineers(Array.isArray(eData) ? eData : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm({ title: "", description: "", customer: "", address: "", price: 0, deadline: "", engineer_id: "" }); setShowForm(true); };
  const openEdit = (t: Task) => {
    setEditing(t);
    setForm({
      title: t.title,
      description: t.description || "",
      customer: t.customer || "",
      address: t.address || "",
      price: t.price || 0,
      deadline: t.deadline ? t.deadline.slice(0, 10) : "",
      engineer_id: t.engineer_id ? String(t.engineer_id) : "",
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.title.trim()) return alert("Введите название задачи");
    const body: Record<string, unknown> = {
      action: editing ? "update" : "create",
      ...(editing ? { id: editing.id } : {}),
      title: form.title,
      description: form.description,
      customer: form.customer,
      address: form.address,
      price: Number(form.price) || 0,
      deadline: form.deadline || null,
      engineer_id: form.engineer_id ? Number(form.engineer_id) : null,
    };
    await fetch(TASKS_URL, { method: "POST", headers: { "Content-Type": "application/json", "X-Admin-Password": ADMIN_PASSWORD }, body: JSON.stringify(body) });
    setShowForm(false);
    load();
  };

  const accept = async (t: Task) => {
    await fetch(TASKS_URL, { method: "POST", headers: { "Content-Type": "application/json", "X-Admin-Password": ADMIN_PASSWORD }, body: JSON.stringify({ action: "accept", id: t.id }) });
    load();
  };

  const reject = async () => {
    if (!rejectFor) return;
    await fetch(TASKS_URL, { method: "POST", headers: { "Content-Type": "application/json", "X-Admin-Password": ADMIN_PASSWORD }, body: JSON.stringify({ action: "reject", id: rejectFor.id, reason: rejectReason }) });
    setRejectFor(null);
    setRejectReason("");
    load();
  };

  const archive = async (t: Task) => {
    if (!confirm("Архивировать задачу?")) return;
    await fetch(TASKS_URL, { method: "POST", headers: { "Content-Type": "application/json", "X-Admin-Password": ADMIN_PASSWORD }, body: JSON.stringify({ action: "delete", id: t.id }) });
    load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="font-black text-lg">Задачи</h2>
          <p className="text-xs text-muted-foreground">Создание, назначение, приёмка работ</p>
        </div>
        <button onClick={openNew} className="bear-btn bg-primary text-primary-foreground font-bold px-4 py-2.5 rounded-xl flex items-center gap-2">
          <Icon name="Plus" size={18} /> Новая задача
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-black text-lg mb-4">{editing ? "Редактировать задачу" : "Новая задача"}</h2>
            <div className="space-y-3">
              <Field label="Название задачи" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
              <Field label="Описание" value={form.description} onChange={(v) => setForm({ ...form, description: v })} multiline />
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Заказчик" value={form.customer} onChange={(v) => setForm({ ...form, customer: v })} />
                <Field label="Адрес" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Стоимость (₽)</label>
                  <input type="number" className="w-full border border-border rounded-xl px-3 py-2 text-sm" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Срок</label>
                  <input type="date" className="w-full border border-border rounded-xl px-3 py-2 text-sm" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Назначить инженера</label>
                <select className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-white" value={form.engineer_id} onChange={(e) => setForm({ ...form, engineer_id: e.target.value })}>
                  <option value="">— не назначен (открытая) —</option>
                  {engineers.filter((e) => e.active).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={save} className="bear-btn flex-1 bg-primary text-primary-foreground font-bold py-2.5 rounded-xl">{editing ? "Сохранить" : "Создать"}</button>
              <button onClick={() => setShowForm(false)} className="flex-1 border border-border py-2.5 rounded-xl font-semibold text-sm hover:bg-secondary">Отмена</button>
            </div>
          </div>
        </div>
      )}

      {rejectFor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="font-black text-lg mb-1">Отклонить отчёт</h2>
            <div className="text-sm text-muted-foreground mb-3">«{rejectFor.title}»</div>
            <textarea rows={4} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Что нужно доработать..." className="w-full border border-border rounded-xl px-3 py-2 text-sm resize-none" />
            <div className="flex gap-2 mt-4">
              <button onClick={reject} className="bear-btn flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl">Отклонить</button>
              <button onClick={() => { setRejectFor(null); setRejectReason(""); }} className="flex-1 border border-border py-2.5 rounded-xl text-sm font-semibold hover:bg-secondary">Отмена</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 bg-white border border-border rounded-2xl text-muted-foreground">Задач пока нет</div>
      ) : (
        <div className="space-y-3">
          {tasks.map((t) => (
            <div key={t.id} className="bg-white border border-border rounded-2xl p-4">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100">{t.status}</span>
                    {t.engineer_name && <span className="text-xs text-muted-foreground">→ {t.engineer_name}</span>}
                    {t.price > 0 && <span className="text-xs font-bold text-green-700">{t.price.toLocaleString("ru-RU")} ₽</span>}
                  </div>
                  <div className="font-bold">{t.title}</div>
                  {t.description && <div className="text-xs text-muted-foreground line-clamp-2">{t.description}</div>}
                  {t.engineer_report && (
                    <div className="mt-2 bg-violet-50 border border-violet-200 rounded-xl p-2 text-xs">
                      <div className="font-bold text-violet-800 mb-1">Отчёт инженера:</div>
                      <div className="text-violet-900 whitespace-pre-wrap">{t.engineer_report}</div>
                    </div>
                  )}
                </div>
                <div className="flex gap-1 flex-wrap">
                  {t.status === "reported" && (
                    <>
                      <button onClick={() => accept(t)} className="bear-btn bg-green-600 text-white font-bold px-3 py-2 rounded-lg text-xs flex items-center gap-1">
                        <Icon name="Check" size={14} /> Принять
                      </button>
                      <button onClick={() => setRejectFor(t)} className="bear-btn bg-red-600 text-white font-bold px-3 py-2 rounded-lg text-xs flex items-center gap-1">
                        <Icon name="X" size={14} /> Отклонить
                      </button>
                    </>
                  )}
                  <button onClick={() => openEdit(t)} className="p-2 text-primary hover:bg-blue-50 rounded-lg"><Icon name="Pencil" size={16} /></button>
                  <button onClick={() => archive(t)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Icon name="Trash2" size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, multiline, placeholder }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground mb-1 block">{label}</label>
      {multiline ? (
        <textarea rows={3} className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}