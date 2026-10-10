import { useOrders, Order } from "@/hooks/useOrders";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
  paid: { label: "Pago", icon: CheckCircle, color: "text-green-600" },
  pending: { label: "Pendente", icon: Clock, color: "text-yellow-600" },
  awaiting_payment: { label: "Aguardando PIX", icon: AlertCircle, color: "text-orange-500" },
  failed: { label: "Falhou", icon: XCircle, color: "text-red-600" },
  refunded: { label: "Reembolsado", icon: XCircle, color: "text-muted-foreground" },
};

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const status = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  // Use order_items if available, otherwise fall back to items JSON
  const items =
    order.order_items && order.order_items.length > 0
      ? order.order_items
      : (order.items as unknown as Array<{
          name: string;
          price: number;
          quantity: number;
          image?: string;
          size?: string;
        }>);

  return (
    <div className="border border-border bg-background rounded-lg overflow-hidden">
      {/* Header */}
      <button
        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium">Pedido de {formatDate(order.created_at)}</p>
            <div className={cn("flex items-center gap-1 text-xs", status.color)}>
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <p className="text-sm font-bold">{formatPrice(order.total)}</p>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-border p-4 space-y-4">
          {/* Items */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-muted-foreground">Itens</h4>
            {Array.isArray(items) &&
              items.map((item, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  {"product_image" in item && item.product_image ? (
                    <img
                      src={item.product_image}
                      alt={"product_name" in item ? item.product_name : item.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : "image" in item && item.image ? (
                    <img
                      src={item.image}
                      alt={"name" in item ? item.name : ""}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                      <Package className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium">
                      {"product_name" in item ? item.product_name : item.name}
                      {"product_size" in item && item.product_size && ` - ${item.product_size}`}
                      {"size" in item && item.size && ` - ${item.size}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Qtd: {"quantity" in item ? item.quantity : 1} ×{" "}
                      {formatPrice("price" in item ? item.price : 0)}
                    </p>
                  </div>
                </div>
              ))}
          </div>

          {/* Order ID */}
          <div className="text-xs text-muted-foreground">ID: {order.id.slice(0, 8)}...</div>
        </div>
      )}
    </div>
  );
}

export function OrderHistory() {
  const { orders, loading, error } = useOrders();

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <XCircle className="w-8 h-8 mx-auto mb-2" />
        <p className="text-sm">Erro ao carregar pedidos</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Você ainda não fez nenhum pedido</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
