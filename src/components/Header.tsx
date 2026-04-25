import { useState } from "react";
import Icon from "@/components/ui/icon";
import type { Page } from "@/App";

type HeaderProps = {
  page: Page;
  setPage: (p: Page) => void;
  cartCount: number;
};

const NAV = [
  { id: "home", label: "Главная" },
  { id: "catalog", label: "Каталог" },
  { id: "services", label: "Услуги" },
  { id: "veterans", label: "Ветеранам СВО" },
  { id: "delivery", label: "Доставка и оплата" },
  { id: "contacts", label: "Контакты" },
] as const;

export default function Header({ page, setPage, cartCount }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => setPage("home")}
            className="flex items-center gap-2 group"
          >
            <div className="w-9 h-9 rounded-xl hero-gradient flex items-center justify-center text-white font-black text-sm">
              🐻
            </div>
            <div className="hidden sm:block">
              <div className="font-black text-sm leading-tight text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
                МТМ Маркет Мишка
              </div>
              <div className="text-xs text-muted-foreground leading-tight">Услуги профессионалов</div>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => setPage(n.id as Page)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  page === n.id
                    ? "bg-primary text-primary-foreground"
                    : n.id === "veterans"
                    ? "text-red-700 hover:bg-red-50 font-semibold"
                    : "text-foreground hover:bg-secondary"
                }`}
              >
                {n.id === "veterans" && "🎖️ "}
                {n.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage("cart")}
              className="relative flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-xl text-sm font-semibold bear-btn"
            >
              <Icon name="ShoppingCart" size={18} />
              <span className="hidden sm:inline">Корзина</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setPage("admin")}
              className="p-2 rounded-xl hover:bg-secondary transition-colors"
              title="Админ-панель"
            >
              <Icon name="Settings" size={20} className="text-muted-foreground" />
            </button>

            <button
              className="md:hidden p-2 rounded-xl hover:bg-secondary transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Icon name={menuOpen ? "X" : "Menu"} size={20} />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-3 pt-1 border-t border-border animate-fade-in">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => { setPage(n.id as Page); setMenuOpen(false); }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                  page === n.id ? "bg-primary text-primary-foreground" :
                  n.id === "veterans" ? "text-red-700 font-semibold" : "hover:bg-secondary"
                }`}
              >
                {n.id === "veterans" && "🎖️ "}
                {n.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}