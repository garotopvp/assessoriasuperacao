import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Product } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";
import { sortSizes } from "@/lib/sizes";
import { ShoppingBag } from "lucide-react";

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const { addToCart } = useCart();

  if (!product) return null;

  const getStockForSize = (size: string): number => {
    if (!product.estoque) return 0;
    return product.estoque[size] ?? 0;
  };

  const isOutOfStock = (size: string): boolean => {
    return getStockForSize(size) <= 0;
  };

  const handleAddToCart = () => {
    if (!selectedSize) return;

    addToCart(
      {
        id: typeof product.id === "string" ? parseInt(product.id) || Date.now() : product.id,
        nome: product.nome,
        preco: product.preco,
        imagem: product.imagem_principal || "",
        descricao: product.descricao || "",
        tamanhos: product.tamanhos,
      },
      selectedSize
    );
    onClose();
  };

  const formatPrice = (price: number) => price.toFixed(2).replace(".", ",");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-background">
        <DialogTitle className="sr-only">{product.nome}</DialogTitle>
        <DialogDescription className="sr-only">
          Detalhes do produto {product.nome}
        </DialogDescription>

        <div className="grid md:grid-cols-2">
          {/* Image */}
          <div className="aspect-[3/4] md:aspect-auto bg-muted">
            <img
              src={product.imagem_principal || ""}
              alt={product.nome}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src =
                  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80";
              }}
            />
          </div>

          {/* Content */}
          <div className="p-6 flex flex-col h-full">
            <h2 className="text-2xl font-black mb-2 uppercase tracking-wide">{product.nome}</h2>
            <div className="text-xl font-bold text-primary mb-6">
              R$ {formatPrice(product.preco)}
            </div>

            <div className="space-y-4 mb-8 flex-1">
              <div>
                <p className="text-sm font-medium mb-2">Tamanho</p>
                <div className="flex flex-wrap gap-2">
                  {sortSizes([...product.tamanhos]).map((size) => {
                    const outOfStock = isOutOfStock(size);
                    return (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        disabled={outOfStock}
                        className={cn(
                          "h-10 min-w-[40px] px-2 text-sm font-medium border transition-colors flex items-center justify-center",
                          outOfStock
                            ? "border-muted text-muted-foreground cursor-not-allowed opacity-50"
                            : "border-border hover:border-primary hover:text-primary",
                          selectedSize === size &&
                            !outOfStock &&
                            "bg-primary text-primary-foreground border-primary hover:text-primary-foreground"
                        )}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Descrição</p>
                <p className="text-sm text-muted-foreground">{product.descricao}</p>
                {product.detalhes && (
                  <div
                    className="text-xs text-muted-foreground mt-2 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: product.detalhes }}
                  />
                )}
              </div>
            </div>

            <Button
              size="lg"
              className="w-full font-bold gap-2"
              disabled={!selectedSize}
              onClick={handleAddToCart}
            >
              <ShoppingBag className="w-4 h-4" />
              {selectedSize ? "ADICIONAR À SACOLA" : "SELECIONE UM TAMANHO"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
