import { useState } from "react";
import Icon from "@/components/ui/icon";
import type { Product } from "@/App";
import { useSiteSettings, type MenuItem, type ContactItem } from "@/contexts/SiteSettingsContext";

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
};

const CATEGORIES = ["Биотехнологии", "Нутрицевтика", "Детокс", "Компьютеры", "Одежда и обувь", "Услуги", "Ветеранам"];

type Tab = "site" | "texts" | "menu" | "contacts" | "products";

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
            onKeyDown={(e) => e.key === "Enter" && password === "567765" && setAuth(true)}
            className="w-full border border-border rounded-xl px-4 py-2.5 mb-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={() => password === "567765" ? setAuth(true) : alert("Неверный пароль")}
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
            onClick={() => { if (confirm("Сбросить ВСЕ настройки сайта к исходным?")) resetToDefault(); }}
            className="px-4 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-secondary transition-colors"
            title="Сбросить настройки"
          >
            <Icon name="RotateCcw" size={16} className="inline mr-1" />
            Сброс
          </button>
          <button onClick={() => setAuth(false)} className="px-4 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-secondary transition-colors">
            Выйти
          </button>
        </div>
      </div>

      {/* Tabs */}
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

      {tab === "site" && (
        <SiteTab
          settings={settings}
          updateSettings={updateSettings}
        />
      )}
      {tab === "texts" && (
        <TextsTab settings={settings} updateTexts={updateTexts} />
      )}
      {tab === "menu" && (
        <MenuTab menu={settings.menu} setMenu={setMenu} />
      )}
      {tab === "contacts" && (
        <ContactsTab contacts={settings.contacts} setContacts={setContacts} />
      )}
      {tab === "products" && (
        <ProductsTab products={products} setProducts={setProducts} />
      )}
    </div>
  );
}

/* ----- SITE TAB ----- */
function SiteTab({ settings, updateSettings }: { settings: ReturnType<typeof useSiteSettings>["settings"]; updateSettings: (p: Partial<ReturnType<typeof useSiteSettings>["settings"]>) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
      <h2 className="font-black text-lg mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>Название сайта</h2>
      <Field label="Название (в шапке)" value={settings.siteName} onChange={(v) => updateSettings({ siteName: v })} />
      <Field label="Подзаголовок (под названием)" value={settings.siteSubtitle} onChange={(v) => updateSettings({ siteSubtitle: v })} />
      <Field label="Полное название компании" value={settings.siteFullName} onChange={(v) => updateSettings({ siteFullName: v })} />
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900">
        Изменения применяются сразу. Видны во всех браузерах после публикации сайта.
      </div>
    </div>
  );
}

