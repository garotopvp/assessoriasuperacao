import { useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  ShoppingBag,
  Home,
  Clock,
  AlertCircle,
  User,
  Package,
  Loader2,
  MessageCircle,
  Mail,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useOrderBySessionId } from "@/hooks/useOrders";
import { cn } from "@/lib/utils";

const WHATSAPP_NUMBER = "5535998629449";

const statusConfig: Record<
  string,
  { title: string; description: string; icon: typeof CheckCircle; color: string; bgColor: string }
> = {
  paid: {
    title: "PEDIDO CONFIRMADO!",
    description: "Seu pagamento foi aprovado. Combine a retirada pelo WhatsApp.",
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  pending: {
    title: "PROCESSANDO PAGAMENTO...",
    description: "Estamos aguardando a confirmação do seu pagamento.",
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
  },
  awaiting_payment: {
    title: "AGUARDANDO PIX",
    description: "Escaneie o QR Code no Stripe para completar o pagamento.",
    icon: AlertCircle,
    color: "text-orange-500",
    bgColor: "bg-orange-100",
  },
  failed: {
    title: "PAGAMENTO FALHOU",
    description: "Houve um problema com seu pagamento. Por favor, tente novamente.",
    icon: AlertCircle,
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
};

const formatPrice = (price: number) => {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const generateWhatsAppMessage = (order: {
  id: string;
  total: number;
  order_items?: Array<{
    product_name: string;
    product_size?: string | null;
    quantity: number;
    price: number;
  }>;
  customer_email?: string;
}) => {
  const orderId = order.id.slice(-8).toUpperCase();

  let message = `🏃 *SUPERAÇÃO ASSESSORIA - PEDIDO #${orderId}*\n\n`;
  message += `Olá! Acabei de realizar um pedido e gostaria de combinar a retirada.\n\n`;
  message += `📦 *ITENS DO PEDIDO:*\n`;

  if (order.order_items && order.order_items.length > 0) {
    order.order_items.forEach((item, index) => {
      message += `${index + 1}. ${item.product_name}`;
      if (item.product_size) {
        message += ` (Tam: ${item.product_size})`;
      }
      message += `\n   Qtd: ${item.quantity} × ${formatPrice(item.price)}\n`;
    });
  }

  message += `\n💰 *TOTAL: ${formatPrice(order.total)}*\n\n`;
  message += `✅ Pagamento confirmado!\n\n`;
  message += `Quando podemos combinar a entrega/retirada?`;

  return encodeURIComponent(message);
};

export default function Sucesso() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { order, loading } = useOrderBySessionId(sessionId);

  // Get status config or default to pending while loading
  const status = order ? statusConfig[order.status] || statusConfig.pending : statusConfig.pending;
  const StatusIcon = status.icon;

  const handleWhatsAppClick = () => {
    if (!order) return;
    const message = generateWhatsAppMessage(order);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
  };

  // Handle PIX return
  const paymentMethod = searchParams.get("method");
  if (paymentMethod === "pix") {
    return (
      <Layout>
        <section className="min-h-[70vh] flex items-center justify-center py-16">
          <div className="container max-w-md text-center">
            <div className="bg-background border border-border p-8 rounded-lg">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-10 h-10 text-yellow-600" />
              </div>

              <h1 className="text-2xl font-black mb-2">AGUARDANDO CONFIRMAÇÃO</h1>
              <p className="text-muted-foreground mb-6">
                Estamos processando seu pagamento PIX. Assim que for confirmado, você receberá um
                e-mail e sua assinatura será ativada.
              </p>

              <div className="space-y-3">
                <Button asChild className="w-full">
                  <Link to="/perfil">
                    <User className="w-4 h-4 mr-2" />
                    Ir para Meu Perfil
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/">
                    <Home className="w-4 h-4 mr-2" />
                    Voltar ao Início
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  // Handle Registration Success
  const type = searchParams.get("type");
  const email = searchParams.get("email");

  if (type === "registration") {
    return (
      <Layout>
        <section className="min-h-[80vh] flex items-center justify-center bg-muted/30">
          <div className="container max-w-lg">
            <div className="bg-background border border-border shadow-2xl rounded-2xl p-10 text-center relative overflow-hidden">
              {/* Decorative background element */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />

              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-in zoom-in duration-500">
                <Mail className="w-12 h-12 text-primary" />
              </div>

              <h1 className="text-3xl font-black mb-4 tracking-tight">VERIFIQUE SEU EMAIL</h1>

              <div className="space-y-4 text-muted-foreground mb-8 text-lg">
                <p>Quase lá! Enviamos um link de confirmação para:</p>
                <div className="bg-muted p-3 rounded-lg font-medium text-foreground inline-block px-6">
                  {email || "seu email"}
                </div>
                <p className="text-sm">
                  Clique no link enviado para ativar sua conta e liberar seu acesso ao Superação
                  Club.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
                  onClick={() => (window.location.href = "https://gmail.com")}
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Abrir Email (Gmail)
                </Button>

                <Button asChild variant="ghost" className="w-full">
                  <Link to="/">Voltar ao site</Link>
                </Button>
              </div>

              <div className="mt-8 pt-6 border-t border-border/50 text-xs text-muted-foreground">
                <p>Não recebeu? Verifique sua caixa de spam ou lixo eletrônico.</p>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  // If no session_id and no specific method and no type, redirect home
  useEffect(() => {
    if (!sessionId && !paymentMethod && !type) {
      window.location.href = "/";
    }
  }, [sessionId, paymentMethod, type]);

  if (!sessionId && !paymentMethod && !type) {
    return (
      <Layout>
        <section className="min-h-[70vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="min-h-[70vh] flex items-center justify-center py-16">
        <div className="container max-w-lg">
          <div className="bg-background border border-border p-8 rounded-lg">
            {/* Status Icon */}
            <div
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6",
                status.bgColor
              )}
            >
              {loading ? (
                <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
              ) : (
                <StatusIcon className={cn("w-10 h-10", status.color)} />
              )}
            </div>

            {/* Title & Description */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-black mb-2">
                {loading ? "CARREGANDO..." : status.title}
              </h1>
              <p className="text-muted-foreground">
                {loading ? "Buscando detalhes do seu pedido..." : status.description}
              </p>
            </div>

            {/* Order Details */}
            {order && (
              <div className="border-t border-border pt-6 mb-6 space-y-4">
                {/* Order ID */}
                <div className="text-center">
                  <span className="text-xs font-bold uppercase text-muted-foreground">Pedido</span>
                  <p className="font-mono font-bold">#{order.id.slice(-8).toUpperCase()}</p>
                </div>

                {/* Items */}
                {order.order_items && order.order_items.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase text-muted-foreground">
                      Itens do Pedido
                    </h3>
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 text-sm">
                        {item.product_image ? (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                            <Package className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.product_size && <span>Tam: {item.product_size} · </span>}
                            Qtd: {item.quantity} × {formatPrice(item.price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <span className="font-medium">Total</span>
                  <span className="text-xl font-black">{formatPrice(order.total)}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              {/* WhatsApp Button - Only show for confirmed orders */}
              {order && (order.status === "paid" || order.status === "pending") && (
                <Button
                  onClick={handleWhatsAppClick}
                  className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white"
                  size="lg"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Combinar Retirada via WhatsApp
                </Button>
              )}

              <Button
                asChild
                variant={order?.status === "paid" ? "outline" : "default"}
                className="w-full"
              >
                <Link to="/perfil">
                  <User className="w-4 h-4 mr-2" />
                  Ver Meus Pedidos
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/roupas">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Continuar Comprando
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
