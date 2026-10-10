import { useState } from "react";
import { usePlans } from "@/hooks/usePlans";
import { Plan } from "@/types/product";
import { plans as defaultPlans } from "@/data/plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash, GripVertical, Check, X, Download } from "lucide-react";
import { toast } from "sonner";

export function PlansManager() {
  const { plans, loading, fetchPlans, createPlan, updatePlan, deletePlan } = usePlans();
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Plan> & { featuresStr?: string }>({});

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      ...plan,
      featuresStr: plan.features.join("\n"),
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingPlan(null);
    setFormData({
      id: "",
      nome: "",
      preco: 0,
      precoMensal: "",
      descricao: "",
      economia: "",
      features: [],
      featuresStr: "",
      destaque: false,
      hidden: false,
      cta: "ASSINAR AGORA",
    });
    setIsDialogOpen(true);
  };

  const handleImportDefaults = async () => {
    if (
      confirm(
        "Deseja importar os planos padrão do sistema? Isso atualizará planos existentes e criará os que faltam."
      )
    ) {
      try {
        let count = 0;
        for (const plan of defaultPlans) {
          await createPlan(plan);
          count++;
        }
        toast.success(`${count} planos importados/atualizados com sucesso!`);
        await fetchPlans();
      } catch (error) {
        console.error(error);
        toast.error(
          "Erro ao importar planos. Verifique se as migrações do banco de dados foram aplicadas."
        );
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const features = formData.featuresStr
        ? formData.featuresStr.split("\n").filter((f) => f.trim() !== "")
        : [];

      const planData = {
        ...formData,
        features,
        preco: Number(formData.preco),
      };

      if (editingPlan) {
        await updatePlan(editingPlan.id, planData);
      } else {
        if (!formData.id) {
          toast.error("ID do plano é obrigatório");
          return;
        }
        await createPlan(planData as any);
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este plano?")) {
      await deletePlan(id);
    }
  };

  if (loading) return <div>Carregando planos...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Planos</h2>
          <p className="text-muted-foreground">
            Edite os preços e detalhes dos planos de assinatura.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImportDefaults}>
            <Download className="w-4 h-4 mr-2" />
            Importar Padrões
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Plano
          </Button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Preço Total</TableHead>
                <TableHead>Mensal (Display)</TableHead>
                <TableHead>Economia</TableHead>
                <TableHead>Destaque</TableHead>
                <TableHead>Visível</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-mono text-xs">{plan.id}</TableCell>
                  <TableCell className="font-medium">{plan.nome}</TableCell>
                  <TableCell>R$ {plan.preco?.toFixed(2)}</TableCell>
                  <TableCell>R$ {plan.precoMensal}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {plan.economia || "-"}
                  </TableCell>
                  <TableCell>
                    {plan.destaque ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <X className="w-4 h-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell>
                    {!plan.hidden ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <X className="w-4 h-4 text-red-500" />
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2 whitespace-nowrap">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(plan)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDelete(plan.id)}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Editar Plano" : "Novo Plano"}</DialogTitle>
            <DialogDescription>Preencha os detalhes do plano abaixo.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="id">ID (Slug)</Label>
                <Input
                  id="id"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  disabled={!!editingPlan} // Não permite editar ID de plano existente
                  placeholder="ex: anual, mensal"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Plano</Label>
                <Input
                  id="nome"
                  value={formData.nome || ""}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="ex: ANUAL"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preco">Preço Total (R$)</Label>
                <Input
                  id="preco"
                  type="number"
                  step="0.01"
                  value={formData.preco}
                  onChange={(e) => setFormData({ ...formData, preco: parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="precoMensal">Preço Mensal (Texto Display)</Label>
                <Input
                  id="precoMensal"
                  value={formData.precoMensal || ""}
                  onChange={(e) => setFormData({ ...formData, precoMensal: e.target.value })}
                  placeholder="ex: 109,90"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="economia">Texto de Economia (Opcional)</Label>
                <Input
                  id="economia"
                  value={formData.economia || ""}
                  onChange={(e) => setFormData({ ...formData, economia: e.target.value })}
                  placeholder="ex: Economize 27%"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cta">Texto do Botão (CTA)</Label>
                <Input
                  id="cta"
                  value={formData.cta || ""}
                  onChange={(e) => setFormData({ ...formData, cta: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                value={formData.descricao || ""}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">Benefícios (um por linha)</Label>
              <Textarea
                id="features"
                rows={5}
                value={formData.featuresStr || ""}
                onChange={(e) => setFormData({ ...formData, featuresStr: e.target.value })}
                placeholder="Acesso ao app..."
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center space-x-2">
                <Switch
                  id="destaque"
                  checked={formData.destaque}
                  onCheckedChange={(c) => setFormData({ ...formData, destaque: c })}
                />
                <Label htmlFor="destaque">Plano em Destaque?</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="hidden"
                  checked={formData.hidden}
                  onCheckedChange={(c) => setFormData({ ...formData, hidden: c })}
                />
                <Label htmlFor="hidden">Ocultar Plano?</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Alterações</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
