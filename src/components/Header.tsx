import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import type { Page } from "@/App";

type HeaderProps = {
  page: Page;
  setPage: (p: Page) => void;
  cartCount: number;
};

const GAMES: Array<{ id: Page; label: string; desc: string }> = [
  { id: "game",  label: "🎮 Игра",         desc: "Мини-игра" },
  { id: "game2", label: "🌌 Эпоха Звёзд",  desc: "Стратегия" },
];

const GAME_IDS = GAMES.map(g => g.id);

const NAV = [
  { id: "home",     label: "Главная" },
  { id: "catalog",  label: "Каталог" },
  { id: "services", label: "Услуги" },
  { id: "veterans", label: "Ветеранам СВО" },
  { id: "delivery", label: "Доставка и оплата" },
  { id: "contacts", label: "Контакты" },
] as const;

export default function Header({ page, setPage, cartCount }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [gamesOpen, setGamesOpen] = useState(false);
  const [mobileGamesOpen, setMobileGamesOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const isGameActive = GAME_IDS.includes(page as Page);

  // Закрывать dropdown при клике вне
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setGamesOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button onClick={() => setPage("home")} className="flex items-center gap-2 group">
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

          {/* Desktop nav */}
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

            {/* Раздел Игры — dropdown */}
            <div className="relative" ref={dropRef}>
              <button
                onClick={() => setGamesOpen(o => !o)}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isGameActive
                    ? "bg-green-600 text-white"
                    : "text-green-700 hover:bg-green-50"
                }`}
              >
                🕹️ Игры
                <Icon name={gamesOpen ? "ChevronUp" : "ChevronDown"} size={14} />
              </button>

              {gamesOpen && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-border rounded-xl shadow-lg overflow-hidden z-50 animate-fade-in">
                  {GAMES.map(g => (
                    <button
                      key={g.id}
                      onClick={() => { setPage(g.id); setGamesOpen(false); }}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between group ${
                        page === g.id
                          ? "bg-green-50 text-green-700 font-semibold"
                          : "hover:bg-green-50 text-foreground"
                      }`}
                    >
                      <span>{g.label}</span>
                      <span className="text-xs text-muted-foreground group-hover:text-green-600">{g.desc}</span>
                    </button>
                  ))}
                  <div className="px-4 py-2 bg-green-50 border-t border-green-100">
                    <p className="text-[11px] text-green-700 font-medium">🎮 Раздел игр</p>
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Right buttons */}
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

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-3 pt-1 border-t border-border animate-fade-in">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => { setPage(n.id as Page); setMenuOpen(false); }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                  page === n.id
                    ? "bg-primary text-primary-foreground"
                    : n.id === "veterans"
                    ? "text-red-700 font-semibold"
                    : "hover:bg-secondary"
                }`}
              >
                {n.id === "veterans" && "🎖️ "}
                {n.label}
              </button>
            ))}

            {/* Игры в мобильном меню */}
            <button
              onClick={() => setMobileGamesOpen(o => !o)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors mb-0.5 flex items-center justify-between ${
                isGameActive ? "bg-green-600 text-white" : "text-green-700 hover:bg-green-50"
              }`}
            >
              <span>🕹️ Игры</span>
              <Icon name={mobileGamesOpen ? "ChevronUp" : "ChevronDown"} size={14} />
            </button>

            {mobileGamesOpen && (
              <div className="ml-3 border-l-2 border-green-200 pl-3 mb-1 space-y-0.5">
                {GAMES.map(g => (
                  <button
                    key={g.id}
                    onClick={() => { setPage(g.id); setMenuOpen(false); setMobileGamesOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      page === g.id
                        ? "bg-green-600 text-white font-semibold"
                        : "text-green-700 hover:bg-green-50"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
