import Icon from "@/components/ui/icon";
import type { Product } from "@/App";

type Props = {
  product: Product;
  onAdd: (p: Product) => void;
};

const BEAR_IMG = "https://cdn.poehali.dev/projects/bdc6b0f1-9d51-4bfd-8a1e-7d2779701ef2/files/06d573e8-89dd-4724-ab0e-a053e7d5790b.jpg";
const VET_BEAR_IMG = "https://cdn.poehali.dev/projects/bdc6b0f1-9d51-4bfd-8a1e-7d2779701ef2/files/6d6aa334-77cf-4882-8c40-3c4eea7b5ccd.jpg";

export default function ProductCard({ product, onAdd }: Props) {
  const isVet = product.isVeteran;

  return (
    <div className={`bg-white rounded-2xl overflow-hidden card-hover border ${isVet ? "border-red-200" : "border-border"} flex flex-col`}>
      <div className="relative">
        <div className={`h-44 flex items-center justify-center overflow-hidden ${isVet ? "bg-gradient-to-br from-blue-950 to-red-900" : "bg-gradient-to-br from-blue-50 to-indigo-100"}`}>
          <img
            src={isVet ? VET_BEAR_IMG : BEAR_IMG}
            alt={product.name}
            className="h-36 w-36 object-cover rounded-full border-4 border-white shadow-lg"
          />
        </div>
        {product.badge && (
          <span className={`absolute top-2 left-2 text-xs font-bold px-2 py-1 rounded-lg ${
            isVet ? "badge-vet" :
            product.badge === "Хит" ? "bg-amber-400 text-amber-900" :
            "bg-red-500 text-white"
          }`}>
            {product.badge}
          </span>
        )}
        <span className="absolute top-2 right-2 bg-white/90 text-xs text-muted-foreground px-2 py-1 rounded-lg font-medium">
          {product.category}
        </span>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-sm leading-snug mb-1 text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
          {product.name}
        </h3>
        <p className="text-xs text-muted-foreground mb-3 flex-1">{product.description}</p>

        <div className="flex items-center justify-between mt-auto">
          <div>
            {isVet ? (
              <span className="font-black text-green-600 text-base">Бесплатно</span>
            ) : (
              <>
                <span className="font-black text-lg text-foreground">{product.price.toLocaleString("ru")} ₽</span>
                {product.oldPrice && (
                  <span className="text-xs text-muted-foreground line-through ml-1">{product.oldPrice.toLocaleString("ru")} ₽</span>
                )}
              </>
            )}
          </div>
          <button
            onClick={() => onAdd(product)}
            className="bear-btn flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-xl text-sm font-semibold"
          >
            <Icon name="ShoppingCart" size={15} />
            <span>{isVet ? "Получить" : "В корзину"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
