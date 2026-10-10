import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
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
import { Plus, Trash2, TrendingUp, Users, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Funnel {
  id: string;
  name: string;
  description?: string;
  trigger_event: string;
  is_active: boolean;
  steps?: FunnelStep[];
  enrollments_count?: number;
}

interface FunnelStep {
  id: string;
  funnel_id: string;
  step_order: number;
  delay_days: number;
  message: string;
}

export function SalesFunnelManager() {
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerEvent, setTriggerEvent] = useState("NEW_TRIAL");
  const [steps, setSteps] = useState<{ delay_days: number; message: string }[]>([
    { delay_days: 0, message: "" },
  ]);

  useEffect(() => {
    fetchFunnels();
  }, []);

  const fetchFunnels = async () => {
    const { data } = await supabase
      .from("sales_funnels")
      .select(
        `
        *,
        steps:funnel_steps(*)
      `
      )
      .order("created_at", { ascending: false });

    // Buscar contagem de inscrições
    if (data) {
      const funnelsWithCounts = await Promise.all(
        data.map(async (funnel) => {
          const { count } = await supabase
            .from("funnel_enrollments")
            .select("*", { count: "exact", head: true })
            .eq("funnel_id", funnel.id)
            .eq("status", "ACTIVE");
          return { ...funnel, enrollments_count: count || 0 };
        })
      );
      setFunnels(funnelsWithCounts);
    }
  };

  const createFunnel = async () => {
    if (!name || steps.some((s) => !s.message)) {
      toast.error("Preencha todos os campos");
      return;
    }

    const { data: funnel, error: funnelError } = await supabase
      .from("sales_funnels")
      .insert([{ name, description, trigger_event, is_active: true }])
      .select()
      .single();

    if (funnelError) {
      toast.error("Erro ao criar funil");
      return;
    }

    const stepsData = steps.map((step, index) => ({
      funnel_id: funnel.id,
      step_order: index + 1,
      delay_days: step.delay_days,
      message: step.message,
    }));

    const { error: stepsError } = await supabase.from("funnel_steps").insert(stepsData);

    if (stepsError) {
      toast.error("Erro ao criar etapas");
    } else {
      toast.success("Funil criado com sucesso!");
      setShowDialog(false);
      resetForm();
      fetchFunnels();
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setTriggerEvent("NEW_TRIAL");
    setSteps([{ delay_days: 0, message: "" }]);
  };

  const addStep = () => {
    setSteps([...steps, { delay_days: 0, message: "" }]);
  };

  const updateStep = (index: number, field: "delay_days" | "message", value: any) => {
    const newSteps = [...steps];
    newSteps[index][field] = value;
    setSteps(newSteps);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await supabase.from("sales_funnels").update({ is_active: !isActive }).eq("id", id);
    fetchFunnels();
    toast.success(isActive ? "Funil desativado" : "Funil ativado");
  };

  const deleteFunnel = async (id: string) => {
    if (!confirm("Excluir este funil? Todas as inscrições serão canceladas.")) return;
    await supabase.from("sales_funnels").delete().eq("id", id);
    toast.success("Funil excluído!");
    fetchFunnels();
  };

  const getTriggerLabel = (trigger: string) => {
    const labels: Record<string, string> = {
      NEW_TRIAL: "Novo Trial",
      INACTIVE_7_DAYS: "Inativo 7 dias",
      INACTIVE_14_DAYS: "Inativo 14 dias",
      TRIAL_ENDING: "Trial Terminando",
      SUBSCRIPTION_CANCELLED: "Assinatura Cancelada",
    };
    return labels[trigger] || trigger;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Funis de Vendas</h2>
          <p className="text-muted-foreground">Automatize sequências de mensagens para conversão</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Funil
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Funil de Vendas</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Nome do Funil</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Conversão Trial → Assinante"
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>
              <div>
                <Label>Gatilho</Label>
                <Select value={triggerEvent} onValueChange={setTriggerEvent}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW_TRIAL">Novo Trial</SelectItem>
                    <SelectItem value="INACTIVE_7_DAYS">Inativo 7 dias</SelectItem>
                    <SelectItem value="INACTIVE_14_DAYS">Inativo 14 dias</SelectItem>
                    <SelectItem value="TRIAL_ENDING">Trial Terminando</SelectItem>
                    <SelectItem value="SUBSCRIPTION_CANCELLED">Assinatura Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Etapas do Funil</Label>
                  <Button variant="outline" size="sm" onClick={addStep}>
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar Etapa
                  </Button>
                </div>
                <div className="space-y-4">
                  {steps.map((step, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-4">
                          <Badge className="mt-2">{index + 1}</Badge>
                          <div className="flex-1 space-y-3">
                            <div>
                              <Label className="text-xs">Aguardar (dias)</Label>
                              <Input
                                type="number"
                                min="0"
                                value={step.delay_days}
                                onChange={(e) =>
                                  updateStep(index, "delay_days", parseInt(e.target.value) || 0)
                                }
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Mensagem</Label>
                              <Textarea
                                value={step.message}
                                onChange={(e) => updateStep(index, "message", e.target.value)}
                                rows={3}
                                placeholder="Digite a mensagem desta etapa..."
                              />
                            </div>
                          </div>
                          {steps.length > 1 && (
                            <Button variant="outline" size="icon" onClick={() => removeStep(index)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={createFunnel}>Criar Funil</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {funnels.map((funnel) => (
          <Card key={funnel.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle>{funnel.name}</CardTitle>
                    {funnel.is_active ? (
                      <Badge className="bg-green-500">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="outline">Inativo</Badge>
                    )}
                    <Badge variant="outline">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {getTriggerLabel(funnel.trigger_event)}
                    </Badge>
                  </div>
                  {funnel.description && <CardDescription>{funnel.description}</CardDescription>}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(funnel.id, funnel.is_active)}
                  >
                    {funnel.is_active ? "Desativar" : "Ativar"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => deleteFunnel(funnel.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{funnel.enrollments_count || 0} pessoas no funil</span>
                </div>
                {funnel.steps && funnel.steps.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Etapas:</p>
                    {funnel.steps
                      .sort((a, b) => a.step_order - b.step_order)
                      .map((step) => (
                        <div
                          key={step.id}
                          className="flex items-start gap-2 text-sm pl-4 border-l-2 border-muted"
                        >
                          <Badge variant="outline" className="mt-0.5">
                            {step.step_order}
                          </Badge>
                          <div className="flex-1">
                            <p className="text-muted-foreground">Dia {step.delay_days}</p>
                            <p className="line-clamp-2">{step.message}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
