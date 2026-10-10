import { logger } from "@/lib/logger";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CreditCard, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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

export default function PagamentoDireto() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [cpf, setCpf] = useState("");
  const [cpfError, setCpfError] = useState("");

  const amount = searchParams.get("amount") || "100.00";
  const description = searchParams.get("description") || "Mensalidade";

  // Buscar CPF do perfil do usuário
  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.id) {
        const { data } = await supabase
          .from("profiles")
          .select("cpf")
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

    // Validar CPF
    const cpfDigits = cpf.replace(/\D/g, "");
    if (!cpfDigits) {
      setCpfError("CPF é obrigatório para pagamento");
      return;
    }
    if (!isValidCPF(cpf)) {
      setCpfError("CPF inválido");
      return;
    }

    setLoading(true);

    try {
      // Salvar CPF no perfil do usuário
      if (user?.id && cpf) {
        await supabase
          .from("profiles")
          .update({ cpf: cpf.replace(/\D/g, "") })
          .eq("user_id", user.id);
      }

      // Obter JWT do usuário
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        toast.error("Sessão expirada. Faça login novamente.");
        navigate("/login");
        return;
      }
      const accessToken = sessionData.session.access_token;

      // Criar item de pagamento
      const items = [
        {
          name: description,
          price: parseFloat(amount),
          quantity: 1,
        },
      ];

      // Redirecionar para Abacate Pay
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-pix-abacate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            items,
            customerEmail: user?.email,
            customerName:
              user?.user_metadata?.full_name ||
              user?.user_metadata?.name ||
              user?.email?.split("@")[0],
            customerPhone: user?.user_metadata?.phone || user?.phone,
            customerTaxId: cpf.replace(/\D/g, ""),
            userId: user?.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        logger.error("Erro detalhado da função Edge:", data);
        toast.error(data.error || data.details || "Erro ao processar pagamento");
        throw new Error(data.error || data.details || "Erro ao processar pagamento");
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: unknown) {
      logger.error("Payment error:", error);
      toast.error(error.message || "Erro ao processar pagamento");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Login Necessário</CardTitle>
            <CardDescription>Você precisa estar logado para fazer o pagamento</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/login")} className="w-full">
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Pagamento</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Finalizar Pagamento</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Valor */}
            <div className="text-center py-6 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Valor a pagar</p>
              <p className="text-4xl font-bold">
                R$ {parseFloat(amount).toFixed(2).replace(".", ",")}
              </p>
            </div>

            {/* CPF */}
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF (obrigatório para pagamento)</Label>
              <Input
                id="cpf"
                type="text"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={handleCpfChange}
                className={cn(cpfError && "border-destructive")}
              />
              {cpfError && <p className="text-xs text-destructive">{cpfError}</p>}
            </div>

            {/* Botão de pagamento */}
            <Button
              className="w-full h-14 text-base font-semibold"
              onClick={handlePayment}
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
                  Pagar R$ {parseFloat(amount).toFixed(2).replace(".", ",")}
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Você será redirecionado para escolher entre PIX ou Cartão de Crédito no Abacate Pay
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
