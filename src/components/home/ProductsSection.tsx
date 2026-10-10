import { useState } from "react";
import { Link } from "react-router-dom";
import { useProducts, Product } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";
import { sortSizes } from "@/lib/sizes";

export function ProductsSection() {
  const { products, loading } = useProducts();

  return (
    <section className="py-24" id="roupas">
      <div className="container">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black">ROUPAS EM DESTAQUE</h2>
          <div className="flex gap-4 items-center">
            <Link to="/roupas" className="text-sm font-medium hover:text-primary transition-colors">
              Ver tudo →
            </Link>
            <Link to="/login" className="text-sm font-medium text-primary hover:underline">
              Entrar
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted w-2/3" />
                  <div className="h-6 bg-muted w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.slice(0, 6).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

interface ProductCardProps {
  product: Product;
}

function ProductCard({ product }: ProductCardProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const { addToCart } = useCart();

  const handleSizeClick = (size: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedSize(size);
    // Create a product object that matches the expected format
    const cartProduct = {
      id: typeof product.id === "string" ? parseInt(product.id) || Date.now() : product.id,
      nome: product.nome,
      preco: product.preco,
      imagem: product.imagem_principal || "",
      descricao: product.descricao || "",
      tamanhos: product.tamanhos,
    };
    addToCart(cartProduct, size);
  };

  const formatPrice = (price: number) => price.toFixed(2).replace(".", ",");

  return (
    <div className="group relative">
      {/* Product Link */}
      <Link to={`/produto/${product.id}`} className="block">
        <div className="aspect-[3/4] overflow-hidden bg-muted mb-4">
          <img
            src={product.imagem_principal || ""}
            alt={product.nome}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80";
            }}
          />
        </div>
        <h3 className="text-sm font-medium mb-1">{product.nome}</h3>
        <p className="text-sm font-bold text-primary mb-3">R$ {formatPrice(product.preco)}</p>
      </Link>

      {/* Size Buttons */}
      <div className="flex gap-1.5">
        {sortSizes([...product.tamanhos]).map((size) => (
          <button
            key={size}
            onClick={(e) => handleSizeClick(size, e)}
            className={cn(
              "h-8 min-w-[32px] px-1 text-[10px] font-medium border transition-colors flex items-center justify-center border-border bg-background hover:border-primary hover:bg-primary hover:text-primary-foreground",
              selectedSize === size && "bg-primary text-primary-foreground border-primary"
            )}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );
}
