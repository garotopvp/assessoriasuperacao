import { logger } from "@/lib/logger";
import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, QrCode, Loader2 } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { plans } from "@/data/plans";

function parseAmount(input: string | null, fallback = 149.97) {
  if (!input) return fallback;

  // Remove espaços e símbolo de moeda
  let cleaned = input.replace(/[R$\s]/g, "");

  // Se tiver vírgula, tratamos como formato brasileiro (1.234,56 ou 1234,56)
  if (cleaned.includes(",")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  }

  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : fallback;
}

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function roundToCents(n: number) {
  return Math.round(n * 100) / 100;
}

export default function EscolherPagamentoV2() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);

  const planId = searchParams.get("planId") || "mensal";
  const baseAmount = useMemo(() => {
    const amountParam = searchParams.get("amount");
    const plan = plans.find((p) => p.id === planId);
    if (plan) return plan.preco;
    return parseAmount(amountParam, 149.97);
  }, [planId, searchParams]);
  const description = searchParams.get("description") || "Plano Mensal - Superação";

  // Taxa Stripe: 3.99% + R$0.40
  const stripeFee = roundToCents(baseAmount * 0.0399 + 0.4);
  const amountWithFee = roundToCents(baseAmount + stripeFee);

  const ensureAuth = () => {
    if (!user) {
      toast.error("Faça login para continuar");
      navigate("/login");
      return false;
    }
    return true;
  };

  const handlePixPayment = () => {
    if (!ensureAuth()) return;

    const params = new URLSearchParams({
      planId,
      amount: String(baseAmount),
      description,
    });
    navigate(`/pagamento-openpix?${params.toString()}`);
  };

  const createStripeSubscription = async () => {
    if (!ensureAuth()) return;
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Usuário não autenticado");

      const body = JSON.stringify({
        planId,
        userId: user?.id,
        includeStripeFee: true,
        cancelUrl: window.location.href,
      });

      const { data, error } = await supabase.functions.invoke("create-stripe-subscription", {
        body,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json",
        },
      });

      if (error) {
        logger.error("Function invoke errored:", error);
        throw new Error((error as any)?.message || "Erro ao criar sessão de pagamento");
      }

      if (!data) throw new Error("Resposta inválida do servidor");
      if ((data as any).error) throw new Error((data as any).error);

      const url = (data as any).url;
      if (!url) throw new Error("URL de checkout não retornada");

      // Redireciona para checkout externo
      window.location.href = url;
    } catch (err: unknown) {
      logger.error("Erro criar assinatura:", err);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg || "Erro ao processar pagamento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Escolher Forma de Pagamento (v2)</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Detalhes do Plano</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Valor do plano</p>
              <p className="text-3xl font-bold">{formatBRL(baseAmount)}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-2 border-primary hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-center gap-3">
                <QrCode className="w-8 h-8 text-primary" />
                <div>
                  <CardTitle>PIX</CardTitle>
                  <CardDescription>Pagamento instantâneo sem taxas</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {formatBRL(baseAmount)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Confirmação imediata</p>
              </div>

              <Button onClick={handlePixPayment} className="w-full h-12" disabled={loading}>
                <QrCode className="w-5 h-5 mr-2" /> Pagar com PIX
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CreditCard className="w-8 h-8" />
                <div>
                  <CardTitle>Cartão de Crédito</CardTitle>
                  <CardDescription>Checkout seguro via Stripe</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-2">Valor do plano</p>
                <p className="text-lg line-through text-muted-foreground">
                  {formatBRL(baseAmount)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  + Taxa de processamento: {formatBRL(stripeFee)}
                </p>
                <p className="text-2xl font-bold mt-2">{formatBRL(amountWithFee)}</p>
              </div>

              <Button
                onClick={createStripeSubscription}
                variant="outline"
                className="w-full h-12"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <CreditCard className="w-5 h-5 mr-2" />
                )}
                Pagar com Cartão
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <p className="text-sm text-center">
              <strong>💡 Dica:</strong> Escolha PIX para economizar{" "}
              <span className="font-bold text-primary">{formatBRL(stripeFee)}</span> em taxas.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
