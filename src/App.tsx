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

export type Page = "home" | "catalog" | "veterans" | "cart" | "admin" | "delivery" | "contacts";

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
