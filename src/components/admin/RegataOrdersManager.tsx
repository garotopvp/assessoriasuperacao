import { useState, useEffect, useMemo } from "react";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Search,
  Download,
  Copy,
  Check,
  Shirt,
  MessageCircle,
  Clock,
  CheckCircle2,
  PackageCheck,
  XCircle,
  Plus,
  Trash2,
  Eye,
  RefreshCw,
  DollarSign,
  Users,
  Layers,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { downloadCSV } from "@/utils/exportData";

const UNIT_PRICE = 62.99;
const SIZES = ["PP", "P", "M", "G", "GG", "XG", "XXG"] as const;
type SizeType = (typeof SIZES)[number];

interface RegataOrderItem {
  name: string;
  size: SizeType;
  quantity: number;
  price: number;
  total?: number;
}

interface RegataOrder {
  id: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  items: RegataOrderItem[];
  total_pieces: number;
  total_amount: number;
  status: "pending" | "paid" | "delivered" | "canceled";
  notes?: string;
  is_local_only?: boolean;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: any }
> = {
  pending: {
    label: "Pendente",
    color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    icon: Clock,
  },
  paid: {
    label: "Pago",
    color: "bg-green-500/10 text-green-400 border-green-500/30",
    icon: CheckCircle2,
  },
  delivered: {
    label: "Entregue",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    icon: PackageCheck,
  },
  canceled: {
    label: "Cancelado",
    color: "bg-neutral-800 text-neutral-400 border-neutral-700",
    icon: XCircle,
  },
};

