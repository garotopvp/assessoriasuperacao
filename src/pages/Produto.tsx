import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { sortSizes } from "@/lib/sizes";
import { ArrowLeft, Plus, Minus } from "lucide-react";
import { Product } from "@/lib/supabase-api";
import { SEO } from "@/components/common/SEO";

const Produto = () => {
  const { id } = useParams();
  const { products, loading } = useProducts();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { addToCart } = useCart();

  const product = products.find((p) => String(p.id) === String(id));

  // Related products (other products)
  const relatedProducts = products.filter((p) => p.id !== product?.id).slice(0, 4);

  // Check stock for selected size
  const selectedSizeStock = selectedSize ? (product?.estoque?.[selectedSize] ?? 0) : 0;
  const isSelectedSizeOutOfStock = selectedSize ? selectedSizeStock <= 0 : false;

  // Limit quantity to available stock
  const maxQuantity = selectedSizeStock > 0 ? selectedSizeStock : 1;

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => {
      const newQty = prev + delta;
      if (newQty < 1) return 1;
      if (newQty > maxQuantity) return maxQuantity;
      return newQty;
    });
  };

  // Reset quantity when size changes
  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    setQuantity(1);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="animate-pulse grid lg:grid-cols-2 gap-12">
            <div className="aspect-[3/4] bg-muted" />
            <div className="space-y-4">
              <div className="h-8 bg-muted w-3/4" />
              <div className="h-4 bg-muted w-1/2" />
              <div className="h-10 bg-muted w-1/3" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container py-24 text-center">
          <h1 className="text-2xl font-bold mb-4">Produto não encontrado</h1>
          <Link to="/roupas" className="text-primary hover:underline">
            Voltar para Roupas
          </Link>
        </div>
      </Layout>
    );
  }

  const formatPrice = (price: number) => price.toFixed(2).replace(".", ",");

  const handleAddToCart = () => {
    if (!selectedSize) {
      return;
    }

    // Safety check for ID conversion
    const productId =
      typeof product.id === "string" ? parseInt(product.id) || Date.now() : product.id;

    const cartProduct = {
      id: productId,
      produtoId: productId, // CartItem expects produtoId
      nome: product.nome,
      preco: product.preco,
      imagem: product.imagem_principal || product.imagem_principal || "",
      imagem_principal: product.imagem_principal || undefined,
      descricao: product.descricao || "",
      tamanhos: product.tamanhos || [],
      quantidade: quantity,
    };

    // Cast to any to avoid strict type conflicts between string/number IDs
    addToCart(cartProduct as any, selectedSize, quantity);
    setQuantity(1); // Reset after adding
  };

  return (
    <>
      <SEO
        title={product ? `${product.nome} - Superação Assessoria` : "Produto - Superação Assessoria"}
        description={product?.descricao || "Produtos oficiais Superação Assessoria"}
        keywords={`${product?.nome || "produto"}, comprar, loja corrida, roupa running`}
      />
      <Layout>
        <div className="bg-obsidian text-white min-h-[calc(100vh-80px)] pt-12 pb-24">
          <div className="container px-4">
            <Link
              to="/roupas"
              className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para Loja
            </Link>

            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
              {/* Image Gallery */}
              <div className="space-y-4">
                <div className="aspect-[4/5] bg-white/5 rounded-2xl overflow-hidden border border-white/10 group">
                  <img
                    src={
                      selectedImageIndex === 0
                        ? product.imagem_principal || ""
                        : product.imagens?.[selectedImageIndex - 1] || product.imagem_principal || ""
                    }
                    alt={product.nome}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80";
                    }}
                  />
                </div>
                {/* Thumbnail Gallery */}
                {product.imagens && product.imagens.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    <div
                      className={cn(
                        "w-20 h-20 rounded-xl border-2 overflow-hidden cursor-pointer transition-all flex-shrink-0",
                        selectedImageIndex === 0
                          ? "border-accent shadow-[0_0_15px_rgba(56,189,248,0.3)]"
                          : "border-white/10 hover:border-white/30 opacity-70 hover:opacity-100"
                      )}
                      onClick={() => setSelectedImageIndex(0)}
                    >
                      <img
                        src={product.imagem_principal || ""}
                        alt={product.nome}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {product.imagens.slice(0, 3).map((img, i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-20 h-20 rounded-xl border-2 overflow-hidden cursor-pointer transition-all flex-shrink-0",
                          selectedImageIndex === i + 1
                            ? "border-accent shadow-[0_0_15px_rgba(56,189,248,0.3)]"
                            : "border-white/10 hover:border-white/30 opacity-70 hover:opacity-100"
                        )}
                        onClick={() => setSelectedImageIndex(i + 1)}
                      >
                        <img
                          src={img}
                          alt={`${product.nome} ${i + 2}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex flex-col">
                <span className="text-accent text-xs font-bold uppercase tracking-widest mb-2 block">
                  EQUIPAMENTO OFICIAL
                </span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 tracking-tight">{product.nome}</h1>
                <p className="text-3xl font-bold text-accent mb-6">R$ {formatPrice(product.preco)}</p>
                <div className="h-px w-full bg-white/10 mb-6" />
                <p className="text-neutral-400 text-lg font-light leading-relaxed mb-8">{product.descricao}</p>

                {/* Detalhes do Produto */}
                {product.detalhes && (
                  <div className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-sm font-bold uppercase tracking-widest text-white mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-accent inline-block" />
                      Destaques
                    </p>
                    <div
                      className="text-sm text-neutral-400 prose prose-sm prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: product.detalhes }}
                    />
                  </div>
                )}

                {/* Sizes */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm font-bold uppercase tracking-widest text-white">Tamanho</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {sortSizes([...product.tamanhos]).map((size) => {
                      const stock = product.estoque?.[size] ?? 0;
                      const outOfStock = stock <= 0;
                      return (
                        <button
                          key={size}
                          onClick={() => !outOfStock && handleSizeSelect(size)}
                          disabled={outOfStock}
                          title={outOfStock ? "Esgotado" : `${stock} em estoque`}
                          className={cn(
                            "min-w-[3.5rem] h-12 px-4 rounded-xl flex items-center justify-center text-sm font-bold border-2 transition-all relative",
                            outOfStock
                              ? "border-white/5 text-neutral-600 bg-white/5 cursor-not-allowed"
                              : selectedSize === size
                                ? "border-accent bg-accent text-white shadow-[0_0_15px_rgba(56,189,248,0.4)]"
                                : "border-white/20 text-neutral-300 hover:border-accent hover:text-white bg-transparent"
                          )}
                        >
                          {size}
                          {outOfStock && (
                            <span className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-xl">
                              <span className="w-[150%] h-px bg-neutral-600/50 -rotate-45 absolute" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {selectedSize && selectedSizeStock > 0 && selectedSizeStock <= 3 && (
                    <p className="text-xs text-orange-400 mt-3 font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                      Apenas {selectedSizeStock} {selectedSizeStock === 1 ? 'unidade restante' : 'unidades restantes'}!
                    </p>
                  )}
                </div>

                {/* Quantity Selector & Add to Cart */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center bg-white/5 border border-white/10 rounded-full h-14 w-36 overflow-hidden">
                      <button
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1 || !selectedSize || isSelectedSizeOutOfStock}
                        className="flex-1 h-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Diminuir quantidade"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-10 text-center font-bold text-white">
                        {quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(1)}
                        disabled={
                          quantity >= maxQuantity || !selectedSize || isSelectedSizeOutOfStock
                        }
                        className="flex-1 h-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Aumentar quantidade"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    {selectedSize && !isSelectedSizeOutOfStock && (
                      <span className="text-sm font-medium text-neutral-400 border border-white/10 rounded-full px-4 py-1.5 bg-white/5">
                        {selectedSizeStock} disponíveis
                      </span>
                    )}
                  </div>

                  {/* Add to Cart */}
                  <Button
                    size="lg"
                    className={cn(
                      "w-full h-16 rounded-full font-black tracking-widest uppercase text-sm flex items-center justify-center shadow-2xl transition-all",
                      selectedSize && !isSelectedSizeOutOfStock
                        ? "bg-accent hover:bg-accent/90 text-white shadow-accent/20"
                        : "bg-white/10 text-neutral-500 cursor-not-allowed"
                    )}
                    onClick={handleAddToCart}
                    disabled={!selectedSize || isSelectedSizeOutOfStock}
                    variant="ghost"
                  >
                    {isSelectedSizeOutOfStock ? "TAMANHO ESGOTADO" : !selectedSize ? "SELECIONE UM TAMANHO" : "ADICIONAR AO CARRINHO"}
                  </Button>
                </div>

                {/* Accordion Info */}
                <div className="mt-12 space-y-4">
                  <details className="group bg-white/5 border border-white/10 rounded-2xl max-h-16 overflow-hidden open:max-h-96 transition-all duration-500 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex justify-between items-center cursor-pointer font-bold px-6 py-5 text-white">
                      DESCRIÇÃO TÉCNICA
                      <Plus className="w-5 h-5 text-accent group-open:rotate-45 transition-transform duration-300" />
                    </summary>
                    <div className="px-6 pb-6 pt-2 text-sm text-neutral-400 leading-relaxed border-t border-white/10 mx-6">
                      {product.descricao}. Desenvolvido com tecido técnico de alta performance para
                      máximo conforto durante seus treinos. Focado no controle térmico e rápida secagem.
                    </div>
                  </details>
                  
                  <details className="group bg-white/5 border border-white/10 rounded-2xl max-h-16 overflow-hidden open:max-h-[500px] transition-[max-height] duration-500 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex justify-between items-center cursor-pointer font-bold px-6 py-5 text-white">
                      GUIA DE MEDIDAS
                      <Plus className="w-5 h-5 text-accent group-open:rotate-45 transition-transform duration-300" />
                    </summary>
                    <div className="px-6 pb-6 pt-4 text-sm text-neutral-400 border-t border-white/10 mx-6">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-white/10 text-white font-bold">
                              <th className="py-3 px-2">Tamanho</th>
                              <th className="py-3 px-2">Busto (cm)</th>
                              <th className="py-3 px-2">Cintura (cm)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="py-3 px-2 font-bold text-accent">P</td>
                              <td className="py-3 px-2">82-86</td>
                              <td className="py-3 px-2">62-66</td>
                            </tr>
                            <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="py-3 px-2 font-bold text-accent">M</td>
                              <td className="py-3 px-2">86-90</td>
                              <td className="py-3 px-2">66-70</td>
                            </tr>
                            <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="py-3 px-2 font-bold text-accent">G</td>
                              <td className="py-3 px-2">90-94</td>
                              <td className="py-3 px-2">70-74</td>
                            </tr>
                            <tr className="hover:bg-white/5 transition-colors">
                              <td className="py-3 px-2 font-bold text-accent">GG</td>
                              <td className="py-3 px-2">94-98</td>
                              <td className="py-3 px-2">74-78</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            </div>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
              <section className="mt-32 border-t border-white/10 pt-16">
                <div className="flex flex-col items-center mb-12">
                  <span className="text-accent text-xs font-bold uppercase tracking-widest mb-2">COMPLETE O KIT</span>
                  <h2 className="text-3xl lg:text-4xl font-black text-center text-white">Você também pode gostar</h2>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                  {relatedProducts.map((p) => (
                    <Link key={p.id} to={`/produto/${p.id}`} className="group relative flex flex-col bg-white/5 rounded-2xl border border-white/10 overflow-hidden hover:border-accent/50 transition-colors p-3 lg:p-4">
                      <div className="aspect-[4/5] bg-obsidian rounded-xl overflow-hidden mb-4 border border-white/5">
                        <img
                          src={p.imagem_principal || ""}
                          alt={p.nome}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80";
                          }}
                        />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <h3 className="text-sm font-medium mb-1 text-white group-hover:text-accent transition-colors line-clamp-1">{p.nome}</h3>
                        <p className="text-lg font-bold text-accent mt-auto">R$ {formatPrice(p.preco)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
};

export default Produto;
