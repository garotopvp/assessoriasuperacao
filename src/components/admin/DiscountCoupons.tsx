import { useState } from "react";
import { useCoupons } from "@/hooks/useCoupons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Copy, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usePlans } from "@/hooks/usePlans"; // Import usePlans

export function DiscountCoupons() {
  const { coupons, loading, createCoupon, updateCoupon, deleteCoupon } = useCoupons();
  const { plans } = usePlans(); // Use hook
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: "",
    max_discount_amount: "",
    valid_until: "",
    max_uses: "",
    applicable_plans: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createCoupon({
        code: formData.code.toUpperCase(),
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        max_discount_amount: formData.max_discount_amount
          ? parseFloat(formData.max_discount_amount)
          : undefined,
        valid_until: formData.valid_until || null,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        applicable_plans: formData.applicable_plans.length > 0 ? formData.applicable_plans : null,
        active: true,
      });

      setIsDialogOpen(false);
      setFormData({
        code: "",
        discount_type: "percentage",
        discount_value: "",
        max_discount_amount: "",
        valid_until: "",
        max_uses: "",
        applicable_plans: [],
      });
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const copyLink = (code: string) => {
    const link = `${window.location.origin}/assessoria?cupom=${code}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado para a área de transferência!");
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    await updateCoupon(id, { active: !currentActive });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja deletar este cupom?")) {
      await deleteCoupon(id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black">CUPONS DE DESCONTO</h2>
          <p className="text-sm text-muted-foreground">
            Crie links personalizados com descontos para seus alunos
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Cupom
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Cupom</DialogTitle>
              <DialogDescription>
                Preencha os dados para criar um cupom de desconto personalizado
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Código do Cupom *</Label>
                  <Input
                    id="code"
                    placeholder="BEMVINDO20"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount_type">Tipo de Desconto *</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value: "percentage" | "fixed") =>
                      setFormData({ ...formData, discount_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                      <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount_value">
                    {formData.discount_type === "percentage" ? "Desconto (%)" : "Desconto (R$)"} *
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    step="0.01"
                    placeholder={formData.discount_type === "percentage" ? "20" : "50.00"}
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    required
                  />
                </div>

                {formData.discount_type === "percentage" && (
                  <div className="space-y-2">
                    <Label htmlFor="max_discount_amount">Desconto Máximo (R$)</Label>
                    <Input
                      id="max_discount_amount"
                      type="number"
                      step="0.01"
                      placeholder="100.00"
                      value={formData.max_discount_amount}
                      onChange={(e) =>
                        setFormData({ ...formData, max_discount_amount: e.target.value })
                      }
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valid_until">Válido Até</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_uses">Limite de Usos</Label>
                  <Input
                    id="max_uses"
                    type="number"
                    placeholder="50"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Planos Aplicáveis (deixe vazio para todos)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {plans.map((plan) => (
                    <label key={plan.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.applicable_plans.includes(plan.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              applicable_plans: [...formData.applicable_plans, plan.id],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              applicable_plans: formData.applicable_plans.filter(
                                (id) => id !== plan.id
                              ),
                            });
                          }
                        }}
                      />
                      <span className="text-sm">{plan.nome}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Criar Cupom</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {coupons.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nenhum cupom criado ainda.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Clique em "Novo Cupom" para criar seu primeiro cupom de desconto.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {coupons.map((coupon) => (
            <Card key={coupon.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl font-black">{coupon.code}</CardTitle>
                    <CardDescription>
                      {coupon.discount_type === "percentage"
                        ? `${coupon.discount_value}% de desconto`
                        : `R$ ${coupon.discount_value.toFixed(2)} de desconto`}
                    </CardDescription>
                  </div>
                  <Badge variant={coupon.active ? "default" : "secondary"}>
                    {coupon.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Usos</p>
                    <p className="font-medium">
                      {coupon.current_uses} / {coupon.max_uses || "∞"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Válido até</p>
                    <p className="font-medium">
                      {coupon.valid_until
                        ? format(new Date(coupon.valid_until), "dd/MM/yyyy", { locale: ptBR })
                        : "Sem limite"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tipo</p>
                    <p className="font-medium">
                      {coupon.discount_type === "percentage" ? "Porcentagem" : "Valor Fixo"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Planos</p>
                    <p className="font-medium">
                      {coupon.applicable_plans && coupon.applicable_plans.length > 0
                        ? coupon.applicable_plans.length
                        : "Todos"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => copyLink(coupon.code)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Link
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActive(coupon.id, coupon.active)}
                  >
                    {coupon.active ? (
                      <>
                        <ToggleLeft className="w-4 h-4 mr-2" />
                        Desativar
                      </>
                    ) : (
                      <>
                        <ToggleRight className="w-4 h-4 mr-2" />
                        Ativar
                      </>
                    )}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(coupon.id)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Deletar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