export function RegataOrdersManager() {
  const [orders, setOrders] = useState<RegataOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sizeFilter, setSizeFilter] = useState<string>("all");
  const [copiedGrade, setCopiedGrade] = useState(false);

  // Modal Novo Pedido Manual
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newQuantities, setNewQuantities] = useState<Record<SizeType, number>>({
    PP: 0,
    P: 0,
    M: 0,
    G: 0,
    GG: 0,
    XG: 0,
    XXG: 0,
  });

  // Modal Detalhes do Pedido
  const [selectedOrder, setSelectedOrder] = useState<RegataOrder | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // 1. Buscar do Supabase
      const { data: dbOrders, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Aviso ao buscar pedidos no Supabase:", error);
      }

      // 2. Buscar também do backup local
      let localOrders: any[] = [];
      try {
        localOrders = JSON.parse(localStorage.getItem("regata_orders_backup") || "[]");
      } catch (err) {
        console.error("Local storage parse error:", err);
      }

      const mergedOrdersMap = new Map<string, RegataOrder>();

      // Adicionar do banco de dados (filtrando os que são da regata)
      (dbOrders || []).forEach((dbOrder) => {
        const address = typeof dbOrder.shipping_address === "object" && dbOrder.shipping_address !== null
          ? (dbOrder.shipping_address as Record<string, any>)
          : {};

        const isRegata =
          address.category === "lote_regata_znine" ||
          JSON.stringify(dbOrder.items).toLowerCase().includes("regata");

        if (isRegata) {
          let items: RegataOrderItem[] = [];
          if (Array.isArray(dbOrder.items)) {
            items = (dbOrder.items as any[]).map((item) => ({
              name: item.name || "Regata Cavada Superação",
              size: (item.size || "M") as SizeType,
              quantity: Number(item.quantity) || 1,
              price: Number(item.price) || UNIT_PRICE,
              total: (Number(item.quantity) || 1) * (Number(item.price) || UNIT_PRICE),
            }));
          }

          const totalPieces =
            items.reduce((sum, item) => sum + item.quantity, 0) ||
            address.total_pieces ||
            1;

          mergedOrdersMap.set(dbOrder.id, {
            id: dbOrder.id,
            created_at: dbOrder.created_at,
            customer_name: dbOrder.customer_name || address.student_name || "Aluno",
            customer_phone: address.phone || "",
            customer_email: dbOrder.customer_email || "",
            items,
            total_pieces: totalPieces,
            total_amount: Number(dbOrder.total) || totalPieces * UNIT_PRICE,
            status: (dbOrder.status as any) || "pending",
            notes: address.notes || "",
            is_local_only: false,
          });
        }
      });

      // Mesclar os locais que não estejam no mapa
      localOrders.forEach((locOrder) => {
        if (!mergedOrdersMap.has(locOrder.id)) {
          mergedOrdersMap.set(locOrder.id, {
            id: locOrder.id,
            created_at: locOrder.created_at || new Date().toISOString(),
            customer_name: locOrder.customer_name || "Aluno",
            customer_phone: locOrder.customer_phone || "",
            customer_email: locOrder.customer_email || "",
            items: locOrder.items || [],
            total_pieces: locOrder.total_pieces || 1,
            total_amount: locOrder.total_amount || UNIT_PRICE,
            status: locOrder.status || "pending",
            notes: locOrder.notes || "",
            is_local_only: true,
          });
        }
      });

      setOrders(Array.from(mergedOrdersMap.values()));
    } catch (err: any) {
      console.error("Erro ao listar pedidos:", err);
      toast.error("Erro ao carregar lista de pedidos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Totalizadores por tamanho
  const sizeTotals = useMemo(() => {
    const counts: Record<SizeType, number> = {
      PP: 0,
      P: 0,
      M: 0,
      G: 0,
      GG: 0,
      XG: 0,
      XXG: 0,
    };

    orders
      .filter((o) => o.status !== "canceled")
      .forEach((order) => {
        order.items.forEach((item) => {
          if (counts[item.size] !== undefined) {
            counts[item.size] += item.quantity;
          } else {
            counts.M += item.quantity;
          }
        });
      });

    const totalPieces = Object.values(counts).reduce((a, b) => a + b, 0);
    return { counts, totalPieces };
  }, [orders]);

  // Estatísticas gerais
  const stats = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== "canceled");
    const totalAmount = validOrders.reduce((sum, o) => sum + o.total_amount, 0);
    const paidAmount = orders
      .filter((o) => o.status === "paid" || o.status === "delivered")
      .reduce((sum, o) => sum + o.total_amount, 0);
    const pendingAmount = orders
      .filter((o) => o.status === "pending")
      .reduce((sum, o) => sum + o.total_amount, 0);

    return {
      totalOrders: validOrders.length,
      totalAmount,
      paidAmount,
      pendingAmount,
    };
  }, [orders]);

  // Filtros de busca
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_phone.includes(searchTerm) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      const matchesSize =
        sizeFilter === "all" ||
        order.items.some((item) => item.size === sizeFilter);

      return matchesSearch && matchesStatus && matchesSize;
    });
  }, [orders, searchTerm, statusFilter, sizeFilter]);

  // Alterar Status do Pedido
  const handleUpdateStatus = async (orderId: string, newStatus: RegataOrder["status"]) => {
    try {
      // Atualizar no Supabase se não for apenas local
      await supabase
        .from("orders")
        .update({ status: newStatus, payment_status: newStatus })
        .eq("id", orderId);

      // Atualizar no estado local e no backup
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );

      try {
        const local = JSON.parse(localStorage.getItem("regata_orders_backup") || "[]");
        const updatedLocal = local.map((o: any) =>
          o.id === orderId ? { ...o, status: newStatus } : o
        );
        localStorage.setItem("regata_orders_backup", JSON.stringify(updatedLocal));
      } catch (e) {
        console.error(e);
      }

      toast.success(`Status alterado para "${STATUS_CONFIG[newStatus]?.label || newStatus}"!`);
    } catch (err: any) {
      console.error("Erro ao alterar status:", err);
      toast.error("Não foi possível atualizar o status.");
    }
  };

  // Excluir Pedido
  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Tem certeza que deseja remover este pedido?")) return;

    try {
      await supabase.from("orders").delete().eq("id", orderId);

      setOrders((prev) => prev.filter((o) => o.id !== orderId));

      try {
        const local = JSON.parse(localStorage.getItem("regata_orders_backup") || "[]");
        const updatedLocal = local.filter((o: any) => o.id !== orderId);
        localStorage.setItem("regata_orders_backup", JSON.stringify(updatedLocal));
      } catch (e) {
        console.error(e);
      }

      toast.success("Pedido removido com sucesso.");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao remover pedido.");
    }
  };

  // Copiar Grade Formatada para Z-NINE
  const handleCopyGrade = () => {
    const today = new Date().toLocaleDateString("pt-BR");
    const lines = [
      `*GRADE DE PRODUÇÃO - REGATA CAVADA EQUIPE SUPERAÇÃO*`,
      `*Fornecedor:* Z-NINE Sports`,
      `*Data:* ${today}`,
      `*Preço Unitário:* R$ ${UNIT_PRICE.toFixed(2).replace(".", ",")}`,
      `----------------------------------------`,
      `PP: ${sizeTotals.counts.PP} un.`,
      `P:  ${sizeTotals.counts.P} un.`,
      `M:  ${sizeTotals.counts.M} un.`,
      `G:  ${sizeTotals.counts.G} un.`,
      `GG: ${sizeTotals.counts.GG} un.`,
      `XG: ${sizeTotals.counts.XG} un.`,
      `XXG: ${sizeTotals.counts.XXG} un.`,
      `----------------------------------------`,
      `*TOTAL GERAL: ${sizeTotals.totalPieces} REGATAS*`,
      `*Obs:* Modelo Cavada oficial com Proteção UV 50+ e Tecnologia DRY.`,
    ];

    const textToCopy = lines.join("\n");
    navigator.clipboard.writeText(textToCopy);
    setCopiedGrade(true);
    toast.success("Grade de produção copiada para o WhatsApp da Z-NINE!");
    setTimeout(() => setCopiedGrade(false), 3000);
  };

  // Exportar para CSV / Excel
  const handleExportCSV = () => {
    if (orders.length === 0) {
      toast.error("Nenhum pedido para exportar.");
      return;
    }

    const csvData = orders.map((o) => {
      const sizesText = o.items.map((i) => `${i.quantity}x ${i.size}`).join(", ");
      return {
        "ID Pedido": o.id.slice(0, 8),
        "Data": formatDate(o.created_at),
        "Nome do Aluno": o.customer_name,
        "WhatsApp": o.customer_phone,
        "Email": o.customer_email || "",
        "Tamanhos": sizesText,
        "Total Peças": o.total_pieces,
        "Valor Total (R$)": o.total_amount.toFixed(2).replace(".", ","),
        "Status": STATUS_CONFIG[o.status]?.label || o.status,
        "Observações": o.notes || "",
      };
    });

    downloadCSV(csvData, `pedidos_regata_superacao_znine_${new Date().toISOString().slice(0, 10)}`);
    toast.success(`${orders.length} pedidos exportados com sucesso!`);
  };

  // Criar Pedido Manual
  const handleCreateManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCustomerName.trim()) {
      toast.error("Informe o nome do aluno.");
      return;
    }

    const totalManualPieces = Object.values(newQuantities).reduce((a, b) => a + b, 0);
    if (totalManualPieces <= 0) {
      toast.error("Selecione pelo menos 1 regata.");
      return;
    }

    const manualItems = Object.entries(newQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([size, qty]) => ({
        name: "Regata Cavada Superação (Z-NINE)",
        size: size as SizeType,
        quantity: qty,
        price: UNIT_PRICE,
        total: qty * UNIT_PRICE,
      }));

    const totalAmount = totalManualPieces * UNIT_PRICE;
    const cleanPhone = newCustomerPhone.replace(/\D/g, "");

    const orderPayload = {
      customer_name: newCustomerName.trim(),
      customer_email: `${cleanPhone || "manual"}@superacao.com.br`,
      total: totalAmount,
      total_amount: totalAmount,
      status: "pending",
      payment_method: "manual",
      payment_status: "pending",
      items: manualItems,
      shipping_address: {
        phone: newCustomerPhone,
        notes: newNotes.trim() || null,
        category: "lote_regata_znine",
        product: "Regata Cavada Superação - Z-NINE",
        unit_price: UNIT_PRICE,
        total_pieces: totalManualPieces,
      },
    };

    try {
      const { data, error } = await supabase.from("orders").insert(orderPayload).select().single();
      const orderId = data?.id || `MAN-${Date.now().toString().slice(-6)}`;

      const newOrder: RegataOrder = {
        id: orderId,
        created_at: new Date().toISOString(),
        customer_name: newCustomerName.trim(),
        customer_phone: newCustomerPhone,
        items: manualItems,
        total_pieces: totalManualPieces,
        total_amount: totalAmount,
        status: "pending",
        notes: newNotes.trim(),
        is_local_only: !!error,
      };

      setOrders((prev) => [newOrder, ...prev]);

      // Salvar no backup local
      try {
        const local = JSON.parse(localStorage.getItem("regata_orders_backup") || "[]");
        local.unshift(newOrder);
        localStorage.setItem("regata_orders_backup", JSON.stringify(local));
      } catch (e) {
        console.error(e);
      }

      toast.success("Pedido manual adicionado com sucesso!");
      setIsAddModalOpen(false);
      setNewCustomerName("");
      setNewCustomerPhone("");
      setNewNotes("");
      setNewQuantities({ PP: 0, P: 0, M: 0, G: 0, GG: 0, XG: 0, XXG: 0 });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao registrar pedido manual.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com Ações Rápidas */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-neutral-900/60 p-5 rounded-2xl border border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Shirt className="w-6 h-6 text-orange-500" />
              Lote da Regata Cavada Superação (Z-NINE)
            </h2>
            <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30">
              R$ {UNIT_PRICE.toFixed(2).replace(".", ",")}
            </Badge>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Controle automático de pedidos, totalização por tamanho para confecção e exportação de relatórios.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            disabled={loading}
            className="border-neutral-700 bg-neutral-800/80 text-neutral-200 hover:bg-neutral-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>

          <Button
            size="sm"
            onClick={handleCopyGrade}
            className="bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700"
          >
            {copiedGrade ? (
              <>
                <Check className="w-4 h-4 mr-2 text-green-400" />
                Grade Copiada!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2 text-orange-400" />
                Copiar Grade p/ Z-NINE
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="border-neutral-700 bg-neutral-800/80 text-neutral-200 hover:bg-neutral-700"
          >
            <Download className="w-4 h-4 mr-2 text-blue-400" />
            Exportar CSV
          </Button>

          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-black font-bold"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Novo Pedido
          </Button>
        </div>
      </div>

      {/* Grade de Produção (Cards com Totais por Tamanho) */}
      <Card className="bg-neutral-900 border-neutral-800 text-white shadow-lg overflow-hidden">
        <CardHeader className="pb-3 border-b border-neutral-800/60 bg-neutral-950/40">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Layers className="w-4 h-4 text-orange-500" />
                Grade Consolidada para Fabricação (Z-NINE)
              </CardTitle>
              <CardDescription className="text-xs text-neutral-400">
                Soma automática de todas as regatas pedidas para envio direto à fábrica.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs text-neutral-400">Total de Peças:</span>{" "}
                <strong className="text-lg text-orange-400 font-extrabold">
                  {sizeTotals.totalPieces} un.
                </strong>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {SIZES.map((size) => {
              const count = sizeTotals.counts[size] || 0;
              return (
                <div
                  key={size}
                  onClick={() => setSizeFilter(sizeFilter === size ? "all" : size)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    sizeFilter === size
                      ? "bg-orange-500/20 border-orange-500 text-white ring-2 ring-orange-500/30"
                      : count > 0
                      ? "bg-neutral-950 border-neutral-800 hover:border-orange-500/50"
                      : "bg-neutral-950/40 border-neutral-900 opacity-60 hover:opacity-100"
                  }`}
                >
                  <div className="text-xs font-semibold text-neutral-400">Tam. {size}</div>
                  <div className="text-2xl font-black mt-1 text-white">{count}</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">
                    {count === 1 ? "peça" : "peças"}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cards de Métricas Financeiras */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-neutral-800/60">
            <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 flex items-center justify-between">
              <div>
                <div className="text-xs text-neutral-400">Previsão de Faturamento</div>
                <div className="text-base font-bold text-white mt-0.5">
                  R$ {stats.totalAmount.toFixed(2).replace(".", ",")}
                </div>
              </div>
              <DollarSign className="w-5 h-5 text-neutral-500" />
            </div>

            <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 flex items-center justify-between">
              <div>
                <div className="text-xs text-neutral-400">Confirmado / Pago</div>
                <div className="text-base font-bold text-green-400 mt-0.5">
                  R$ {stats.paidAmount.toFixed(2).replace(".", ",")}
                </div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>

            <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 flex items-center justify-between">
              <div>
                <div className="text-xs text-neutral-400">Pendente de Confirmação</div>
                <div className="text-base font-bold text-yellow-400 mt-0.5">
                  R$ {stats.pendingAmount.toFixed(2).replace(".", ",")}
                </div>
              </div>
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <Input
            placeholder="Buscar por aluno, telefone ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500 h-10"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendentes</option>
            <option value="paid">Pagos</option>
            <option value="delivered">Entregues</option>
            <option value="canceled">Cancelados</option>
          </select>

          <select
            value={sizeFilter}
            onChange={(e) => setSizeFilter(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
          >
            <option value="all">Todos os Tamanhos</option>
            {SIZES.map((s) => (
              <option key={s} value={s}>
                Tamanho {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela de Pedidos */}
      <Card className="bg-neutral-900 border-neutral-800 text-white overflow-hidden shadow-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-neutral-950/80 border-b border-neutral-800">
              <TableRow className="border-neutral-800 hover:bg-transparent">
                <TableHead className="text-neutral-400 font-semibold text-xs">Data</TableHead>
                <TableHead className="text-neutral-400 font-semibold text-xs">Aluno</TableHead>
                <TableHead className="text-neutral-400 font-semibold text-xs">WhatsApp</TableHead>
                <TableHead className="text-neutral-400 font-semibold text-xs">Tamanhos / Itens</TableHead>
                <TableHead className="text-neutral-400 font-semibold text-xs">Total (R$)</TableHead>
                <TableHead className="text-neutral-400 font-semibold text-xs">Status</TableHead>
                <TableHead className="text-right text-neutral-400 font-semibold text-xs pr-4">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-neutral-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-500" />
                    Carregando pedidos...
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-neutral-500">
                    <Shirt className="w-10 h-10 mx-auto mb-2 text-neutral-600" />
                    Nenhum pedido encontrado com os filtros atuais.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const statusConf = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                  const StatusIcon = statusConf.icon;
                  const cleanPhone = order.customer_phone.replace(/\D/g, "");

                  return (
                    <TableRow
                      key={order.id}
                      className="border-b border-neutral-800/60 hover:bg-neutral-800/40 transition-colors"
                    >
                      <TableCell className="text-xs text-neutral-400 whitespace-nowrap">
                        {formatDate(order.created_at)}
                      </TableCell>

                      <TableCell className="font-semibold text-white text-sm">
                        {order.customer_name}
                        {order.notes && (
                          <div className="text-[11px] text-neutral-400 font-normal line-clamp-1 max-w-[200px]">
                            Obs: {order.notes}
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        {cleanPhone ? (
                          <a
                            href={`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
                              `Olá, ${order.customer_name}! Estamos acompanhando seu pedido da Regata Oficial da Superação.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-green-400 hover:text-green-300 hover:underline"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            {order.customer_phone}
                          </a>
                        ) : (
                          <span className="text-xs text-neutral-500">-</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-1.5 max-w-[250px]">
                          {order.items.map((item, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="bg-neutral-950 border-neutral-700 text-neutral-200 text-xs px-2 py-0.5"
                            >
                              <strong className="text-orange-400 mr-1">{item.quantity}x</strong>{" "}
                              Tam. {item.size}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>

                      <TableCell className="font-bold text-white text-sm whitespace-nowrap">
                        R$ {order.total_amount.toFixed(2).replace(".", ",")}
                      </TableCell>

                      <TableCell>
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleUpdateStatus(order.id, e.target.value as RegataOrder["status"])
                          }
                          className={`text-xs font-semibold rounded-md px-2.5 py-1 border transition-colors cursor-pointer bg-neutral-950 ${statusConf.color}`}
                        >
                          <option value="pending" className="bg-neutral-900 text-yellow-400">
                            Pendente
                          </option>
                          <option value="paid" className="bg-neutral-900 text-green-400">
                            Pago
                          </option>
                          <option value="delivered" className="bg-neutral-900 text-blue-400">
                            Entregue
                          </option>
                          <option value="canceled" className="bg-neutral-900 text-neutral-400">
                            Cancelado
                          </option>
                        </select>
                      </TableCell>

                      <TableCell className="text-right pr-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedOrder(order)}
                            className="h-8 w-8 text-neutral-400 hover:text-white hover:bg-neutral-800"
                            title="Ver Detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteOrder(order.id)}
                            className="h-8 w-8 text-neutral-500 hover:text-red-400 hover:bg-red-500/10"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Detalhes do Pedido */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Shirt className="w-5 h-5 text-orange-500" />
              Detalhes do Pedido #{selectedOrder?.id.slice(0, 8)}
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-400">
              Registrado em {selectedOrder && formatDate(selectedOrder.created_at)}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 text-sm py-2">
              <div className="bg-neutral-950 p-3 rounded-lg space-y-1.5 text-xs">
                <div>
                  <span className="text-neutral-400">Aluno:</span>{" "}
                  <strong className="text-white text-sm">{selectedOrder.customer_name}</strong>
                </div>
                <div>
                  <span className="text-neutral-400">WhatsApp:</span>{" "}
                  <strong className="text-white">{selectedOrder.customer_phone}</strong>
                </div>
                {selectedOrder.customer_email && (
                  <div>
                    <span className="text-neutral-400">E-mail:</span>{" "}
                    <span className="text-neutral-300">{selectedOrder.customer_email}</span>
                  </div>
                )}
                {selectedOrder.notes && (
                  <div>
                    <span className="text-neutral-400">Observações:</span>{" "}
                    <span className="text-neutral-300">{selectedOrder.notes}</span>
                  </div>
                )}
              </div>

              <div>
                <div className="text-xs font-semibold text-neutral-400 mb-2">Peças Selecionadas:</div>
                <div className="space-y-1.5">
                  {selectedOrder.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 text-xs"
                    >
                      <span className="font-semibold text-white">
                        {item.quantity}x Tam. {item.size}
                      </span>
                      <span className="text-orange-400 font-bold">
                        R$ {(item.quantity * item.price).toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-neutral-800 text-base">
                <span className="font-bold text-neutral-300">Valor Total:</span>
                <span className="font-extrabold text-xl text-orange-400">
                  R$ {selectedOrder.total_amount.toFixed(2).replace(".", ",")}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setSelectedOrder(null)}
              className="border-neutral-700 text-neutral-300"
            >
              Fechar
            </Button>
            {selectedOrder?.customer_phone && (
              <Button
                asChild
                className="bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold"
              >
                <a
                  href={`https://wa.me/55${selectedOrder.customer_phone.replace(
                    /\D/g,
                    ""
                  )}?text=${encodeURIComponent(
                    `Olá, ${selectedOrder.customer_name}! Passando para confirmar seu pedido da Regata Oficial Superação.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Abrir WhatsApp
                </a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Adicionar Pedido Manual */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-orange-500" />
              Adicionar Pedido Manual
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-400">
              Insira os dados do aluno que solicitou presencialmente no treino.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateManualOrder} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-neutral-300">Nome do Aluno *</Label>
              <Input
                required
                placeholder="Ex: Carlos Eduardo"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-white text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-neutral-300">WhatsApp</Label>
              <Input
                placeholder="(13) 99999-9999"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-white text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-neutral-300">Grade de Tamanhos</Label>
              <div className="grid grid-cols-4 gap-2">
                {SIZES.map((size) => (
                  <div key={size} className="bg-neutral-950 p-2 rounded-lg border border-neutral-800 text-center">
                    <div className="text-xs font-bold text-neutral-300">{size}</div>
                    <input
                      type="number"
                      min="0"
                      value={newQuantities[size] || 0}
                      onChange={(e) =>
                        setNewQuantities((prev) => ({
                          ...prev,
                          [size]: Math.max(0, parseInt(e.target.value) || 0),
                        }))
                      }
                      className="w-full text-center bg-transparent border-none text-white font-bold text-sm mt-1 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-neutral-300">Observações</Label>
              <Input
                placeholder="Ex: Pagamento entregue em dinheiro no treino..."
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-white text-sm"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                className="border-neutral-700 text-neutral-300"
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-black font-bold">
                Salvar Pedido
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
