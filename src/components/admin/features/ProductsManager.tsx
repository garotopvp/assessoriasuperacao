import { logger } from "@/lib/logger";
import { createSystemLog } from "@/utils/logger";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductForm, ProductFormData } from "@/components/admin/ProductForm";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff, ChevronUp, ChevronDown, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Product {
  id: string;
  nome: string;
  preco: number;
  descricao: string | null;
  detalhes: string | null;
  tamanhos: string[];
  imagem_principal: string | null;
  imagens: string[];
  ativo: boolean;
  ordem: number;
}

export function ProductsManager() {
  const { user, isAdmin } = useAuthContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  // Fetch products
  useEffect(() => {
    if (user && isAdmin) {
      fetchProducts();
    }
  }, [user, isAdmin]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("ordem", { ascending: true });

      if (error) throw error;

      setProducts(
        data.map((p) => ({
          id: p.id,
          nome: p.nome,
          preco: typeof p.preco === "string" ? parseFloat(p.preco) : p.preco,
          descricao: p.descricao,
          detalhes: p.detalhes,
          tamanhos: p.tamanhos || [],
          imagem_principal: p.imagem_principal,
          imagens: p.imagens || [],
          ativo: p.ativo ?? true,
          ordem: p.ordem ?? 0,
          estoque: p.estoque || {},
        }))
      );
    } catch (err: unknown) {
      logger.error("Error fetching products:", err);
      toast.error("Erro ao carregar produtos");
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);

    try {
      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update({
            nome: data.nome,
            preco: data.preco,
            descricao: data.descricao || null,
            detalhes: data.detalhes || null,
            tamanhos: data.tamanhos,
            imagem_principal: data.imagem_principal || null,
            imagens: data.imagens,
            ativo: data.ativo,
            ordem: data.ordem,
            estoque: data.estoque,
          })
          .eq("id", editingProduct.id);

        if (error) throw error;
        toast.success("Produto atualizado!");

        await createSystemLog({
          action: "update_product",
          category: "user_action",
          level: "info",
          message: `O produto "${data.nome}" foi editado`,
          details: { productId: editingProduct.id, data },
        });
      } else {
        const { error } = await supabase.from("products").insert({
          nome: data.nome,
          preco: data.preco,
          descricao: data.descricao || null,
          detalhes: data.detalhes || null,
          tamanhos: data.tamanhos,
          imagem_principal: data.imagem_principal || null,
          imagens: data.imagens,
          ativo: data.ativo,
          ordem: data.ordem,
          estoque: data.estoque,
        });

        if (error) throw error;
        toast.success("Produto criado!");

        await createSystemLog({
          action: "create_product",
          category: "user_action",
          level: "info",
          message: `Um novo produto foi criado: "${data.nome}"`,
          details: { data },
        });
      }

      setShowForm(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (err: unknown) {
      logger.error("Error saving product:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao salvar produto";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;

    try {
      const { error } = await supabase.from("products").delete().eq("id", deleteProduct.id);

      if (error) throw error;
      toast.success("Produto excluído!");

      await createSystemLog({
        action: "delete_product",
        category: "user_action",
        level: "warning",
        message: `O produto "${deleteProduct.nome}" foi DELETADO do sistema.`,
        details: { productId: deleteProduct.id },
      });

      setDeleteProduct(null);
      fetchProducts();
    } catch (err: unknown) {
      logger.error("Error deleting product:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao excluir produto";
      toast.error(errorMessage);
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ ativo: !product.ativo })
        .eq("id", product.id);

      if (error) throw error;
      toast.success(product.ativo ? "Produto desativado" : "Produto ativado");
      fetchProducts();
    } catch (err) {
      logger.error("Error toggling product:", err);
      toast.error("Erro ao atualizar produto");
    }
  };

  const handleMoveProduct = async (productId: string, direction: "up" | "down") => {
    const currentIndex = products.findIndex((p) => p.id === productId);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= products.length) return;

    setIsReordering(true);

    try {
      const currentProduct = products[currentIndex];
      const swapProduct = products[newIndex];
      const currentOrdem = currentProduct.ordem;
      const swapOrdem = swapProduct.ordem;

      const [result1, result2] = await Promise.all([
        supabase.from("products").update({ ordem: swapOrdem }).eq("id", currentProduct.id),
        supabase.from("products").update({ ordem: currentOrdem }).eq("id", swapProduct.id),
      ]);

      if (result1.error) throw result1.error;
      if (result2.error) throw result2.error;

      const newProducts = [...products];
      newProducts[currentIndex] = { ...currentProduct, ordem: swapOrdem };
      newProducts[newIndex] = { ...swapProduct, ordem: currentOrdem };
      newProducts.sort((a, b) => a.ordem - b.ordem);
      setProducts(newProducts);

      toast.success("Ordem atualizada!");
    } catch (err) {
      logger.error("Error reordering products:", err);
      toast.error("Erro ao reordenar produtos");
      fetchProducts();
    } finally {
      setIsReordering(false);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  return (
    <div className="space-y-6">
      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold">
                {editingProduct ? "Editar Produto" : "Novo Produto"}
              </h2>
            </div>
            <div className="p-6">
              <ProductForm
                initialData={editingProduct || undefined}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setEditingProduct(null);
                }}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        </div>
      )}

      {/* Products Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Produtos</h2>
          <p className="text-muted-foreground">
            {products.length} produto{products.length !== 1 ? "s" : ""} cadastrado
            {products.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {/* Products List */}
      {loadingProducts ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-2xl border border-border">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum produto cadastrado</h3>
          <p className="text-muted-foreground mb-4">Comece adicionando seu primeiro produto</p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Produto
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {products.map((product, index) => (
            <div
              key={product.id}
              className={`bg-card rounded-xl border border-border p-4 flex items-center gap-4 transition-opacity ${
                !product.ativo ? "opacity-60" : ""
              }`}
            >
              {/* Reorder Buttons */}
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleMoveProduct(product.id, "up")}
                  disabled={index === 0 || isReordering}
                  title="Mover para cima"
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleMoveProduct(product.id, "down")}
                  disabled={index === products.length - 1 || isReordering}
                  title="Mover para baixo"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>

              {/* Image */}
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {product.imagem_principal ? (
                  <img
                    src={product.imagem_principal}
                    alt={product.nome}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">#{index + 1}</span>
                  <h3 className="font-medium truncate">{product.nome}</h3>
                  {!product.ativo && (
                    <span className="text-xs bg-muted px-2 py-0.5 rounded">Inativo</span>
                  )}
                </div>
                <p className="text-primary font-bold">{formatPrice(product.preco)}</p>
                <p className="text-sm text-muted-foreground">{product.tamanhos.join(", ")}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggleActive(product)}
                  title={product.ativo ? "Desativar" : "Ativar"}
                >
                  {product.ativo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditingProduct(product);
                    setShowForm(true);
                  }}
                  title="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteProduct(product)}
                  title="Excluir"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteProduct} onOpenChange={() => setDeleteProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteProduct?.nome}"? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
