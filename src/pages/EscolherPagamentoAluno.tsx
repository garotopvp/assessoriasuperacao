import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CreditCard,
  QrCode,
  Loader2,
  Repeat,
  CreditCard as CardIcon,
} from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePlans } from "@/hooks/usePlans";

// Funções auxiliares
function parseAmountSafe(value: string | null): number {
  if (!value) return 149.97;
  let cleaned = value.replace(/[R$\s]/g, "");
  if (cleaned.includes(",")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  }
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return 149.97;
  return parsed;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function calculateStripeFee(amount: number): number {
  return Math.round((amount * 0.0399 + 0.4) * 100) / 100;
}

export default function EscolherPagamentoAluno() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"recurring" | "one-time">("recurring");

  const { plans, loading: loadingPlans } = usePlans();

  const planId = searchParams.get("planId") || "mensal";

  const baseAmount = useMemo(() => {
    if (loadingPlans) return 0;
    const amountFromUrl = searchParams.get("amount");
    const plan = plans.find((p) => p.id === planId);
    if (plan) {
      return plan.preco;
    }
    return parseAmountSafe(amountFromUrl);
  }, [planId, searchParams, plans, loadingPlans]);

  const description = searchParams.get("description") || "Renovação / Pagamento da Assessoria";

  const stripeFee = calculateStripeFee(baseAmount);
  const totalWithFee = baseAmount + stripeFee;

  const handlePixPayment = () => {
    if (!user) {
      toast.error("Você precisa estar logado para continuar");
      navigate("/login");
      return;
    }

    const params = new URLSearchParams({
      planId,
      amount: baseAmount.toString(),
      description,
    });

    navigate(`/pagamento-openpix?${params.toString()}`);
  };

  const handleCardPayment = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para continuar");
      navigate("/login");
      return;
    }

    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        throw new Error("Sessão não encontrada. Faça login novamente.");
      }

      const { data, error } = await supabase.functions.invoke("create-stripe-subscription", {
        body: {
          planId,
          userId: user.id,
          includeStripeFee: true,
          cancelUrl: window.location.href,
          isRecurring: paymentMode === "recurring",
        },
      });

      if (error) {
        console.error("Erro na função:", error);
        throw new Error("Erro ao criar sessão de pagamento");
      }

      if (!data || !data.url) {
        throw new Error("URL de checkout não foi retornada");
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("Erro ao processar pagamento:", err);
      const message = err instanceof Error ? err.message : "Erro ao processar pagamento";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingPlans) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Pagamento Aluno</h1>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Renove ou pague sua Assessoria</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6 bg-muted rounded-lg border-2 border-primary/20 bg-primary/5">
              <p className="text-sm text-foreground mb-1 font-medium">
                Bem-vindo(a) de volta! Finalize seu pagamento para continuar usufruindo de todo
                acompanhamento.
              </p>
              <p className="text-sm text-muted-foreground mb-4">Valor total:</p>
              <p className="text-4xl font-bold text-primary">{formatCurrency(baseAmount)}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-2 border-primary hover:shadow-xl transition-all">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <QrCode className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>PIX</CardTitle>
                  <CardDescription>Pagamento instantâneo mensal</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                <p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">
                  ✨ Sem taxas adicionais
                </p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                  {formatCurrency(baseAmount)}
                </p>
              </div>

              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Confirmação instantânea</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Opção de pagar mês a mês no PIX</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Sem custo extra (desconto de R$ {stripeFee.toFixed(2)})</span>
                </li>
              </ul>

              <Button
                onClick={handlePixPayment}
                className="w-full h-12"
                size="lg"
                disabled={loading}
              >
                <QrCode className="w-5 h-5 mr-2" />
                Gerar PIX
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-xl transition-all flex flex-col justify-between">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle>Cartão de Crédito</CardTitle>
                  <CardDescription>Opção Assinatura ou Avulso</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground">
                  Como deseja pagar no cartão?
                </label>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => setPaymentMode("recurring")}
                    className={`flex items-start text-left gap-3 p-3 rounded-lg border-2 transition-all ${paymentMode === "recurring" ? "border-primary bg-primary/5" : "border-border bg-card"}`}
                  >
                    <Repeat
                      className={`w-5 h-5 shrink-0 mt-0.5 ${paymentMode === "recurring" ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <div>
                      <p
                        className={`font-semibold text-sm ${paymentMode === "recurring" ? "text-primary" : ""}`}
                      >
                        Assinatura Recorrente
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Cobrança automática todo mês no seu cartão. Cancele quando quiser.
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentMode("one-time")}
                    className={`flex items-start text-left gap-3 p-3 rounded-lg border-2 transition-all ${paymentMode === "one-time" ? "border-primary bg-primary/5" : "border-border bg-card"}`}
                  >
                    <CardIcon
                      className={`w-5 h-5 shrink-0 mt-0.5 ${paymentMode === "one-time" ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <div>
                      <p
                        className={`font-semibold text-sm ${paymentMode === "one-time" ? "text-primary" : ""}`}
                      >
                        Pagamento Avulso (1 Mês)
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Cobrança única de 1 ciclo. Não renova automaticamente.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="bg-muted rounded-lg p-4 mt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Valor do plano:</span>
                    <span>{formatCurrency(baseAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa processamento:</span>
                    <span>+ {formatCurrency(stripeFee)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Total {paymentMode === "recurring" ? "por mês" : ""}:</span>
                    <span className="text-2xl">{formatCurrency(totalWithFee)}</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleCardPayment}
                variant="outline"
                className="w-full h-12"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Pagar no Cartão
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
