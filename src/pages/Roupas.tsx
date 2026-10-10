import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { useProducts, Product } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";
import { sortSizes } from "@/lib/sizes";
import { Link } from "react-router-dom";
import { useHeroImage } from "@/hooks/useHeroImage";
import { ProductModal } from "@/components/shop/ProductModal";
import { ProductSearch, SearchFilters } from "@/components/products/ProductSearch";
import { SEO } from "@/components/common/SEO";
import { Eye } from "lucide-react";

type FilterCategory = "todos" | "camisetas" | "acessorios";
type SortOption = "relevancia" | "menor_preco" | "maior_preco";

const Roupas = () => {
  const { products, loading: productsLoading } = useProducts();
  const { heroImage, loading: heroLoading } = useHeroImage("roupas");

  const [filterCategory, setFilterCategory] = useState<FilterCategory>("todos");
  const [sortBy, setSortBy] = useState<SortOption>("relevancia");
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: "",
    sortBy: "newest",
  });

  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Busca por texto (do ProductSearch)
    if (searchFilters.query) {
      const query = searchFilters.query.toLowerCase();
      result = result.filter(
        (p) => p.nome.toLowerCase().includes(query) || p.descricao?.toLowerCase().includes(query)
      );
    }

    // Filtro de categoria (do ProductSearch)
    if (searchFilters.category) {
      result = result.filter((p) => {
        const name = p.nome.toLowerCase();
        if (searchFilters.category === "camisetas") {
          return name.includes("camiseta") || name.includes("t-shirt") || name.includes("regata");
        }
        if (searchFilters.category === "acessorios") {
          return name.includes("boné") || name.includes("meia") || name.includes("viseira");
        }
        return true;
      });
    }

    // Filter antigo (mantido para compatibilidade com UI antiga)
    if (filterCategory !== "todos") {
      result = result.filter((p) => {
        const name = p.nome.toLowerCase();
        if (filterCategory === "camisetas") {
          return (
            name.includes("camiseta") ||
            name.includes("t-shirt") ||
            name.includes("regata") ||
            name.includes("manga longa") ||
            name.includes("top")
          );
        }
        if (filterCategory === "acessorios") {
          return name.includes("boné") || name.includes("meia") || name.includes("viseira");
        }
        return true;
      });
    }

    // Sort do ProductSearch (priority) ou sort antigo
    const sortOption = searchFilters.sortBy || sortBy;
    if (sortOption === "price_asc" || sortBy === "menor_preco") {
      result.sort((a, b) => a.preco - b.preco);
    } else if (sortOption === "price_desc" || sortBy === "maior_preco") {
      result.sort((a, b) => b.preco - a.preco);
    } else if (sortOption === "name") {
      result.sort((a, b) => a.nome.localeCompare(b.nome));
    }

    return result;
  }, [products, filterCategory, sortBy, searchFilters]);

  const handleSearch = (filters: SearchFilters) => {
    setSearchFilters(filters);
  };

  const handleQuickView = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewProduct(product);
    setIsModalOpen(true);
  };

  return (
    <>
      <SEO
        title="Roupas e Acessórios - Superação Assessoria"
        description="Camisetas técnicas, bonés e acessórios para corrida de alta performance. Produtos exclusivos do Superação Assessoria."
        keywords="camiseta corrida, roupa running, boné corrida, acessórios running, performance"
      />
      <Layout>
        <div className="bg-obsidian text-white min-h-screen">
          {/* Hero */}
          <section className="relative py-32 bg-black overflow-hidden border-b border-white/10">
            <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-neutral-900/50" />
            <div
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 mix-blend-overlay ${heroLoading ? "opacity-0" : "opacity-30 grayscale"}`}
              style={{
                backgroundImage: `url('${heroImage?.url || "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=2070"}')`,
                backgroundPosition: heroImage?.posicao || "center",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            <div className="container relative z-10 text-center px-4">
              <span className="text-primary font-heading tracking-[0.2em] text-sm uppercase mb-4 block">
                LOJA EXCLUSIVA
              </span>
              <h1 className="text-5xl md:text-6xl lg:text-8xl font-heading mb-6 tracking-tight uppercase">Equipamento <span className="text-primary">Oficial</span></h1>
              <p className="text-lg md:text-xl text-neutral-400 font-light max-w-2xl mx-auto">
                Performance e estilo para seus treinos com o manto da Superação.
              </p>

              {/* Destaque do Lote da Nova Regata */}
              <div className="mt-8 flex justify-center">
                <Link
                  to="/pedido-regata"
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-extrabold px-7 py-4 rounded-full shadow-2xl shadow-orange-500/30 hover:scale-105 transition-all text-sm uppercase tracking-wider group"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-black animate-ping" />
                  🔥 Fazer Pedido da Nova Regata Cavada (Z-NINE) - R$ 62,99
                  <span className="text-black group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>
            </div>
          </section>

          {/* Filters */}
          <section className="sticky top-20 z-40 bg-[#0b1120]/80 backdrop-blur-md border-b border-white/10 py-4">
            <div className="container px-4">
              <div className="mb-4">
                <ProductSearch onSearch={handleSearch} />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex gap-2 bg-white/5 p-1 rounded-full border border-white/10">
                  {(["todos", "camisetas", "acessorios"] as FilterCategory[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={cn(
                        "px-6 py-2 text-xs font-bold rounded-full transition-all capitalize tracking-wider",
                        filterCategory === cat
                          ? "bg-primary text-black shadow-lg"
                          : "text-neutral-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Ordenar:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="border border-white/10 bg-white/5 text-white px-4 py-2 text-sm rounded-full focus:outline-none focus:ring-1 focus:ring-primary transition-colors cursor-pointer"
                    aria-label="Ordenar produtos"
                  >
                    <option value="relevancia" className="bg-obsidian">Relevância</option>
                    <option value="menor_preco" className="bg-obsidian">Menor preço</option>
                    <option value="maior_preco" className="bg-obsidian">Maior preço</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Products Grid */}
          <section className="py-16 min-h-[50vh]">
            <div className="container px-4">
              {productsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-[3/4] bg-white/5 rounded-2xl mb-4" />
                      <div className="space-y-3 px-2">
                        <div className="h-4 bg-white/10 w-2/3 rounded" />
                        <div className="h-6 bg-white/10 w-1/3 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onQuickView={(e) => handleQuickView(e, product)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-32 bg-white/5 border border-white/10 rounded-2xl">
                  <p className="text-neutral-400 text-lg mb-4">Nenhum produto encontrado nesta categoria.</p>
                  <button
                    onClick={() => setFilterCategory("todos")}
                    className="text-primary hover:text-black transition-colors font-semibold py-2 px-6 border border-primary bg-primary hover:bg-primary/90 rounded-sm font-heading tracking-wider uppercase mt-4"
                  >
                    Ver todos os produtos
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        <ProductModal
          product={quickViewProduct}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </Layout>
    </>
  );
};

interface ProductCardProps {
  product: Product;
  onQuickView: (e: React.MouseEvent) => void;
}

function ProductCard({ product, onQuickView }: ProductCardProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const { addToCart } = useCart();

  const getStockForSize = (size: string): number => {
    if (!product.estoque) return 0;
    return product.estoque[size] ?? 0;
  };

  const isOutOfStock = (size: string): boolean => {
    return getStockForSize(size) <= 0;
  };

  const isProductOutOfStock = (): boolean => {
    return product.tamanhos.every((size) => isOutOfStock(size));
  };

  const handleSizeClick = (size: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock(size)) return;

    setSelectedSize(size);
    addToCart(
      {
        id: typeof product.id === "string" ? parseInt(product.id) || Date.now() : product.id,
        nome: product.nome,
        preco: product.preco,
        imagem: product.imagem_principal || "",
        descricao: product.descricao || "",
        tamanhos: product.tamanhos,
      },
      size
    );
  };

  const formatPrice = (price: number) => price.toFixed(2).replace(".", ",");

  return (
    <div className="group relative flex flex-col bg-white/5 rounded-2xl border border-white/10 overflow-hidden hover:border-accent/50 transition-colors p-4">
      {/* Product Link */}
      <Link to={`/produto/${product.id}`} className="block relative overflow-hidden flex-1">
        {isProductOutOfStock() && (
          <div className="absolute top-3 left-3 z-10 bg-destructive text-white px-3 py-1 text-[10px] font-bold uppercase rounded-full tracking-wider">
            Esgotado
          </div>
        )}

        {/* Quick View Trigger */}
        <button
          onClick={onQuickView}
          className="absolute top-3 right-3 z-10 p-2.5 bg-black/80 backdrop-blur-md text-white rounded-sm opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-primary hover:text-black border border-white/10"
          aria-label="Espiar"
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Product Image */}
        <div className="aspect-[4/5] overflow-hidden rounded-xl bg-obsidian mb-4 relative">
          <img
            src={product.imagem_principal || ""}
            alt={product.nome}
            className={cn(
              "w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700",
              isProductOutOfStock() && "opacity-50 grayscale"
            )}
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80";
            }}
          />
        </div>

        {/* Product Info */}
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-1 line-clamp-1 group-hover:text-primary transition-colors text-white uppercase tracking-wider font-heading">
            {product.nome}
          </h3>
          <p className="text-lg font-bold text-primary">R$ {formatPrice(product.preco)}</p>
        </div>
      </Link>

      {/* Bottom Size Buttons */}
      <div className="flex flex-wrap gap-1.5 mt-auto">
        {product.tamanhos.length === 1 && product.tamanhos[0] === "UNICO" ? (
          <button
            onClick={(e) => handleSizeClick("UNICO", e)}
            disabled={isOutOfStock("UNICO")}
            className={cn(
              "w-full py-2.5 text-xs font-bold uppercase rounded-sm border transition-colors",
              isOutOfStock("UNICO") 
                ? "border-white/10 text-neutral-500 cursor-not-allowed bg-transparent"
                : "border-primary text-primary hover:bg-primary hover:text-black font-heading tracking-wider"
            )}
          >
            ADICIONAR
          </button>
        ) : (
          sortSizes([...product.tamanhos]).map((size) => {
            const outOfStock = isOutOfStock(size);
            return (
              <button
                key={`bottom-${size}`}
                onClick={(e) => handleSizeClick(size, e)}
                disabled={outOfStock}
                title={outOfStock ? "Esgotado" : `${getStockForSize(size)} em estoque`}
                className={cn(
                  "h-8 min-w-[36px] px-2 rounded-full text-[10px] font-bold border transition-colors flex items-center justify-center",
                  outOfStock
                    ? "border-white/5 text-neutral-600 cursor-not-allowed bg-transparent"
                    : "border-white/20 text-neutral-300 hover:border-accent hover:text-accent bg-transparent",
                  selectedSize === size && !outOfStock && "bg-accent text-white border-accent hover:text-white"
                )}
              >
                {size}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Roupas;
