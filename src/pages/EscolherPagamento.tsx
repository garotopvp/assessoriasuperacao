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

// Funções auxiliares
function parseAmountSafe(value: string | null): number {
  if (!value) return 149.97;
  let cleaned = value.replace(/[R$\s]/g, "");
  if (cleaned.includes(",")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  }
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 149.97 : parsed;
}

export default function EscolherPagamento() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);

  const planId = searchParams.get("planId") || "mensal";
  const baseAmount = useMemo(() => {
    const amountParam = searchParams.get("amount");
    const plan = plans.find((p) => p.id === planId);
    if (plan) return plan.preco;
    return parseAmountSafe(amountParam);
  }, [planId, searchParams]);
  const description = searchParams.get("description") || "Plano Mensal - Superação";

  // Calcular taxa do Stripe (3.99% + R$ 0.40)
  const stripeFee = baseAmount * 0.0399 + 0.4;
  const amountWithFee = baseAmount + stripeFee;

  const handlePixPayment = () => {
    if (!user) {
      toast.error("Faça login para continuar");
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
      toast.error("Faça login para continuar");
      navigate("/login");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      // Using invoke instead of fetch
      const { data, error } = await supabase.functions.invoke("create-stripe-subscription", {
        body: JSON.stringify({
          planId,
          userId: user.id,
          includeStripeFee: true,
          cancelUrl: window.location.href,
        }),
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json",
        },
      });

      if (error) {
        logger.error("Function invoke error:", error);
        let errorMessage = error.message;
        try {
          // Attempt to extract more info if available
          const body = JSON.parse(await error.context.json());
          if (body && body.error) errorMessage = body.error;
        } catch (e) {
          // Ignore
        }
        throw new Error(errorMessage || "Erro ao criar sessão de pagamento");
      }

      logger.info("Response data:", data);

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("URL de checkout não retornada");
      }
    } catch (error: unknown) {
      logger.error("Stripe error FULL:", error);
      const msg = error instanceof Error ? error.message : String(error);
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
          <h1 className="text-xl font-bold">Escolher Forma de Pagamento</h1>
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
              <p className="text-3xl font-bold">R$ {baseAmount.toFixed(2).replace(".", ",")}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* PIX - Sem Taxa */}
          <Card className="border-2 border-primary hover:shadow-lg transition-all cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <QrCode className="w-8 h-8 text-primary" />
                <div>
                  <CardTitle>PIX</CardTitle>
                  <CardDescription>Pagamento instantâneo</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-1">
                  ✨ Sem taxas adicionais!
                </p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                  R$ {baseAmount.toFixed(2).replace(".", ",")}
                </p>
              </div>

              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Confirmação instantânea</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>QR Code dentro do site</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Sem custo adicional</span>
                </li>
              </ul>

              <Button onClick={handlePixPayment} className="w-full h-12" disabled={loading}>
                <QrCode className="w-5 h-5 mr-2" />
                Pagar com PIX
              </Button>
            </CardContent>
          </Card>

          {/* Cartão de Crédito - Com Taxa */}
          <Card className="border-2 hover:shadow-lg transition-all cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CreditCard className="w-8 h-8" />
                <div>
                  <CardTitle>Cartão de Crédito</CardTitle>
                  <CardDescription>
                    {planId === "mensal"
                      ? "À vista"
                      : planId === "trimestral"
                        ? "Até 3x sem juros"
                        : planId === "semestral"
                          ? "Até 6x sem juros"
                          : planId === "anual"
                            ? "Até 12x sem juros"
                            : "Parcelamento disponível"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-2">Valor do plano:</p>
                <p className="text-lg line-through text-muted-foreground">
                  R$ {baseAmount.toFixed(2).replace(".", ",")}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  + Taxa de processamento: R$ {stripeFee.toFixed(2).replace(".", ",")}
                </p>
                <p className="text-2xl font-bold mt-2">
                  R$ {amountWithFee.toFixed(2).replace(".", ",")}
                </p>

                {/* Mostrar parcelamento se disponível */}
                {planId !== "mensal" && planId !== "plano_teste" && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2">💳 Opções de parcelamento:</p>
                    {planId === "trimestral" && (
                      <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                        3x de R$ {(amountWithFee / 3).toFixed(2).replace(".", ",")} sem juros
                      </p>
                    )}
                    {planId === "semestral" && (
                      <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                        6x de R$ {(amountWithFee / 6).toFixed(2).replace(".", ",")} sem juros
                      </p>
                    )}
                    {planId === "anual" && (
                      <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                        12x de R$ {(amountWithFee / 12).toFixed(2).replace(".", ",")} sem juros
                      </p>
                    )}
                  </div>
                )}
              </div>

              <ul className="space-y-2 text-sm">
                {planId !== "mensal" && planId !== "plano_teste" && (
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span className="font-semibold">
                      {planId === "trimestral" && "3x sem juros"}
                      {planId === "semestral" && "6x sem juros"}
                      {planId === "anual" && "12x sem juros"}
                    </span>
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  <span>Checkout seguro Stripe</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  <span>Aceita todos os cartões</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-500">⚠</span>
                  <span className="text-muted-foreground">Taxa de 3,99% + R$ 0,40</span>
                </li>
              </ul>

              <Button
                onClick={handleCardPayment}
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

        {/* Informações Adicionais */}
        <Card className="mt-6 bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <p className="text-sm text-center">
              <strong>💡 Dica:</strong> Escolha PIX para economizar{" "}
              <span className="font-bold text-primary">
                R$ {stripeFee.toFixed(2).replace(".", ",")}
              </span>{" "}
              em taxas de processamento!
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
