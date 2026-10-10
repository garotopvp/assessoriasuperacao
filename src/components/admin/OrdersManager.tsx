import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  ShoppingCart,
  Package,
  Calendar,
  DollarSign,
  User,
  CreditCard,
  MapPin,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  ExternalLink,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";
import { Checkbox } from "@/components/ui/checkbox";
import { downloadCSV } from "@/utils/exportData";
import { createSystemLog } from "@/utils/logger";

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  image?: string;
}

interface Order {
  id: string;
  created_at: string;
  customer_email: string;
  total: number;
  status: string;
  items: Json;
  user_id: string | null;
  shipping_address: Json | null;
  stripe_payment_intent: string | null;
  stripe_session_id: string | null;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  paid: {
    label: "Pago",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    icon: CheckCircle2,
  },
  pending: {
    label: "Pendente",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
    icon: Clock,
  },
  failed: {
    label: "Falhou",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
    icon: XCircle,
  },
  canceled: {
    label: "Cancelado",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
    icon: XCircle,
  },
  refunded: {
    label: "Estornado",
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
    icon: XCircle,
  },
};

export function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(filteredOrders.map((o) => o.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders((prev) => [...prev, id]);
    } else {
      setSelectedOrders((prev) => prev.filter((oId) => oId !== id));
    }
  };

  const handleExportCSV = () => {
    const dataToExport =
      selectedOrders.length > 0 ? orders.filter((o) => selectedOrders.includes(o.id)) : orders;

    if (dataToExport.length === 0) return;

    const csvData = dataToExport.map((o) => {
      const items = parseItems(o.items);
      const itemsDesc = items.map((i) => `${i.quantity}x ${i.name}`).join(" | ");
      return {
        ID: o.id,
        Data: formatDate(o.created_at),
        Cliente: o.customer_email,
        Status: STATUS_MAP[o.status]?.label || o.status,
        Total: o.total,
        Itens: itemsDesc,
      };
    });

    downloadCSV(csvData, "pedidos_bora_correr_club");

    toast.success(`${dataToExport.length} pedidos exportados com sucesso.`);

    createSystemLog({
      action: "export_orders",
      category: "user_action",
      level: "info",
      message: `Exportou ${dataToExport.length} pedidos para CSV.`,
      details: { exportCount: dataToExport.length },
    });
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      console.log("🔍 [DEBUG OrdersManager] Iniciando busca de pedidos...");

      // Verificar usuário e admin status
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log("👤 [DEBUG] User:", user?.email, user?.id);

      // Verificar se é admin
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("is_admin, user_id")
        .eq("user_id", user?.id)
        .single();

      console.log("🛡️ [DEBUG] Profile:", profile, "Error:", profileError);

      const { data, error, count } = await supabase
        .from("orders")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      console.log("📊 [DEBUG] Orders query result:", {
        count,
        dataLength: data?.length,
        error: error?.message,
        firstOrder: data?.[0],
      });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("❌ Erro ao buscar pedidos:", error);
      toast.error("Erro ao carregar pedidos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(
    (order) =>
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Update selected orders gracefully if filters change
  useEffect(() => {
    if (selectedOrders.length > 0) {
      const validIds = filteredOrders.map((o) => o.id);
      const newSelection = selectedOrders.filter((id) => validIds.includes(id));
      if (newSelection.length !== selectedOrders.length) setSelectedOrders(newSelection);
    }
  }, [filteredOrders, selectedOrders]);

  const getStatusBadge = (status: string) => {
    const config = STATUS_MAP[status] || STATUS_MAP.pending;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} border-none flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const parseItems = (itemsJson: Json): OrderItem[] => {
    if (!itemsJson) return [];
    if (Array.isArray(itemsJson)) return itemsJson as unknown as OrderItem[];
    return [];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-6 h-6" />
            Gerenciar Pedidos
          </h2>
          <p className="text-muted-foreground">Visualize e gerencie as vendas da loja online.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={handleExportCSV} variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Exportar CSV {selectedOrders.length > 0 && `(${selectedOrders.length})`}
          </Button>
          <Button onClick={fetchOrders} variant="outline" size="sm">
            <Clock className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por email ou ID..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        filteredOrders.length > 0 && selectedOrders.length === filteredOrders.length
                      }
                      onCheckedChange={(checked) => handleSelectAll(!!checked)}
                      aria-label="Select all orders"
                    />
                  </TableHead>
                  <TableHead className="w-[100px]">Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum pedido encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => {
                    const items = parseItems(order.items);
                    return (
                      <TableRow
                        key={order.id}
                        className={selectedOrders.includes(order.id) ? "bg-muted/50" : ""}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedOrders.includes(order.id)}
                            onCheckedChange={(checked) => handleSelectOrder(order.id, !!checked)}
                            aria-label={`Select order ${order.id}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{formatDate(order.created_at)}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(order.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{order.customer_email}</span>
                            <span className="text-xs text-muted-foreground font-mono">
                              ID: {order.id.slice(0, 8)}...
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {items.slice(0, 2).map((item, idx) => (
                              <div key={idx} className="text-sm flex items-center gap-1">
                                <span className="bg-muted px-1.5 py-0.5 rounded text-xs font-medium">
                                  {item.quantity}x
                                </span>
                                <span className="truncate max-w-[150px]">{item.name}</span>
                              </div>
                            ))}
                            {items.length > 2 && (
                              <span className="text-xs text-muted-foreground pl-1">
                                + {items.length - 2} itens...
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-green-600">
                          {formatCurrency(order.total, false)}
                        </TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedOrder(order)}
                              >
                                <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Detalhes do Pedido</DialogTitle>
                              </DialogHeader>

                              <div className="grid grid-cols-2 gap-4 py-4">
                                <div className="space-y-4">
                                  <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-2">
                                      <User className="w-4 h-4" /> Cliente
                                    </h3>
                                    <div className="p-3 bg-muted rounded-lg space-y-1">
                                      <p className="text-sm break-all">
                                        <span className="font-medium">Email:</span>{" "}
                                        {order.customer_email}
                                      </p>
                                      {order.user_id && (
                                        <p className="text-xs text-muted-foreground">
                                          Usuário cadastrado
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-2">
                                      <CreditCard className="w-4 h-4" /> Pagamento
                                    </h3>
                                    <div className="p-3 bg-muted rounded-lg space-y-1">
                                      <p className="text-sm flex justify-between">
                                        <span>Status:</span>
                                        {getStatusBadge(order.status)}
                                      </p>
                                      <p className="text-sm flex justify-between font-bold mt-2">
                                        <span>Total:</span>
                                        <span className="text-green-600">
                                          {formatCurrency(order.total, false)}
                                        </span>
                                      </p>
                                      {order.stripe_session_id && (
                                        <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                                          Stripe ID: {order.stripe_session_id.slice(0, 10)}...
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-2">
                                    <Package className="w-4 h-4" /> Itens do Pedido
                                  </h3>
                                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                    {parseItems(order.items).map((item, idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-start gap-3 p-3 bg-card border rounded-lg"
                                      >
                                        {item.image && (
                                          <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-12 h-12 rounded object-cover bg-muted"
                                          />
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium leading-tight">
                                            {item.name}
                                          </p>
                                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                            {item.size && (
                                              <Badge variant="outline" className="h-5 px-1.5">
                                                Tam: {item.size}
                                              </Badge>
                                            )}
                                            <span>Qtd: {item.quantity}</span>
                                          </div>
                                          <p className="text-sm font-medium mt-1">
                                            {formatCurrency(item.price, false)}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
