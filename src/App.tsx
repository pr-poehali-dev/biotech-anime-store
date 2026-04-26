import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/Header";
import HomePage from "@/components/HomePage";
import CatalogPage from "@/components/CatalogPage";
import VeteransPage from "@/components/VeteransPage";
import CartPage from "@/components/CartPage";
import AdminPage from "@/components/AdminPage";
import DeliveryPage from "@/components/DeliveryPage";
import ContactsPage from "@/components/ContactsPage";
import ServicesPage from "@/components/ServicesPage";
import GamePage from "@/components/GamePage";
import Game2Page from "@/components/Game2Page";
import StarEmpireGame from "@/components/StarEmpireGame";

export type Page = "home" | "catalog" | "veterans" | "cart" | "admin" | "delivery" | "contacts" | "services" | "game" | "game2" | "game3";

export type Product = {
  id: number;
  name: string;
  price: number;
  oldPrice?: number;
  image: string;
  category: string;
  isVeteran?: boolean;
  description: string;
  badge?: string;
};

export type CartItem = Product & { qty: number };

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Биокомплекс Иммунити Про",
    price: 2490,
    oldPrice: 3200,
    image: "https://cdn.poehali.dev/projects/bdc6b0f1-9d51-4bfd-8a1e-7d2779701ef2/files/06d573e8-89dd-4724-ab0e-a053e7d5790b.jpg",
    category: "Биотехнологии",
    description: "Профессиональный иммунный комплекс нового поколения",
    badge: "Хит",
  },
  {
    id: 2,
    name: "ОмегаБаланс 3-6-9",
    price: 1890,
    image: "https://cdn.poehali.dev/projects/bdc6b0f1-9d51-4bfd-8a1e-7d2779701ef2/files/06d573e8-89dd-4724-ab0e-a053e7d5790b.jpg",
    category: "Нутрицевтика",
    description: "Полный спектр жирных кислот для здоровья сердца",
  },
  {
    id: 3,
    name: "Клеточный Детокс Плюс",
    price: 3100,
    oldPrice: 4000,
    image: "https://cdn.poehali.dev/projects/bdc6b0f1-9d51-4bfd-8a1e-7d2779701ef2/files/06d573e8-89dd-4724-ab0e-a053e7d5790b.jpg",
    category: "Детокс",
    description: "Глубокое очищение клеток на клеточном уровне",
    badge: "−22%",
  },
  {
    id: 4,
    name: "Прогормон Актив",
    price: 4500,
    image: "https://cdn.poehali.dev/projects/bdc6b0f1-9d51-4bfd-8a1e-7d2779701ef2/files/06d573e8-89dd-4724-ab0e-a053e7d5790b.jpg",
    category: "Биотехнологии",
    description: "Поддержка гормонального фона и восстановление",
  },
  // Компьютеры и комплектующие
  {
    id: 7,
    name: "Ноутбук Профессиональный 15\"",
    price: 89900,
    oldPrice: 105000,
    image: "https://cdn.poehali.dev/projects/bdc6b0f1-9d51-4bfd-8a1e-7d2779701ef2/files/ef99eb75-4b90-4020-961f-25b61dd9e419.jpg",
    category: "Компьютеры",
    description: "Intel Core i7, 16GB RAM, SSD 512GB, для работы и учёбы",
    badge: "−14%",
  },
  {
    id: 8,
    name: "Игровой ПК Сборка Стандарт",
    price: 65000,
    image: "https://cdn.poehali.dev/projects/bdc6b0f1-9d51-4bfd-8a1e-7d2779701ef2/files/ef99eb75-4b90-4020-961f-25b61dd9e419.jpg",
    category: "Компьютеры",
    description: "Ryzen 5, RTX 3060, 16GB RAM, 1TB SSD — готовая сборка",
    badge: "Хит",
  },
  {
    id: 9,
    name: "Процессор Intel Core i5-13600K",
    price: 22500,
    oldPrice: 27000,
    image: "https://cdn.poehali.dev/projects/bdc6b0f1-9d51-4bfd-8a1e-7d2779701ef2/files/ef99eb75-4b90-4020-961f-25b61dd9e419.jpg",
    category: "Компьютеры",
    description: "14 ядер, 5.1 GHz, LGA1700, для геймеров и профессионалов",
  },
  {
    id: 10,
    name: "SSD Samsung 1TB NVMe",
    price: 7800,
    oldPrice: 9500,
    image: "https://cdn.poehali.dev/projects/bdc6b0f1-9d51-4bfd-8a1e-7d2779701ef2/files/ef99eb75-4b90-4020-961f-25b61dd9e419.jpg",
    category: "Компьютеры",
    description: "Скорость чтения 7000 МБ/с, M.2 PCIe 4.0, гарантия 5 лет",
  },
  {
    id: 11,
    name: "Видеокарта RTX 4070 Super",
    price: 58000,
    image: "https://cdn.poehali.dev/projects/bdc6b0f1-9d51-4bfd-8a1e-7d2779701ef2/files/ef99eb75-4b90-4020-961f-25b61dd9e419.jpg",
    category: "Компьютеры",
    description: "12GB GDDR6X, 4K gaming, трассировка лучей, DLSS 3.5",
    badge: "Новинка",
  },
  {
    id: 12,
    name: "Монитор 27\" IPS 144Hz",
    price: 18900,
    oldPrice: 22000,
    image: "https://cdn.poehali.dev/projects/bdc6b0f1-9d51-4bfd-8a1e-7d2779701ef2/files/ef99eb75-4b90-4020-961f-25b61dd9e419.jpg",
    category: "Компьютеры",
    description: "2560×1440, IPS, 144Hz, 1ms, HDR400, для работы и игр",
  },
  // Одежда и обувь
  {
    id: 13,
    name: "Кроссовки Urban Run Pro",
    price: 4990,
    oldPrice: 6500,
    image: "https://cdn.poehali.dev/projects/bdc6b0f1-9d51-4bfd-8a1e-7d2779701ef2/files/e6579c55-b5ca-495f-87c5-0023234f2764.jpg",
    category: "Одежда и обувь",
    description: "Лёгкие беговые кроссовки, амортизация EVA, сетчатый верх",
    badge: "−23%",
  },
  {
    id: 14,
    name: "Куртка Softshell Outdoor",
    price: 5800,
    image: "https://cdn.poehali.dev/projects/bdc6b0f1-9d51-4bfd-8a1e-7d2779701ef2/files/e6579c55-b5ca-495f-87c5-0023234f2764.jpg",
    category: "Одежда и обувь",
    description: "Ветро- и влагозащитная, флисовая подкладка, 4 кармана",
  },
  {
    id: 15,
    name: "Джинсы Slim Fit Premium",
    price: 3200,
    oldPrice: 4100,
    image: "https://cdn.poehali.dev/projects/bdc6b0f1-9d51-4bfd-8a1e-7d2779701ef2/files/e6579c55-b5ca-495f-87c5-0023234f2764.jpg",
    category: "Одежда и обувь",
    description: "100% хлопок, стрейч-денин, зауженный крой, размеры 28–38",
    badge: "Хит",
  },
  {
    id: 16,
    name: "Футболка Classic Cotton Pack",
    price: 1290,
    image: "https://cdn.poehali.dev/projects/bdc6b0f1-9d51-4bfd-8a1e-7d2779701ef2/files/e6579c55-b5ca-495f-87c5-0023234f2764.jpg",
    category: "Одежда и обувь",
    description: "Комплект 3 шт., 100% хлопок, унисекс, размеры S–XXXL",
  },
  {
    id: 17,
    name: "Зимние ботинки Arctic Warm",
    price: 6900,
    oldPrice: 8500,
    image: "https://cdn.poehali.dev/projects/bdc6b0f1-9d51-4bfd-8a1e-7d2779701ef2/files/e6579c55-b5ca-495f-87c5-0023234f2764.jpg",
    category: "Одежда и обувь",
    description: "До −40°C, непромокаемая мембрана, противоскользящая подошва",
  },
  // Услуги
  {
    id: 18,
    name: "Диагностика ПК / ноутбука",
    price: 500,
    image: "https://cdn.poehali.dev/projects/bdc6b0f1-9d51-4bfd-8a1e-7d2779701ef2/files/858cdb8d-dffd-47d1-90d1-b931c4c67d69.jpg",
    category: "Услуги",
    description: "Полная диагностика компьютера или ноутбука, заключение о состоянии, выезд или приём в сервисе",
    badge: "Хит",
  },
  {
    id: 19,
    name: "Ремонт ноутбука — замена матрицы",
    price: 2500,
    image: "https://cdn.poehali.dev/projects/bdc6b0f1-9d51-4bfd-8a1e-7d2779701ef2/files/858cdb8d-dffd-47d1-90d1-b931c4c67d69.jpg",
    category: "Услуги",
    description: "Замена экрана ноутбука любой марки, оригинальные комплектующие, гарантия 6 месяцев",
  },
  {
    id: 20,
    name: "Установка Windows + драйверы",
    price: 1200,
    image: "https://cdn.poehali.dev/projects/bdc6b0f1-9d51-4bfd-8a1e-7d2779701ef2/files/858cdb8d-dffd-47d1-90d1-b931c4c67d69.jpg",
    category: "Услуги",
    description: "Чистая установка Windows 10/11, драйверы, базовый набор программ, антивирус",
  },
  {
    id: 21,
    name: "Абонентское обслуживание (физ. лицо)",
    price: 990,
    image: "https://cdn.poehali.dev/projects/bdc6b0f1-9d51-4bfd-8a1e-7d2779701ef2/files/858cdb8d-dffd-47d1-90d1-b931c4c67d69.jpg",
    category: "Услуги",
    description: "Ежемесячное обслуживание: удалённая поддержка, чистка, обновления — безлимит обращений",
    badge: "Выгодно",
  },
  {
    id: 22,
    name: "Договор с предприятием — Базовый",
    price: 4900,
    image: "https://cdn.poehali.dev/projects/bdc6b0f1-9d51-4bfd-8a1e-7d2779701ef2/files/858cdb8d-dffd-47d1-90d1-b931c4c67d69.jpg",
    category: "Услуги",
    description: "До 10 ПК: плановое ТО, удалённая поддержка, выезд 2 раза в месяц, SLA 4 часа",
  },
  {
    id: 23,
    name: "Договор с предприятием — Корпоративный",
    price: 14900,
    image: "https://cdn.poehali.dev/projects/bdc6b0f1-9d51-4bfd-8a1e-7d2779701ef2/files/858cdb8d-dffd-47d1-90d1-b931c4c67d69.jpg",
    category: "Услуги",
    description: "До 50 ПК: выделенный инженер, ежедневный мониторинг, замена оборудования, SLA 1 час",
    badge: "Для бизнеса",
  },
  {
    id: 5,
    name: "Реабилитация СВО — Комплекс",
    price: 0,
    image: "https://cdn.poehali.dev/projects/bdc6b0f1-9d51-4bfd-8a1e-7d2779701ef2/files/6d6aa334-77cf-4882-8c40-3c4eea7b5ccd.jpg",
    category: "Ветеранам",
    isVeteran: true,
    description: "Специальный восстановительный комплекс для ветеранов СВО",
    badge: "Бесплатно",
  },
  {
    id: 6,
    name: "НейроСила — Поддержка ЦНС",
    price: 0,
    oldPrice: 5500,
    image: "https://cdn.poehali.dev/projects/bdc6b0f1-9d51-4bfd-8a1e-7d2779701ef2/files/6d6aa334-77cf-4882-8c40-3c4eea7b5ccd.jpg",
    category: "Ветеранам",
    isVeteran: true,
    description: "Нейропротективный комплекс для восстановления ЦНС",
    badge: "Бесплатно",
  },
];

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) return prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQty = (id: number, qty: number) => {
    if (qty <= 0) return removeFromCart(id);
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, qty } : i));
  };

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const renderPage = () => {
    switch (page) {
      case "home": return <HomePage setPage={setPage} products={products} addToCart={addToCart} />;
      case "catalog": return <CatalogPage products={products} addToCart={addToCart} />;
      case "veterans": return <VeteransPage products={products} addToCart={addToCart} />;
      case "cart": return <CartPage cart={cart} removeFromCart={removeFromCart} updateQty={updateQty} setPage={setPage} />;
      case "admin": return <AdminPage products={products} setProducts={setProducts} />;
      case "delivery": return <DeliveryPage />;
      case "contacts": return <ContactsPage />;
      case "services": return <ServicesPage setPage={setPage} />;
      case "game": return <GamePage />;
      case "game2": return <Game2Page />;
      case "game3": return <StarEmpireGame />;
      default: return null;
    }
  };

  return (
    <TooltipProvider>
      <Toaster />
      <div className="min-h-screen bg-background">
        <Header page={page} setPage={setPage} cartCount={cartCount} />
        <main>{renderPage()}</main>
      </div>
    </TooltipProvider>
  );
}