/* ----- TEXTS TAB ----- */
function TextsTab({ settings, updateTexts }: { settings: ReturnType<typeof useSiteSettings>["settings"]; updateTexts: (p: Partial<ReturnType<typeof useSiteSettings>["settings"]["texts"]>) => void }) {
  const t = settings.texts;
  const groups: { title: string; fields: { key: keyof typeof t; label: string; multiline?: boolean }[] }[] = [
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
      title: "Услуги (промо-блок)",
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
        { key: "contactsFormTitle", label: "Контакты — заголовок формы" },
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
          <h2 className="font-black text-lg" style={{ fontFamily: "Montserrat, sans-serif" }}>{g.title}</h2>
          {g.fields.map((f) => (
            <Field
              key={f.key}
              label={f.label}
              value={t[f.key]}
              onChange={(v) => updateTexts({ [f.key]: v } as Partial<typeof t>)}
              multiline={f.multiline}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ----- MENU TAB ----- */
const PAGE_OPTIONS = [
  { value: "home", label: "Главная" },
  { value: "catalog", label: "Каталог" },
  { value: "services", label: "Услуги" },
  { value: "veterans", label: "Ветеранам" },
  { value: "delivery", label: "Доставка" },
  { value: "contacts", label: "Контакты" },
];

function MenuTab({ menu, setMenu }: { menu: MenuItem[]; setMenu: (m: MenuItem[]) => void }) {
  const update = (i: number, patch: Partial<MenuItem>) => {
    setMenu(menu.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  };
  const remove = (i: number) => {
    if (confirm("Удалить раздел из меню?")) setMenu(menu.filter((_, idx) => idx !== i));
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= menu.length) return;
    const next = [...menu];
    [next[i], next[j]] = [next[j], next[i]];
    setMenu(next);
  };
  const add = () => {
    const id = `item_${Date.now()}`;
    setMenu([...menu, { id, label: "Новый раздел", page: "home" }]);
  };

  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-black text-lg" style={{ fontFamily: "Montserrat, sans-serif" }}>Разделы меню (шапка)</h2>
        <button onClick={add} className="bear-btn bg-primary text-primary-foreground font-bold px-3 py-2 rounded-xl flex items-center gap-1 text-sm">
          <Icon name="Plus" size={16} /> Добавить
        </button>
      </div>
      <div className="space-y-2">
        {menu.map((m, i) => (
          <div key={m.id} className="flex items-center gap-2 border border-border rounded-xl p-3 bg-slate-50">
            <div className="flex flex-col gap-1">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1 disabled:opacity-30 hover:bg-white rounded">
                <Icon name="ChevronUp" size={14} />
              </button>
              <button onClick={() => move(i, 1)} disabled={i === menu.length - 1} className="p-1 disabled:opacity-30 hover:bg-white rounded">
                <Icon name="ChevronDown" size={14} />
              </button>
            </div>
            <input
              className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-primary/30"
              value={m.label}
              onChange={(e) => update(i, { label: e.target.value })}
              placeholder="Название пункта"
            />
            <select
              className="border border-border rounded-lg px-2 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-primary/30"
              value={m.page}
              onChange={(e) => update(i, { page: e.target.value })}
            >
              {PAGE_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <button onClick={() => remove(i)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
              <Icon name="Trash2" size={16} />
            </button>
          </div>
        ))}
        {menu.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-6">Меню пустое. Нажмите «Добавить».</div>
        )}
      </div>
    </div>
  );
}

/* ----- CONTACTS TAB ----- */
const ICON_OPTIONS = ["Phone", "Mail", "MapPin", "Clock", "MessageCircle", "Send", "Globe", "Building", "User"];

function ContactsTab({ contacts, setContacts }: { contacts: ContactItem[]; setContacts: (c: ContactItem[]) => void }) {
  const update = (i: number, patch: Partial<ContactItem>) => {
    setContacts(contacts.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  };
  const remove = (i: number) => {
    if (confirm("Удалить контакт?")) setContacts(contacts.filter((_, idx) => idx !== i));
  };
  const add = () => {
    setContacts([...contacts, { icon: "Phone", label: "Новый контакт", value: "", sub: "" }]);
  };

  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-black text-lg" style={{ fontFamily: "Montserrat, sans-serif" }}>Контактные данные</h2>
        <button onClick={add} className="bear-btn bg-primary text-primary-foreground font-bold px-3 py-2 rounded-xl flex items-center gap-1 text-sm">
          <Icon name="Plus" size={16} /> Добавить
        </button>
      </div>
      <div className="space-y-4">
        {contacts.map((c, i) => (
          <div key={i} className="border border-border rounded-xl p-4 bg-slate-50 grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Иконка</label>
              <select
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white"
                value={c.icon}
                onChange={(e) => update(i, { icon: e.target.value })}
              >
                {ICON_OPTIONS.map((ic) => <option key={ic}>{ic}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Подпись (Телефон, Email...)</label>
              <input
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white"
                value={c.label}
                onChange={(e) => update(i, { label: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Значение</label>
              <input
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white"
                value={c.value}
                onChange={(e) => update(i, { value: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Уточнение</label>
              <input
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white"
                value={c.sub}
                onChange={(e) => update(i, { sub: e.target.value })}
              />
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

/* ----- PRODUCTS TAB (старая логика) ----- */
function ProductsTab({ products, setProducts }: Props) {
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Omit<Product, "id">>(EMPTY);
  const [showForm, setShowForm] = useState(false);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, price: p.price, oldPrice: p.oldPrice, image: p.image, category: p.category, isVeteran: p.isVeteran, description: p.description, badge: p.badge });
    setShowForm(true);
  };

  const saveProduct = () => {
    if (!form.name.trim()) return alert("Введите название товара");
    if (editing) {
      setProducts(products.map((p) => p.id === editing.id ? { ...form, id: editing.id } : p));
    } else {
      const newId = Math.max(0, ...products.map((p) => p.id)) + 1;
      setProducts([...products, { ...form, id: newId }]);
    }
    setShowForm(false);
  };

  const deleteProduct = (id: number) => {
    if (confirm("Удалить товар?")) setProducts(products.filter((p) => p.id !== id));
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={openNew} className="bear-btn bg-primary text-primary-foreground font-bold px-4 py-2.5 rounded-xl flex items-center gap-2">
          <Icon name="Plus" size={18} /> Добавить товар
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-black mb-5" style={{ fontFamily: "Montserrat, sans-serif" }}>
              {editing ? "Редактировать товар" : "Новый товар"}
            </h2>
            <div className="space-y-3">
              <Field label="Название" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Цена (₽)</label>
                  <input type="number" className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Старая цена (₽)</label>
                  <input type="number" className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" value={form.oldPrice ?? ""} onChange={(e) => setForm({ ...form, oldPrice: e.target.value ? +e.target.value : undefined })} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Категория</label>
                <select className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 bg-white" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value, isVeteran: e.target.value === "Ветеранам" })}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <Field label="URL изображения" value={form.image} onChange={(v) => setForm({ ...form, image: v })} placeholder="https://..." />
              <Field label="Описание" value={form.description} onChange={(v) => setForm({ ...form, description: v })} multiline />
              <Field label="Бейдж (необязательно)" value={form.badge ?? ""} onChange={(v) => setForm({ ...form, badge: v })} placeholder="Хит / −20% / Новинка" />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={saveProduct} className="bear-btn flex-1 bg-primary text-primary-foreground font-bold py-2.5 rounded-xl">
                {editing ? "Сохранить" : "Добавить"}
              </button>
              <button onClick={() => setShowForm(false)} className="flex-1 border border-border py-2.5 rounded-xl font-semibold text-sm hover:bg-secondary transition-colors">
                Отмена
              </button>
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
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">{p.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{p.category}</td>
                  <td className="px-4 py-3 font-bold">{p.price === 0 ? "Бесплатно" : `${p.price} ₽`}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(p)} className="text-primary hover:bg-blue-50 p-2 rounded-lg mr-1" title="Изменить">
                      <Icon name="Pencil" size={16} />
                    </button>
                    <button onClick={() => deleteProduct(p.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg" title="Удалить">
                      <Icon name="Trash2" size={16} />
                    </button>
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

/* ----- helper ----- */
function Field({ label, value, onChange, multiline, placeholder }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground mb-1 block">{label}</label>
      {multiline ? (
        <textarea
          rows={3}
          className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
