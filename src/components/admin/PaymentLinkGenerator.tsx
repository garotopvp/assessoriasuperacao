import { logger } from "@/lib/logger";
import { createSystemLog } from "@/utils/logger";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Link as LinkIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { usePlans } from "@/hooks/usePlans"; // Use hook instead of static import
import { supabase } from "@/integrations/supabase/client";

export function PaymentLinkGenerator() {
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("custom");
  const [customAmount, setCustomAmount] = useState("");
  const [description, setDescription] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");

  const { plans, loading: loadingPlans } = usePlans(); // Load plans

  const generateLink = async () => {
    if (!studentName.trim()) {
      toast.error("Digite o nome do aluno");
      return;
    }

    if (!studentEmail.trim()) {
      toast.error("Digite o email do aluno");
      return;
    }

    // Se selecionou um plano, usar o valor do plano
    let amount = customAmount;
    let planName = description;

    if (selectedPlan && selectedPlan !== "custom") {
      const plan = plans.find((p) => p.id === selectedPlan);
      if (plan) {
        amount = plan.preco.toString();
        planName = `Mensalidade - Plano ${plan.nome}`;
      }
    } else if (!customAmount || parseFloat(customAmount) <= 0) {
      toast.error("Digite um valor válido ou selecione um plano");
      return;
    }

    setGeneratedLink("Criando assinatura...");

    try {
      // Chamar Edge Function para criar assinatura
      console.log("Chamando create-subscription...", {
        studentName,
        studentEmail,
        studentPhone,
        planId: selectedPlan || "custom",
        amount: parseFloat(amount),
      });

      const { data, error } = await supabase.functions.invoke("create-subscription", {
        body: {
          studentName,
          studentEmail,
          studentPhone,
          planId: selectedPlan || "custom",
          planName,
          amount: parseFloat(amount),
        },
      });

      if (error) {
        logger.error("Erro Supabase Function:", error);
        throw error;
      }

      logger.info("Resposta create-subscription:", data);

      if (data?.paymentLink) {
        setGeneratedLink(data.paymentLink);
        toast.success("Assinatura criada! Link de pagamento gerado.");

        await createSystemLog({
          action: "generate_payment_link",
          category: "payment",
          level: "info",
          message: `Um link de pagamento ($${amount}) foi gerado manualmente para ${studentName}`,
          details: { studentEmail, planId: selectedPlan, amount },
        });
      } else {
        throw new Error("Link de pagamento não foi retornado");
      }
    } catch (error: any) {
      logger.error("Erro ao criar assinatura:", error);
      toast.error(error.message || "Erro ao criar assinatura");
      setGeneratedLink("");

      await createSystemLog({
        action: "payment_link_error",
        category: "payment",
        level: "warning",
        message: `Falha ao tentar gerar link de pagamento para ${studentName}.`,
        details: { error: error.message, studentEmail },
      });
    }
  };

  const copyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      toast.success("Link copiado para a área de transferência!");
    }
  };

  const handlePlanChange = (planId: string) => {
    setSelectedPlan(planId);
    if (planId && planId !== "custom") {
      const plan = plans.find((p) => p.id === planId);
      if (plan) {
        setCustomAmount(plan.preco.toString());
        setDescription(`Mensalidade - Plano ${plan.nome}`);
      }
    } else {
      setCustomAmount("");
      setDescription("");
    }
  };

  // Debug: verificar se o componente está renderizando
  logger.info("PaymentLinkGenerator renderizado", { plansCount: plans?.length });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black">GERAR LINK DE PAGAMENTO RECORRENTE</h2>
        <p className="text-sm text-muted-foreground">
          Crie links de pagamento personalizados para mensalidades recorrentes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo Link de Pagamento</CardTitle>
          <CardDescription>Preencha os dados do aluno e selecione o plano</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dados do Aluno */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold text-sm">Dados do Aluno</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="studentName">Nome Completo *</Label>
                <Input
                  id="studentName"
                  placeholder="João Silva"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentEmail">Email *</Label>
                <Input
                  id="studentEmail"
                  type="email"
                  placeholder="joao@email.com"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentPhone">Telefone</Label>
                <Input
                  id="studentPhone"
                  placeholder="(11) 99999-9999"
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Plano */}
          <div className="space-y-2">
            <Label htmlFor="plan">Plano de Assinatura</Label>
            {loadingPlans ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Carregando planos...
              </div>
            ) : (
              <Select value={selectedPlan} onValueChange={handlePlanChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um plano ou escolha valor customizado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Valor Customizado</SelectItem>
                  {plans && plans.length > 0 ? (
                    plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.nome} - R$ {plan.precoMensal}/mês
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      Nenhum plano disponível
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Valor e Descrição */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor Mensal (R$) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="100.00"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                disabled={selectedPlan && selectedPlan !== "custom"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                placeholder="Mensalidade"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={selectedPlan && selectedPlan !== "custom"}
              />
            </div>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              💡 <strong>Cobrança Recorrente:</strong> Este link criará uma assinatura mensal
              automática. O aluno será cobrado todo mês até cancelar.
            </p>
          </div>

          <Button onClick={generateLink} className="w-full">
            <LinkIcon className="w-4 h-4 mr-2" />
            Gerar Link de Pagamento Recorrente
          </Button>

          {generatedLink && (
            <div className="space-y-2 p-4 bg-muted rounded-lg">
              <Label>Link Gerado:</Label>
              <div className="flex gap-2">
                <Input value={generatedLink} readOnly className="font-mono text-xs" />
                <Button size="icon" variant="outline" onClick={copyLink}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>
                  📧 <strong>Aluno:</strong> {studentName} ({studentEmail})
                </p>
                <p>
                  💰 <strong>Valor:</strong> R$ {parseFloat(customAmount).toFixed(2)}/mês
                </p>
                <p>
                  📋 <strong>Plano:</strong> {description || "Customizado"}
                </p>
                <p className="text-blue-600 dark:text-blue-400 font-medium">
                  🔄 Cobrança recorrente mensal ativada
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Como Funciona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. Preencha o nome e email do aluno</p>
          <p>2. Selecione um plano existente ou defina um valor customizado</p>
          <p>3. Clique em "Gerar Link de Pagamento Recorrente"</p>
          <p>4. Copie e envie o link para o aluno</p>
          <p>5. O aluno será direcionado para o pagamento via Abacate Pay</p>
          <p className="font-semibold text-foreground">
            ⚠️ Importante: A cobrança será recorrente (mensal) até o aluno cancelar a assinatura
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
