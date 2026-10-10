import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, CreditCard, QrCode, Loader2, TicketPercent } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCoupons } from "@/hooks/useCoupons";
import { usePlans } from "@/hooks/usePlans"; // Import updated hook
import { DiscountCoupon } from "@/types/product";

// Funções auxiliares
function parseAmountSafe(value: string | null): number {
  if (!value) return 149.97; // Valor padrão mensal caso falhe
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
  // Stripe fee logic: 3.99% + R$ 0.40
  return Math.round((amount * 0.0399 + 0.4) * 100) / 100;
}

export default function EscolherPagamentoNova() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);

  // Hooks de dados
  const { validateCoupon } = useCoupons();
  const { plans, loading: loadingPlans } = usePlans(); // Use hook

  // Coupon State
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<DiscountCoupon | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Parse params
  const planId = searchParams.get("planId") || "mensal";

  // Determina o valor base do plano
  const baseAmount = useMemo(() => {
    if (loadingPlans) return 0; // Se estiver carregando, retorna 0
    const amountFromUrl = searchParams.get("amount");
    const plan = plans.find((p) => p.id === planId);
    if (plan) {
      return plan.preco;
    }
    return parseAmountSafe(amountFromUrl);
  }, [planId, searchParams, plans, loadingPlans]);

  const description = searchParams.get("description") || "Plano - Superação";

  // Cálculos de desconto
  const discountAmount = appliedCoupon
    ? appliedCoupon.discount_type === "percentage"
      ? (baseAmount * appliedCoupon.discount_value) / 100
      : appliedCoupon.discount_value
    : 0;

  // Ensure discount doesn't exceed total
  const finalDiscount = Math.min(discountAmount, baseAmount);

  // Cap percentage discount if needed
  const cappedDiscount =
    appliedCoupon?.discount_type === "percentage" && appliedCoupon.max_discount_amount
      ? Math.min(finalDiscount, appliedCoupon.max_discount_amount)
      : finalDiscount;

  const finalBaseAmount = Math.max(0, baseAmount - cappedDiscount);

  // Cálculos finais com taxas
  const stripeFee = calculateStripeFee(finalBaseAmount);
  const totalWithFee = finalBaseAmount + stripeFee;

  // Handlers
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setValidatingCoupon(true);
    try {
      const coupon = await validateCoupon(couponCode);
      if (coupon) {
        // Verificar se o cupom é aplicável a este plano
        if (
          coupon.applicable_plans &&
          coupon.applicable_plans.length > 0 &&
          !coupon.applicable_plans.includes(planId)
        ) {
          toast.error("Este cupom não é válido para este plano.");
          setAppliedCoupon(null);
        } else {
          setAppliedCoupon(coupon);
          toast.success("Cupom aplicado com sucesso!");
        }
      } else {
        setAppliedCoupon(null);
      }
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  const handlePixPayment = () => {
    if (!user) {
      toast.error("Você precisa estar logado para continuar");
      navigate("/login");
      return;
    }

    const params = new URLSearchParams({
      planId,
      amount: finalBaseAmount.toString(), // Pass updated amount with discount
      description: appliedCoupon ? `${description} (Cupom: ${appliedCoupon.code})` : description,
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
          couponCode: appliedCoupon?.code, // Pass coupon code to backend
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
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Escolher Forma de Pagamento</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto px-4 py-8">
        {/* Detalhes do Plano */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Detalhes do Plano</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6 bg-muted rounded-lg mb-6">
              <p className="text-sm text-muted-foreground mb-2">Valor do plano</p>
              {appliedCoupon ? (
                <div className="flex flex-col items-center">
                  <p className="text-lg text-muted-foreground line-through">
                    {formatCurrency(baseAmount)}
                  </p>
                  <p className="text-4xl font-bold text-green-600">
                    {formatCurrency(finalBaseAmount)}
                  </p>
                  <div className="mt-2 text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">
                    Cupom {appliedCoupon.code} aplicado (-{formatCurrency(cappedDiscount)})
                  </div>
                </div>
              ) : (
                <p className="text-4xl font-bold">{formatCurrency(baseAmount)}</p>
              )}
            </div>

            {/* Configuração de Cupons */}
            <div className="flex gap-2 max-w-sm mx-auto">
              <div className="relative flex-1">
                <TicketPercent className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cupom de desconto"
                  className="pl-9"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  disabled={!!appliedCoupon}
                />
              </div>
              {appliedCoupon ? (
                <Button
                  variant="ghost"
                  onClick={removeCoupon}
                  className="text-red-500 hover:text-red-700"
                >
                  Remover
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={handleApplyCoupon}
                  disabled={!couponCode || validatingCoupon}
                >
                  {validatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Opções de Pagamento */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* PIX */}
          <Card className="border-2 border-primary hover:shadow-xl transition-all">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <QrCode className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>PIX</CardTitle>
                  <CardDescription>Pagamento instantâneo</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                <p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">
                  ✨ Sem taxas adicionais
                </p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                  {formatCurrency(finalBaseAmount)}
                </p>
              </div>

              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Confirmação instantânea</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>QR Code no site</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Sem custo extra</span>
                </li>
              </ul>

              <Button
                onClick={handlePixPayment}
                className="w-full h-12"
                size="lg"
                disabled={loading}
              >
                <QrCode className="w-5 h-5 mr-2" />
                Pagar com PIX
              </Button>
            </CardContent>
          </Card>

          {/* Cartão de Crédito */}
          <Card className="border-2 hover:shadow-xl transition-all">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle>Cartão de Crédito</CardTitle>
                  <CardDescription>Via Stripe Checkout</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Valor do plano:</span>
                    <span>{formatCurrency(finalBaseAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa processamento:</span>
                    <span>+ {formatCurrency(stripeFee)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Total:</span>
                    <span className="text-2xl">{formatCurrency(totalWithFee)}</span>
                  </div>
                </div>
              </div>

              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  <span>Checkout seguro</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  <span>Todos os cartões</span>
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
                    Pagar com Cartão
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Dica */}
        <Card className="mt-8 bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <p className="text-sm text-center">
              <strong>💡 Economia:</strong> Pagando com PIX você economiza{" "}
              <span className="font-bold text-primary">{formatCurrency(stripeFee)}</span> em taxas
              de processamento!
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
