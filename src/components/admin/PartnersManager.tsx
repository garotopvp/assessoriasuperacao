import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit2, Link, Save, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Partner {
  id: string;
  name: string;
  description: string;
  category: string;
  discount: string;
  code?: string;
  url?: string;
  image_url?: string;
  active: boolean;
  position: number;
}

const CATEGORIES = ["Equipamentos", "Saúde", "Nutrição", "Provas", "Serviços", "Outros"];

export function PartnersManager() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Partner>>({
    active: true,
    category: "Outros",
  });

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .order("position", { ascending: true });

      if (error) throw error;
      setPartners(data || []);
    } catch (error) {
      console.error("Error fetching partners:", error);
      toast.error("Erro ao carregar parceiros");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.name || !formData.discount) {
        toast.error("Nome e Desconto são obrigatórios");
        return;
      }

      if (formData.id) {
        // Update
        const { error } = await supabase.from("partners").update(formData).eq("id", formData.id);
        if (error) throw error;
        toast.success("Parceiro atualizado!");
      } else {
        // Create
        const { error } = await supabase.from("partners").insert([formData as any]);
        if (error) throw error;
        toast.success("Parceiro criado!");
      }

      setIsDialogOpen(false);
      setFormData({ active: true, category: "Outros" });
      fetchPartners();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar parceiro");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este parceiro?")) return;
    try {
      const { error } = await supabase.from("partners").delete().eq("id", id);
      if (error) throw error;
      toast.success("Parceiro removido");
      fetchPartners();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao remover parceiro");
    }
  };

  const handleEdit = (partner: Partner) => {
    setFormData(partner);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Clube de Parceiros</h2>
          <p className="text-muted-foreground">
            Gerencie os benefícios e descontos para os alunos.
          </p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setFormData({ active: true, category: "Outros" });
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Novo Parceiro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{formData.id ? "Editar Parceiro" : "Novo Parceiro"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome da Empresa</Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Centauro"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(val) => setFormData({ ...formData, category: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="discount">Desconto/Benefício</Label>
                  <Input
                    id="discount"
                    value={formData.discount || ""}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    placeholder="Ex: 15% OFF"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Descrição Curta</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Desconto válido para todo o site..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="code">Cupom (Opcional)</Label>
                  <Input
                    id="code"
                    value={formData.code || ""}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="BORACORRER15"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="url">Link (Opcional)</Label>
                  <Input
                    id="url"
                    value={formData.url || ""}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <Label htmlFor="active">Parceiro Ativo?</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" /> Salvar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {partners.map((partner) => (
          <Card key={partner.id} className={!partner.active ? "opacity-60 grayscale" : ""}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <Badge variant="secondary" className="mb-2">
                    {partner.category}
                  </Badge>
                  <CardTitle className="text-lg">{partner.name}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => handleEdit(partner)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-500 hover:text-red-600"
                    onClick={() => handleDelete(partner.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription className="line-clamp-2 min-h-[40px]">
                {partner.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-3 rounded-lg flex flex-col items-center justify-center text-center gap-2">
                <span className="font-bold text-xl text-primary">{partner.discount}</span>
                {partner.code ? (
                  <code className="bg-background px-2 py-1 rounded border text-sm font-mono break-all">
                    {partner.code}
                  </code>
                ) : (
                  <span className="text-xs text-muted-foreground">Desconto automático no link</span>
                )}
              </div>
              {partner.url && (
                <Button variant="link" className="w-full mt-2" asChild>
                  <a href={partner.url} target="_blank" rel="noopener noreferrer">
                    Acessar Site <ExternalLink className="ml-2 h-3 w-3" />
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
        {!loading && partners.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Nenhum parceiro cadastrado.
          </div>
        )}
      </div>
    </div>
  );
}
