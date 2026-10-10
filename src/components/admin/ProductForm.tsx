import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { X, Plus, ImagePlus } from "lucide-react";
import { ImageUpload } from "@/components/ui/file-upload";
import { DEFAULT_SIZES, sortSizes } from "@/lib/sizes";

export interface ProductFormData {
  nome: string;
  preco: number;
  descricao: string;
  detalhes: string;
  tamanhos: string[];
  imagem_principal: string;
  imagens: string[];
  ativo: boolean;
  ordem: number;
  estoque: Record<string, number>;
}

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function ProductForm({ initialData, onSubmit, onCancel, isSubmitting }: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    nome: initialData?.nome || "",
    preco: initialData?.preco || 0,
    descricao: initialData?.descricao || "",
    detalhes: initialData?.detalhes || "",
    tamanhos: initialData?.tamanhos || ["P", "M", "G", "GG"],
    imagem_principal: initialData?.imagem_principal || "",
    imagens: initialData?.imagens || [],
    ativo: initialData?.ativo ?? true,
    ordem: initialData?.ordem || 0,
    estoque: initialData?.estoque || {},
  });

  const [newImageUrl, setNewImageUrl] = useState("");

  const handleSizeToggle = (size: string) => {
    setFormData((prev) => {
      const newTamanhos = prev.tamanhos.includes(size)
        ? prev.tamanhos.filter((s) => s !== size)
        : [...prev.tamanhos, size];

      // Update estoque when sizes change
      const newEstoque = { ...prev.estoque };
      if (!prev.tamanhos.includes(size)) {
        // Adding size - set default stock
        newEstoque[size] = 10;
      }
      // Note: we don't remove stock when removing size to preserve data

      return {
        ...prev,
        tamanhos: newTamanhos,
        estoque: newEstoque,
      };
    });
  };

  const handleStockChange = (size: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      estoque: {
        ...prev.estoque,
        [size]: Math.max(0, value),
      },
    }));
  };

  const handleAddImage = () => {
    if (newImageUrl.trim() && !formData.imagens.includes(newImageUrl.trim())) {
      setFormData((prev) => ({
        ...prev,
        imagens: [...prev.imagens, newImageUrl.trim()],
      }));
      setNewImageUrl("");
    }
  };

  const handleRemoveImage = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      imagens: prev.imagens.filter((img) => img !== url),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Converter quebras de linha em tags <br> nos detalhes
    const detalhesComHTML = formData.detalhes
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => line.trim())
      .join("<br>\n");

    await onSubmit({
      ...formData,
      detalhes: detalhesComHTML,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome do Produto *</Label>
          <Input
            id="nome"
            value={formData.nome}
            onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
            placeholder="Ex: Regata Basic Run"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="preco">Preço (R$) *</Label>
          <Input
            id="preco"
            type="number"
            step="0.01"
            min="0"
            value={formData.preco}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, preco: parseFloat(e.target.value) || 0 }))
            }
            placeholder="100.00"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição Curta</Label>
        <Input
          id="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
          placeholder="Uma breve descrição do produto"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="detalhes">Destaques da peça</Label>
        <Textarea
          id="detalhes"
          value={formData.detalhes}
          onChange={(e) => setFormData((prev) => ({ ...prev, detalhes: e.target.value }))}
          placeholder="Digite cada destaque em uma linha separada&#10;Exemplo:&#10;Proteção Solar UV 50+&#10;Tecido respirável&#10;Corte premium"
          rows={5}
        />
        <p className="text-xs text-muted-foreground">
          💡 Dica: Cada linha vira um tópico automaticamente. Não precisa adicionar HTML!
        </p>
      </div>

      {/* Sizes */}
      <div className="space-y-2">
        <Label>Tamanhos Disponíveis</Label>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => handleSizeToggle(size)}
              className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                formData.tamanhos.includes(size)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:border-primary/50"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Stock per Size */}
      {formData.tamanhos.length > 0 && (
        <div className="space-y-2">
          <Label>Estoque por Tamanho</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {formData.tamanhos
              .sort((a, b) => DEFAULT_SIZES.indexOf(a) - DEFAULT_SIZES.indexOf(b))
              .map((size) => (
                <div key={size} className="flex items-center gap-2">
                  <span className="w-10 text-sm font-medium">{size}:</span>
                  <Input
                    type="number"
                    min="0"
                    value={formData.estoque[size] ?? 0}
                    onChange={(e) => handleStockChange(size, parseInt(e.target.value) || 0)}
                    className="w-20"
                  />
                </div>
              ))}
          </div>
          <p className="text-xs text-muted-foreground">
            O estoque será decrementado automaticamente quando um pedido for confirmado.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="imagem_principal">Imagem Principal (URL)</Label>
        <div className="flex gap-2">
          <Input
            id="imagem_principal"
            value={formData.imagem_principal}
            onChange={(e) => setFormData((prev) => ({ ...prev, imagem_principal: e.target.value }))}
            placeholder="https://exemplo.com/imagem.jpg ou /images/products/produto.png"
            className="flex-1"
          />
          <ImageUpload
            onUpload={(url) => setFormData((prev) => ({ ...prev, imagem_principal: url }))}
            disabled={isSubmitting}
          />
        </div>
        {formData.imagem_principal && (
          <div className="mt-2 w-24 h-24 rounded-lg overflow-hidden bg-muted relative group">
            <img
              src={formData.imagem_principal}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, imagem_principal: "" }))}
              className="absolute top-1 right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remover imagem principal"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Additional Images */}
      <div className="space-y-2">
        <Label>Imagens Adicionais</Label>
        <div className="flex gap-2">
          <Input
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            placeholder="URL da imagem adicional"
            className="flex-1"
          />
          <ImageUpload
            onUpload={(url) => {
              if (formData.imagens.includes(url)) return;
              setFormData((prev) => ({
                ...prev,
                imagens: [...prev.imagens, url],
              }));
            }}
            disabled={isSubmitting}
          />
          <Button type="button" variant="outline" onClick={handleAddImage}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {formData.imagens.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.imagens.map((url, index) => (
              <div key={index} className="relative group">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted">
                  <img
                    src={url}
                    alt={`Imagem ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveImage(url)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Remover imagem ${index + 1}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch
            id="ativo"
            checked={formData.ativo}
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, ativo: checked }))}
          />
          <Label htmlFor="ativo">Produto Ativo</Label>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="ordem">Ordem:</Label>
          <Input
            id="ordem"
            type="number"
            min="0"
            value={formData.ordem}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, ordem: parseInt(e.target.value) || 0 }))
            }
            className="w-20"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "Salvando..." : "Salvar Produto"}
        </Button>
      </div>
    </form>
  );
}
