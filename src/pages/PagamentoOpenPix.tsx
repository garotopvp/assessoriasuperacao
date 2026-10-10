import { logger } from "@/lib/logger";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, QrCode, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useOpenPixCharge } from "@/hooks/useOpenPixCharge";
import { OpenPixModal } from "@/components/payment/OpenPixModal";
import { usePlans } from "@/hooks/usePlans"; // Updated import

// Função para formatar CPF
const formatCPF = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

// Função para validar CPF
const isValidCPF = (cpf: string) => {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  return rest === parseInt(digits[10]);
};

export default function PagamentoOpenPix() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const [cpf, setCpf] = useState("");
  const [cpfError, setCpfError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const { charge, isLoading, isPaid, error, createCharge, reset } = useOpenPixCharge();
  const { plans, loading: loadingPlans } = usePlans(); // Use hook

  // Função robusta para parse de valor da URL
  const parseAmountSafe = (val: string | null): number => {
    if (!val) return 0;
    let cleaned = val.replace(/[R$\s]/g, "");
    if (cleaned.includes(",")) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    }
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const planId = searchParams.get("planId") || "mensal";
  const amountStr = searchParams.get("amount");

  // Define o valor base do pagamento
  const baseAmount = useMemo(() => {
    if (loadingPlans) return 0; // Wait for plans

    const plan = plans.find((p) => p.id === planId);

    // Se temos um valor explícito na URL (possivelmente com desconto)
    if (amountStr) {
      const urlAmount = parseAmountSafe(amountStr);
      // Se houver um plano, só use o valor da URL se for MENOR que o do plano (desconto)
      // Se não houver plano, usa o valor da url
      if (plan) {
        if (urlAmount > 0 && urlAmount < plan.preco - 0.01) {
          return urlAmount;
        }
        return plan.preco;
      }
      return urlAmount > 0 ? urlAmount : 149.97;
    }

    // Se não tiver valor na URL, usa o do plano
    if (plan) return plan.preco;

    return 149.97; // Default fallback
  }, [planId, amountStr, plans, loadingPlans]);

  const description = searchParams.get("description") || "Plano - Superação";

  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.id) {
        const { data } = await supabase
          .from("profiles")
          .select("cpf, nome_completo, telefone")
          .eq("user_id", user.id)
          .maybeSingle();

        if (data?.cpf) {
          setCpf(formatCPF(data.cpf));
        }
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user?.id, user]);

  // Quando o pagamento for confirmado, atualizar o backend
  useEffect(() => {
    if (isPaid && user?.id) {
      toast.success("Pagamento confirmado! Ativando sua assinatura...");

      // Atualizar status no backend (o webhook do OpenPix já faz isso, mas podemos reforçar)
      setTimeout(() => {
        navigate("/perfil");
      }, 3000);
    }
  }, [isPaid, user?.id, navigate]);

  // Exibir erro se houver
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setCpf(formatted);
    setCpfError("");
  };

  const handlePayment = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para fazer o pagamento");
      navigate("/login");
      return;
    }

    const cpfDigits = cpf.replace(/\D/g, "");
    if (!cpfDigits) {
      setCpfError("CPF é obrigatório para pagamento");
      return;
    }
    if (!isValidCPF(cpf)) {
      setCpfError("CPF inválido");
      return;
    }

    try {
      // Salvar CPF no perfil
      await supabase.from("profiles").update({ cpf: cpfDigits }).eq("user_id", user.id);

      // Criar correlationID estruturado
      const correlationID = `user_${user.id}_plan_${planId}_${Date.now()}`;

      // Criar cobrança usando o hook do OpenPix
      const result = await createCharge({
        value: Math.round(baseAmount * 100), // Converter para centavos
        correlationID,
        comment: description,
        customer: {
          name: user.user_metadata?.nome_completo || user.email?.split("@")[0] || "Cliente",
          email: user.email || "",
          taxID: cpfDigits,
        },
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      // Abrir modal com QR Code
      setModalOpen(true);
      toast.success("QR Code gerado com sucesso!");
    } catch (error: unknown) {
      logger.error("OpenPix error:", error);
      const msg = error instanceof Error ? error.message : "Erro ao processar pagamento";
      toast.error(msg);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    if (isPaid) {
      reset();
      navigate("/perfil");
    }
  };

  if (authLoading || loadingPlans) {
    // Show loader if plans are loading
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );
  }

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
          <h1 className="text-xl font-bold">Pagamento via PIX</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isPaid ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                  Pagamento Confirmado!
                </>
              ) : (
                <>
                  <QrCode className="w-6 h-6" />
                  Pagamento Instantâneo com PIX
                </>
              )}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-6 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Valor a pagar</p>
              <p className="text-4xl font-bold">R$ {baseAmount.toFixed(2).replace(".", ",")}</p>
            </div>

            {!isPaid && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF (obrigatório para PIX)</Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={handleCpfChange}
                    className={cn(cpfError && "border-destructive")}
                  />
                  {cpfError && <p className="text-xs text-destructive">{cpfError}</p>}
                </div>

                <Button
                  className="w-full h-14 text-base font-semibold"
                  onClick={handlePayment}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <QrCode className="w-5 h-5 mr-2" />
                  )}
                  GERAR QR CODE PIX
                </Button>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <p className="text-sm text-center space-y-2">
                    <span className="block font-semibold">
                      ✨ Pagamento 100% seguro e instantâneo!
                    </span>
                    <span className="block text-muted-foreground">
                      O QR Code será exibido em um modal customizado.
                      <br />A confirmação é automática em tempo real.
                    </span>
                  </p>
                </div>
              </>
            )}

            {isPaid && (
              <div className="text-center space-y-4 py-8">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                <div>
                  <p className="text-xl font-bold">Pagamento Recebido!</p>
                  <p className="text-muted-foreground mt-2">
                    Sua assinatura foi ativada automaticamente.
                  </p>
                </div>
                <Button onClick={() => navigate("/perfil")}>Acessar Minha Conta</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Modal customizado com QR Code */}
      <OpenPixModal
        open={modalOpen}
        onClose={handleCloseModal}
        brCode={charge?.brCode}
        qrCodeImage={charge?.qrCodeImage}
        value={Math.round(baseAmount * 100)}
        isPaid={isPaid}
        isLoading={isLoading}
      />
    </div>
  );
}
