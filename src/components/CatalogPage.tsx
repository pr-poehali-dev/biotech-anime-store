import { useState } from "react";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/App";

type Props = {
  products: Product[];
  addToCart: (p: Product) => void;
};

export default function CatalogPage({ products, addToCart }: Props) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Все");

  const nonVet = products.filter((p) => !p.isVeteran);
  const categories = ["Все", ...Array.from(new Set(nonVet.map((p) => p.category)))];

  const filtered = nonVet.filter((p) => {
    const matchCat = activeCategory === "Все" || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-3xl font-black mb-6 text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>Каталог товаров</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="🔍 Поиск товаров..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-border rounded-xl px-4 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-primary/30"
        />
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-white border-border text-foreground hover:border-primary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <div className="text-5xl mb-4">🐻</div>
          <p className="font-semibold">Ничего не найдено</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} onAdd={addToCart} />
          ))}
        </div>
      )}
    </div>
  );
}
