import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, QrCode, Loader2 } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { OpenPixModal } from "@/components/payment/OpenPixModal";
import { useOpenPixCharge } from "@/hooks/useOpenPixCharge";

// Constantes
const MAX_POLLING_ATTEMPTS = 60; // 3 minutos (60 * 3s)
const POLLING_INTERVAL = 3000; // 3 segundos

// Tipos
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  size?: string;
}

interface LocationState {
  cpf?: string;
  items?: CartItem[];
}

// Funções auxiliares
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function calculateStripeFee(amount: number): number {
  return Math.round((amount * 0.0399 + 0.4) * 100) / 100;
}

export default function EscolherPagamentoProdutoNova() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();
  const { cart, cartTotal, clearCart } = useCart();

  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [pollingCount, setPollingCount] = useState(0);

  const pollingCountRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    charge,
    isLoading: isPixLoading,
    isPaid,
    error,
    setExternalCharge,
    setPaid,
    createCharge,
  } = useOpenPixCharge();

  // Obter dados do location.state ou cart
  const locationState = (location.state as LocationState) || {};
  const cpf = locationState.cpf;

  const items: CartItem[] =
    locationState.items ||
    cart.map((item) => ({
      id: String(item.produtoId),
      name: `${item.nome} - Tam. ${item.tamanho}`,
      price: item.preco,
      quantity: item.quantidade,
      image: item.imagem_principal || item.imagem || "",
      size: item.tamanho,
    }));

  // Cálculos
  const stripeFee = calculateStripeFee(cartTotal);
  const totalWithFee = cartTotal + stripeFee;

  // Validação inicial (não validar se pagamento já confirmado)
  useEffect(() => {
    if (!isPaid && (!user || !items || items.length === 0 || cartTotal === 0)) {
      toast.error("Informações do pedido não encontradas ou carrinho vazio");
      navigate("/roupas");
    }
  }, [user, items, cartTotal, navigate, isPaid]);

  // Redirecionar quando pago IMEDIATAMENTE
  useEffect(() => {
    if (isPaid) {
      toast.success("Pagamento confirmado! Redirecionando...");
      // Navigate IMEDIATAMENTE (replace: true previne volta no histórico)
      navigate("/shop-sucesso", { replace: true });
      // ClearCart DEPOIS para evitar race condition
      setTimeout(() => clearCart(), 100);
    }
  }, [isPaid, clearCart, navigate]);

  // Mostrar erro se houver
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Polling do status do pedido
  useEffect(() => {
    if (!orderId || isPaid) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    pollingCountRef.current = 0;
    setPollingCount(0);

    const checkPaymentStatus = async () => {
      try {
        pollingCountRef.current += 1;
        const attemptNumber = pollingCountRef.current;
        setPollingCount(attemptNumber);

        // Verificar limite
        if (attemptNumber > MAX_POLLING_ATTEMPTS) {
          toast.info("⏱️ Ainda aguardando confirmação. Use o botão 'Já paguei' se já pagou.");
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return;
        }

        // Buscar status no banco (forçar bypass de cache)
        const { data, error } = await supabase
          .from("orders")
          .select("status, payment_provider, updated_at, correlation_id")
          .eq("id", orderId)
          .single();

        console.log(`[POLLING ${attemptNumber}] Query Supabase:`, {
          orderId,
          data,
          error,
          status: data?.status,
        });

        let orderData = data;

        // Sempre chamar Edge Function como fallback (mais confiável)
        try {
          const resp = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-order`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              },
              body: JSON.stringify({ orderId }),
            }
          );

          if (resp.ok) {
            const json = await resp.json();
            console.log(`[POLLING ${attemptNumber}] Edge Function response:`, json);
            if (json && json.status) {
              orderData = json;
            }
          } else {
            console.warn(`[POLLING ${attemptNumber}] Edge Function failed:`, resp.status);
          }
        } catch (err) {
          console.error(`[POLLING ${attemptNumber}] Erro no Edge Function:`, err);
        }

        // Verificar se está pago
        console.log(`[POLLING ${attemptNumber}] Status final:`, orderData?.status);

        if (orderData?.status === "paid") {
          console.log("🎉 PAGAMENTO CONFIRMADO! Acionando setPaid...");
          if (setPaid) setPaid(true);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        } else {
          console.log(
            `[POLLING ${attemptNumber}] Ainda aguardando... Status: ${orderData?.status || "indefinido"}`
          );
        }
      } catch (err) {
        console.error("Erro no polling:", err);
      }
    };

    // Iniciar polling
    intervalRef.current = setInterval(checkPaymentStatus, POLLING_INTERVAL);
    checkPaymentStatus();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [orderId, isPaid, setPaid]);

  // Handler: verificação manual do pagamento
  const handleManualCheck = async () => {
    if (!orderId) return;

    toast.loading("Verificando pagamento...", { id: "manual-check" });

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionToken = sessionData?.session?.access_token;

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ orderId }),
      });

      const data = await resp.json();

      if (data.status === "paid") {
        toast.success("✅ Pagamento confirmado! Redirecionando...", { id: "manual-check" });
        if (setPaid) setPaid(true);
      } else {
        toast.info(
          `📋 Status: ${data.status === "pending" ? "Aguardando pagamento" : data.status}`,
          { id: "manual-check" }
        );
      }
    } catch (err) {
      // Fallback: query direta no banco
      const { data, error } = await supabase
        .from("orders")
        .select("status")
        .eq("id", orderId)
        .single();

      if (!error && data?.status === "paid") {
        toast.success("✅ Pagamento confirmado!", { id: "manual-check" });
        if (setPaid) setPaid(true);
      } else {
        toast.error("Ainda não recebemos a confirmação. Tente novamente em instantes.", {
          id: "manual-check",
        });
      }
    }
  };

  // Handler: pagamento PIX - Agora usa o hook useOpenPixCharge (mesma lógica que funciona em /escolher-pagamento)
  const handlePixPayment = async () => {
    if (!user || !items) {
      toast.error("Informações incompletas. Tente novamente.");
      return;
    }

    if (!setExternalCharge) {
      toast.error("Hook do OpenPix não está disponível");
      return;
    }

    setLoading(true);

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("nome_completo, telefone, cpf")
        .eq("user_id", user.id)
        .single();

      // Criar correlationID estruturado para produtos
      const correlationID = `user_${user.id}_cart_${Date.now()}`;
      const itemsDescription = items.map((item) => `${item.quantity}x ${item.name}`).join(", ");

      // Usar o hook do OpenPix diretamente (mesma lógica que funciona)
      const { charge: pixCharge, error: pixError } = await createCharge({
        value: Math.round(cartTotal * 100), // Converter para centavos
        correlationID,
        comment: `Pedido Superação Shop - ${itemsDescription}`,
        customer: {
          name: profile?.nome_completo || user.email?.split("@")[0] || "Cliente",
          email: user.email || "",
          taxID: profile?.cpf || cpf || "",
        },
      });

      if (pixError) {
        throw new Error(pixError);
      }

      if (!pixCharge) {
        throw new Error("Falha ao gerar QR Code");
      }

      // Salvar pedido no banco de dados manualmente (já que não estamos usando a Edge Function)
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            user_id: user.id,
            customer_email: user.email || "",
            // @ts-ignore - colunas podem não estar tipadas
            customer_name: profile?.nome_completo || user.email?.split("@")[0] || "Cliente",
            items: items as any, // Cast to any to avoid Json type mismatch
            total: cartTotal,
            // @ts-ignore
            total_amount: cartTotal,
            status: "pending",
            // @ts-ignore
            payment_method: "pix",
            // @ts-ignore
            payment_provider: "openpix",
            // @ts-ignore
            correlation_id: correlationID,
            // @ts-ignore
            openpix_correlation_id: correlationID,
          },
        ])
        .select()
        .single();

      if (orderError) {
        throw new Error(`Erro ao criar pedido: ${orderError.message}`);
      }

      if (orderData?.id) {
        setOrderId(orderData.id);
        setPollingCount(0);
      }

      // Configurar charge externa para o modal
      setExternalCharge({
        brCode: pixCharge.brCode,
        qrCodeImage: pixCharge.qrCodeImage,
        correlationID: pixCharge.correlationID,
        value: Math.round(cartTotal * 100),
      });

      setModalOpen(true);
      toast.success("QR Code gerado com sucesso!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao processar pagamento";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Handler: pagamento cartão
  const handleCardPayment = async () => {
    if (!user || !items) return;

    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        throw new Error("Sessão não encontrada. Faça login novamente.");
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("nome_completo, telefone")
        .eq("user_id", user.id)
        .single();

      const { data, error } = await supabase.functions.invoke("create-stripe-order", {
        body: {
          items,
          userId: user.id,
          customer: {
            name: profile?.nome_completo || user.email?.split("@")[0],
            email: user.email,
            phone: profile?.telefone,
            taxID: cpf,
          },
          includeStripeFee: true,
          cancelUrl: window.location.href,
        },
      });

      if (error) {
        throw new Error(error.message || "Erro ao conectar com servidor de pagamento");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.url) {
        clearCart();
        window.location.href = data.url;
      } else {
        throw new Error("URL de checkout não foi retornada");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao processar pagamento";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!items) return null;

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
        {/* Resumo do Pedido */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Resumo do Pedido</CardTitle>
            <CardDescription>
              {items.length} {items.length === 1 ? "item" : "itens"} no carrinho
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6 bg-muted rounded-lg space-y-2">
              <p className="text-sm text-muted-foreground mb-2">Total a pagar</p>
              <p className="text-4xl font-bold">{formatCurrency(cartTotal)}</p>
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
                  {formatCurrency(cartTotal)}
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
                disabled={loading || isPixLoading}
              >
                {loading || isPixLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <QrCode className="w-5 h-5 mr-2" />
                    Pagar com PIX
                  </>
                )}
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
                    <span className="text-muted-foreground">Valor do pedido:</span>
                    <span>{formatCurrency(cartTotal)}</span>
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

        {/* Dica de Economia */}
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

      {/* Status do Polling */}
      {orderId && !isPaid && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4 z-50">
          <div className="p-4 border-2 border-primary rounded-lg bg-card shadow-lg text-center">
            <p className="text-sm font-semibold mb-2">⏳ Aguardando confirmação do pagamento...</p>
            <div className="flex justify-center gap-4 items-center mb-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">
                Verificação {pollingCount}/{MAX_POLLING_ATTEMPTS}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              A confirmação é automática. Se já pagou, clique abaixo:
            </p>
            <Button variant="default" size="sm" className="w-full" onClick={handleManualCheck}>
              ✓ Já paguei, verificar agora
            </Button>
          </div>
        </div>
      )}

      {/* Modal PIX */}
      <OpenPixModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        brCode={charge?.brCode}
        qrCodeImage={charge?.qrCodeImage}
        value={Math.round(cartTotal * 100)} // Valor correto do PIX
        isPaid={isPaid}
        isLoading={isPixLoading}
      />
    </div>
  );
}
