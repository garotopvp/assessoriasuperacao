import { useState, useEffect } from "react";
import { X, CreditCard, QrCode, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { Logger } from "@/lib/logger";
import { captureError } from "@/lib/sentry";

const logger = new Logger("CheckoutModal");

// Schema de validação para CPF
const CheckoutSchema = z.object({
  cpf: z
    .string()
    .min(11, "CPF deve ter 11 dígitos")
    .max(14, "CPF inválido")
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, "Formato de CPF inválido"),
});

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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
  if (/^(\d)\1+$/.test(digits)) return false; // Todos dígitos iguais

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

export function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const { cart, cartTotal, clearCart } = useCart();
  const { user, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cpf, setCpf] = useState("");
  const [cpfError, setCpfError] = useState("");

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (isOpen && !authLoading && !user) {
      onClose();
      toast.info("Faça login para finalizar sua compra");
      navigate("/login");
    }
  }, [isOpen, user, authLoading, navigate, onClose]);

  // Buscar CPF do perfil do usuário
  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.id) {
        const { data } = await supabase
          .from("profiles")
          .select("cpf, telefone")
          .eq("user_id", user.id)
          .maybeSingle();

        if (data?.cpf) {
          setCpf(formatCPF(data.cpf));
        }
      }
    };

    if (isOpen && user) {
      fetchProfile();
    }
  }, [user?.id, isOpen, user]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setCpf(formatted);
    setCpfError("");
  };

  // Redirecionar para página de escolha de pagamento
  const handleCheckout = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para finalizar a compra");
      logger.warn("Tentativa de checkout sem autenticação");
      navigate("/login");
      return;
    }

    if (cart.length === 0) {
      toast.error("Seu carrinho está vazio");
      logger.warn("Tentativa de checkout com carrinho vazio", { userId: user.id });
      return;
    }

    // Validar CPF com Zod
    const cpfDigits = cpf.replace(/\D/g, "");
    const validation = CheckoutSchema.safeParse({ cpf });

    if (!cpfDigits) {
      setCpfError("CPF é obrigatório para pagamento");
      return;
    }

    if (!validation.success) {
      const error = validation.error.errors[0].message;
      setCpfError(error);
      logger.warn("Validação de CPF falhou", { error });
      return;
    }

    if (!isValidCPF(cpf)) {
      setCpfError("CPF inválido");
      logger.warn("CPF inválido fornecido", { userId: user.id });
      return;
    }

    try {
      logger.info("Iniciando checkout", {
        userId: user.id,
        itemCount: cart.length,
        total: cartTotal,
      });

      // Salvar CPF no perfil
      if (user?.id && cpf) {
        await supabase
          .from("profiles")
          .update({ cpf: cpf.replace(/\D/g, "") })
          .eq("user_id", user.id);

        logger.debug("CPF salvo no perfil", { userId: user.id });
      }

      // Preparar items para passar para próxima página
      const items = cart.map((item) => ({
        id: item.produtoId,
        name: `${item.nome} - Tam. ${item.tamanho}`,
        price: item.preco,
        quantity: item.quantidade,
        image: item.imagem_principal || item.imagem,
        size: item.tamanho,
      }));

      logger.info("Redirecionando para escolha de pagamento", { itemCount: items.length });

      // Fechar modal e redirecionar
      onClose();
      navigate("/escolher-pagamento-produto", {
        state: {
          items,
          cpf: cpfDigits,
        },
      });
    } catch (error: unknown) {
      logger.error("Erro no checkout:", { error: error.message, userId: user?.id });
      captureError(error, { userId: user?.id, cartTotal });
      toast.error(error.message || "Erro ao processar");
    }
  };

  // Não renderizar se não estiver logado
  if (!user && !authLoading) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-background z-[60] shadow-xl rounded-lg transition-all duration-300",
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-bold">FINALIZAR COMPRA</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-md transition-colors"
            aria-label="Fechar carrinho"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="text-center mb-4 space-y-2">
            <p className="text-sm text-muted-foreground">Total do pedido</p>
            <p className="text-3xl font-bold">{formatPrice(cartTotal)}</p>
          </div>

          {/* Campo CPF */}
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

          {/* Botão único de finalizar compra */}
          <Button
            className="w-full h-14 text-base font-semibold"
            onClick={handleCheckout}
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
                Finalizar Compra
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Você escolherá entre PIX (sem taxa) ou Cartão de Crédito (com taxa) na próxima etapa
          </p>
        </div>
      </div>
    </>
  );
}
