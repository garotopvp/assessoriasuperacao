import { logger } from "@/lib/logger";
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

export default function EscolherPagamentoProduto() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();
  const { cart, cartTotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const {
    charge,
    isLoading: isPixLoading,
    isPaid,
    error,
    createCharge,
    setExternalCharge,
    reset,
    setPaid,
  } = useOpenPixCharge();

  // Usar location.state se disponível, senão usar cart diretamente
  const locationState = (location.state as any) || {};
  const cpf = locationState.cpf;

  // Se items não estiver em location.state, criar a partir do cart
  const items =
    locationState.items ||
    cart.map((item) => ({
      id: item.produtoId,
      name: `${item.nome} - Tam. ${item.tamanho}`,
      price: item.preco,
      quantity: item.quantidade,
      image: item.imagem_principal || item.imagem,
      size: item.tamanho,
    }));

  // Calcular taxa do Stripe
  const stripeFee = cartTotal * 0.0399 + 0.4;
  const amountWithFee = cartTotal + stripeFee;

  // Flag para evitar erro de carrinho vazio após checkout
  const [checkoutCompleted, setCheckoutCompleted] = useState(false);

  useEffect(() => {
    // Não mostrar erro se checkout foi completado
    if (checkoutCompleted) return;

    if (!user || !items || items.length === 0 || cartTotal === 0) {
      toast.error("Informações do pedido não encontradas ou carrinho vazio");
      navigate("/roupas");
    }
  }, [user, items, cartTotal, navigate, checkoutCompleted]);

  // Quando pago, redirecionar
  useEffect(() => {
    if (isPaid) {
      setCheckoutCompleted(true); // Marcar checkout como concluído
      toast.success("Pagamento confirmado! Redirecionando...");
      clearCart();
      setTimeout(() => {
        navigate("/shop-sucesso");
      }, 2000);
    }
  }, [isPaid, clearCart, navigate]);

  // Estado para polling do pedido
  const [orderId, setOrderId] = useState<string | null>(null);
  const [pollingCount, setPollingCount] = useState(0);
  const MAX_POLLING_ATTEMPTS = 60; // 3 minutos (60 * 3s)
  const pollingCountRef = useRef(0); // Usar ref para não triggerar re-render
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Polling para verificar status do pagamento
  useEffect(() => {
    console.log(
      "%c🔄 USEEFFECT POLLING TRIGGERED",
      "background: #ff9800; color: white; padding: 4px; font-weight: bold;",
      { orderId, isPaid }
    );

    if (!orderId || isPaid) {
      console.log("⏸️ Polling parado:", { orderId, isPaid });
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Resetar contador quando começa novo pedido
    pollingCountRef.current = 0;
    setPollingCount(0);

    const checkPaymentStatus = async () => {
      try {
        pollingCountRef.current += 1;
        const attemptNumber = pollingCountRef.current;

        // Atualizar UI
        setPollingCount(attemptNumber);

        console.log(
          `%c[PIX POLLING ${attemptNumber}/${MAX_POLLING_ATTEMPTS}] 🔍 Verificando status...`,
          "background: #e3f2fd; color: #1565c0; padding: 4px 8px; border-radius: 4px;"
        );
        console.log("📋 Order ID:", orderId);
        console.log("🕐 Timestamp:", new Date().toLocaleTimeString());

        // Verificar limite ANTES de fazer a query
        if (attemptNumber > MAX_POLLING_ATTEMPTS) {
          console.log(
            "%c⏱️ TIMEOUT - Limite de tentativas atingido",
            "background: #ff9800; color: white; padding: 4px 8px; border-radius: 4px;"
          );
          logger.warn("[Polling] Limite de tentativas atingido", { attempts: attemptNumber });
          toast.info("⏱️ Ainda aguardando confirmação. Use o botão 'Já paguei' se já pagou.");
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return;
        }

        const { data, error } = await supabase
          .from("orders")
          .select("status, payment_provider, updated_at, correlation_id")
          .eq("id", orderId)
          .single();

        // Se houve erro ao buscar via Supabase (ex: RLS), tentar fallback para a Edge Function
        let orderData = data;
        if (error) {
          console.error("❌ [Polling] ERRO ao buscar via Supabase:", error);
          logger.warn(
            "[Polling] Erro ao verificar status via Supabase, tentando fallback Edge Function",
            error
          );

          try {
            // Tenta obter sessão para enviar Authorization, se disponível
            const { data: sessionData } = await supabase.auth.getSession();
            const sessionToken = (sessionData as any)?.session?.access_token;

            const resp = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-order`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
                  apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                },
                body: JSON.stringify({ orderId }),
              }
            );

            const json = await resp.json();

            if (resp.ok && json) {
              orderData = json;
              logger.info("[Polling] Fallback Edge Function retornou status", { orderId, json });
            } else {
              logger.warn("[Polling] Fallback Edge Function falhou", {
                status: resp.status,
                body: json,
              });
            }
          } catch (err) {
            console.error("❌ [Polling] Erro no fallback Edge Function:", err);
            logger.error("[Polling] Erro no fallback Edge Function:", err);
          }
        }

        if (!orderData) {
          // Sem dados, apenas sair desta iteração
          return;
        }

        console.log("📊 Status recebido:", {
          status: orderData.status,
          provider: orderData.payment_provider || orderData.paymentProvider,
          updated_at: orderData.updated_at || orderData.updatedAt,
          correlation_id: orderData.correlation_id || orderData.correlationID,
        });

        if (orderData?.status === "paid") {
          console.log(
            "%c✅ PAGAMENTO CONFIRMADO!",
            "background: #4caf50; color: white; padding: 8px 16px; border-radius: 4px; font-size: 14px; font-weight: bold;"
          );
          logger.info("[Polling] Pagamento confirmado!");
          if (setPaid) setPaid(true);
          toast.success("✅ Pagamento confirmado! Redirecionando...");
          clearCart();
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setTimeout(() => {
            navigate("/shop-sucesso");
          }, 2000);
        } else {
          console.log(
            `⏳ Status ainda '${orderData.status}' - Tentativa ${attemptNumber}/${MAX_POLLING_ATTEMPTS}`
          );
        }
      } catch (err) {
        console.error("💥 [Polling] Exceção:", err);
        logger.error("[Polling] Exceção no polling:", err);
      }
    };

    // Verificar a cada 3 segundos
    console.log("⏰ Criando interval de 3s");
    intervalRef.current = setInterval(checkPaymentStatus, 3000);

    // Verificar imediatamente também
    console.log("🚀 Executando primeira verificação imediata");
    checkPaymentStatus();

    return () => {
      console.log("🧹 Limpando interval (useEffect cleanup)");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [orderId, isPaid, setPaid, clearCart, navigate]); // REMOVIDO pollingCount das dependências!

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleManualCheck = async () => {
    if (!orderId) return;

    console.log(
      "%c🔍 VERIFICAÇÃO MANUAL SOLICITADA",
      "background: #9c27b0; color: white; padding: 4px 8px; border-radius: 4px;"
    );
    logger.info("[Manual] Verificação manual solicitada", { orderId });

    toast.loading("Verificando pagamento...", { id: "manual-check" });

    const { data, error } = await supabase
      .from("orders")
      .select("status, updated_at, correlation_id")
      .eq("id", orderId)
      .single();

    if (error) {
      console.error("❌ Erro na verificação manual:", error);
      logger.error("[Manual] Erro ao verificar:", error);
      toast.error("Erro ao verificar status: " + error.message, { id: "manual-check" });
    } else {
      console.log("📊 Status verificado manualmente:", data);
      logger.info("[Manual] Status verificado:", data);

      if (data.status === "paid") {
        console.log(
          "%c✅ PAGAMENTO CONFIRMADO (MANUAL)!",
          "background: #4caf50; color: white; padding: 8px; border-radius: 4px; font-weight: bold;"
        );
        toast.success("✅ Pagamento confirmado! Redirecionando...", { id: "manual-check" });
        if (setPaid) setPaid(true);
        clearCart();
        setTimeout(() => {
          navigate("/shop-sucesso");
        }, 2000);
      } else {
        console.log(`⏳ Status atual: ${data.status}`);
        toast.info(
          `📋 Status: ${data.status === "pending" ? "Aguardando pagamento" : data.status}`,
          { id: "manual-check" }
        );
      }
    }
  };

  const handlePixPayment = async () => {
    if (!user || !items) {
      logger.warn("Tentativa de pagamento PIX sem usuário ou itens", {
        hasUser: !!user,
        hasItems: !!items,
      });
      toast.error("Informações incompletas. Tente novamente.");
      return;
    }

    setLoading(true);

    try {
      // Buscar perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("nome_completo, telefone, cpf")
        .eq("user_id", user.id)
        .single();

      if (profileError) {
        logger.warn("Erro ao buscar perfil, continuando sem perfil", { error: profileError });
      }

      // Obter ou criar sessão para chamada da Edge Function
      let {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      // Se não houver sessão (guest checkout), criar uma sessão anônima temporária
      if (!session) {
        logger.info("Usuário não logado, criando sessão anônima para checkout");
        const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();

        if (anonError) {
          logger.error("Erro ao criar sessão anônima", { error: anonError });
          throw new Error("Erro ao processar checkout. Por favor, tente novamente.");
        }

        session = anonData.session;
        logger.info("Sessão anônima criada com sucesso", { userId: anonData.user?.id });
      }

      // Log se houver erro de sessão
      if (sessionError) {
        logger.warn("Erro ao obter sessão", { error: sessionError });
      }

      // Preparar dados do cliente
      // Para usuários logados: usar dados do perfil
      // Para guests: usar email do user context ou deixar vazio
      const customerData = {
        name: profile?.nome_completo || user?.email?.split("@")[0] || "Cliente",
        email: user?.email || "",
        phone: profile?.telefone || "",
        taxID: profile?.cpf || cpf || "",
      };

      // Validar que pelo menos o CPF foi fornecido (obrigatório para PIX)
      if (!customerData.taxID) {
        throw new Error("CPF é obrigatório para pagamento via PIX.");
      }

      // Invocar a Edge Function que cria a cobrança E o pedido no banco
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-openpix-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session!.access_token}`, // Sempre terá sessão agora (anônima ou autenticada)
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            items,
            userId: user?.id || session?.user?.id || null, // Usar userId da sessão anônima se disponível
            customer: customerData,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // Se falhar com token do usuário, tenta logar o erro
        logger.error("Erro na função (status não OK)", { status: response.status, data });
        throw new Error(data.error || "Erro ao conectar com servidor de pagamento");
      }

      if (data?.error) {
        logger.error("Erro retornado pela função", { error: data.error });
        throw new Error(data.error);
      }

      if (!data?.brCode || !data?.qrCodeImage) {
        throw new Error("Erro ao gerar QR Code. Resposta incompleta do servidor.");
      }

      console.log(
        "%c✅ COBRANÇA PIX CRIADA",
        "background: #4caf50; color: white; padding: 4px 8px; border-radius: 4px;"
      );
      console.log("📋 Correlation ID:", data.correlationID);
      console.log("🆔 Order ID:", data.orderId);
      console.log("📄 QR Code gerado:", !!data.brCode);
      logger.info("Cobrança PIX criada com sucesso", {
        correlationID: data.correlationID,
        orderId: data.orderId,
      });

      // Salvar orderId para polling e resetar contador
      if (data.orderId) {
        setOrderId(data.orderId);
        setPollingCount(0);
        console.log(
          "%c🔄 POLLING INICIADO - Verificando a cada 3 segundos",
          "background: #2196f3; color: white; padding: 4px 8px; border-radius: 4px;"
        );
        logger.info("[Polling] Iniciando verificação automática", { orderId: data.orderId });
      }

      // Atualizar o estado do hook com a cobrança gerada pela Edge Function
      if (setExternalCharge) {
        setExternalCharge({
          brCode: data.brCode,
          qrCodeImage: data.qrCodeImage,
          correlationID: data.correlationID,
          value: Math.round(cartTotal * 100),
        });
      }

      setModalOpen(true);
      toast.success("QR Code gerado com sucesso!");
    } catch (error: unknown) {
      logger.error("Erro no pagamento PIX:", error);
      const message =
        error instanceof Error ? error.message : "Erro desconhecido ao processar pagamento";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCardPayment = async () => {
    if (!user || !items) return;

    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

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
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json",
        },
      });

      if (error) {
        logger.error("Function invoke error:", error);
        // Try to parse the error body if available, sometimes the generic error message is not helpful
        let errorMessage = error.message;
        try {
          const body = JSON.parse(await error.context.json());
          if (body && body.error) errorMessage = body.error;
        } catch (e) {
          // Ignore parsing errors
        }
        throw new Error(errorMessage || "Erro ao conectar com servidor de pagamento");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.url) {
        clearCart();
        window.location.href = data.url;
      }
    } catch (error: unknown) {
      logger.error("Stripe error:", error);
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(message || "Erro ao processar pagamento");
    } finally {
      setLoading(false);
    }
  };

  if (!items) return null;

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
            <CardTitle>Resumo do Pedido</CardTitle>
            <CardDescription>
              {items.length} {items.length === 1 ? "item" : "itens"} no carrinho
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Total do pedido</p>
              <p className="text-3xl font-bold">R$ {cartTotal.toFixed(2).replace(".", ",")}</p>
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
                  R$ {cartTotal.toFixed(2).replace(".", ",")}
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

              <Button
                onClick={handlePixPayment}
                className="w-full h-12"
                disabled={loading || isPixLoading}
              >
                {loading || isPixLoading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <QrCode className="w-5 h-5 mr-2" />
                )}
                Pagar com PIX
              </Button>
            </CardContent>
          </Card>

          {/* Cartão - Com Taxa */}
          <Card className="border-2 hover:shadow-lg transition-all cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CreditCard className="w-8 h-8" />
                <div>
                  <CardTitle>Cartão de Crédito</CardTitle>
                  <CardDescription>Pagamento seguro</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-2">Valor do pedido:</p>
                <p className="text-lg line-through text-muted-foreground">
                  R$ {cartTotal.toFixed(2).replace(".", ",")}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  + Taxa de processamento: R$ {stripeFee.toFixed(2).replace(".", ",")}
                </p>
                <p className="text-2xl font-bold mt-2">
                  R$ {amountWithFee.toFixed(2).replace(".", ",")}
                </p>
              </div>

              <ul className="space-y-2 text-sm">
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

        {/* Dica */}
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

      {/* Status do Pedido e Botão de Verificação Manual (Diagnostic e UX) */}
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

      {/* Modal OpenPix */}
      <OpenPixModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        brCode={charge?.brCode}
        qrCodeImage={charge?.qrCodeImage}
        value={Math.round(cartTotal * 100)}
        isPaid={isPaid}
        isLoading={isPixLoading}
      />
    </div>
  );
}
