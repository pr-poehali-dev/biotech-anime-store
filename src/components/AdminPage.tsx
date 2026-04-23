import { useState } from "react";
import Icon from "@/components/ui/icon";
import type { Product } from "@/App";

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

export default function AdminPage({ products, setProducts }: Props) {
  const [password, setPassword] = useState("");
  const [auth, setAuth] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Omit<Product, "id">>(EMPTY);
  const [showForm, setShowForm] = useState(false);

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
            onKeyDown={(e) => e.key === "Enter" && password === "admin123" && setAuth(true)}
            className="w-full border border-border rounded-xl px-4 py-2.5 mb-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={() => password === "admin123" ? setAuth(true) : alert("Неверный пароль")}
            className="bear-btn w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-xl"
          >
            Войти
          </button>
          <p className="text-xs text-muted-foreground text-center mt-3">Пароль по умолчанию: admin123</p>
        </div>
      </div>
    );
  }

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
    <div className="container mx-auto px-4 py-8 animate-fade-in max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black" style={{ fontFamily: "Montserrat, sans-serif" }}>Админ-панель</h1>
          <p className="text-muted-foreground text-sm">Управление товарами магазина</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openNew} className="bear-btn bg-primary text-primary-foreground font-bold px-4 py-2.5 rounded-xl flex items-center gap-2">
            <Icon name="Plus" size={18} />
            Добавить товар
          </button>
          <button onClick={() => setAuth(false)} className="px-4 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-secondary transition-colors">
            Выйти
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-black mb-5" style={{ fontFamily: "Montserrat, sans-serif" }}>
              {editing ? "Редактировать товар" : "Новый товар"}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Название</label>
                <input className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Название товара" />
              </div>
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
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">URL изображения</label>
                <input className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Описание</label>
                <textarea className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Бейдж (необязательно)</label>
                <input className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" value={form.badge ?? ""} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="Хит / −20% / Новинка" />
              </div>
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
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Бейдж</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Действия</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt={p.name} className="w-10 h-10 rounded-xl object-cover border border-border" />
                      <div>
                        <div className="font-semibold text-foreground">{p.name}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[180px]">{p.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                  <td className="px-4 py-3 font-bold text-foreground">
                    {p.isVeteran ? <span className="text-green-600">Бесплатно</span> : `${p.price.toLocaleString("ru")} ₽`}
                  </td>
                  <td className="px-4 py-3">
                    {p.badge && <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-lg">{p.badge}</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(p)} className="text-primary hover:bg-blue-50 p-2 rounded-lg transition-colors mr-1">
                      <Icon name="Pencil" size={16} />
                    </button>
                    <button onClick={() => deleteProduct(p.id)} className="text-red-400 hover:bg-red-50 p-2 rounded-lg transition-colors">
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