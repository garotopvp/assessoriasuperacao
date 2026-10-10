import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  ShoppingBag,
  BarChart3,
  Search,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Repeat,
} from "lucide-react";
import { CashFlowAnalytics } from "./CashFlowAnalytics";
import { ExpensesManager } from "./ExpensesManager";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const monthNames = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
const yearOptions = ["2024", "2025", "2026", "2027", "2028"];

// ─── MINI KPI CARD ──────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  sub,
  color,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  color: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="flex flex-col gap-2 p-5 bg-background rounded-2xl border border-border/50 shadow-sm">
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-xl ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        {trend === "up" && <ArrowUpRight className="w-4 h-4 text-emerald-500" />}
        {trend === "down" && <ArrowDownRight className="w-4 h-4 text-rose-500" />}
      </div>
      <div>
        <div className="text-2xl font-black text-foreground tracking-tight">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </div>
      <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

// ─── PAINEL DE RECEITAS (EXTRATO) ────────────────────────────────────────────
function ReceitasPanel({
  selectedMonth,
  selectedYear,
}: {
  selectedMonth: string;
  selectedYear: string;
}) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data: orders = [] } = useQuery({
    queryKey: ["fin-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select(
          "id, created_at, customer_name, customer_email, total, status, items, payment_method, payment_provider"
        )
        .order("created_at", { ascending: false })
        .limit(1500);
      return data || [];
    },
  });

  const { data: subs = [] } = useQuery({
    queryKey: ["fin-subs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("recurring_subscriptions")
        .select("id, started_at, student_name, student_email, amount, status, plan_name")
        .order("started_at", { ascending: false })
        .limit(1500);
      return data || [];
    },
  });

  const filtered = useMemo(() => {
    const month = parseInt(selectedMonth);
    const year = parseInt(selectedYear);

    const orderRows = orders
      .filter((o: any) => {
        const d = new Date(o.created_at);
        return d.getMonth() === month && d.getFullYear() === year;
      })
      .map((o: any) => ({
        id: o.id,
        type: "loja" as const,
        date: new Date(o.created_at),
        name: o.customer_name || "—",
        email: o.customer_email || "—",
        desc: Array.isArray(o.items)
          ? o.items.map((i: any) => `${i.quantity || 1}x ${i.name || i.product_name}`).join(", ")
          : "Compra Avulsa",
        amount: Number(o.total) || 0,
        status: o.status,
        method: o.payment_method || o.payment_provider || "—",
      }));

    const subRows = subs
      .filter((s: any) => {
        const d = new Date(s.started_at || new Date());
        return d.getMonth() === month && d.getFullYear() === year;
      })
      .map((s: any) => ({
        id: s.id,
        type: "assinatura" as const,
        date: new Date(s.started_at || new Date()),
        name: s.student_name || "—",
        email: s.student_email || "—",
        desc: `Plano ${s.plan_name || "Padrão"}`,
        amount: Number(s.amount) || 0,
        status: s.status,
        method: "Recorrente",
      }));

    const all = [...orderRows, ...subRows].sort((a, b) => b.date.getTime() - a.date.getTime());

    return all.filter((row) => {
      const matchType = activeTab === "all" || row.type === activeTab;
      const matchSearch =
        !search ||
        row.name.toLowerCase().includes(search.toLowerCase()) ||
        row.desc.toLowerCase().includes(search.toLowerCase()) ||
        row.email.toLowerCase().includes(search.toLowerCase());
      return matchType && matchSearch;
    });
  }, [orders, subs, selectedMonth, selectedYear, activeTab, search]);

  const totalAssinaturas = filtered
    .filter((r) => r.type === "assinatura" && (r.status === "active" || r.status === "paid"))
    .reduce((a, r) => a + r.amount, 0);
  const totalLoja = filtered
    .filter((r) => r.type === "loja" && r.status === "paid")
    .reduce((a, r) => a + r.amount, 0);
  const totalReceitas = totalAssinaturas + totalLoja;

  const statusBadge = (status: string) => {
    if (status === "paid" || status === "active")
      return (
        <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[10px]">
          Pago/Ativo
        </Badge>
      );
    if (status === "pending" || status === "awaiting_payment")
      return (
        <Badge className="bg-yellow-500/10 text-yellow-600 border-none text-[10px]">Pendente</Badge>
      );
    if (status === "refunded")
      return (
        <Badge className="bg-orange-500/10 text-orange-600 border-none text-[10px]">
          Estornado
        </Badge>
      );
    return (
      <Badge variant="outline" className="text-[10px]">
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Mini KPIs de Receita */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard
          label="Total Receitas"
          value={formatCurrency(totalReceitas, false)}
          icon={TrendingUp}
          color="bg-emerald-500/10 text-emerald-600"
          trend="up"
        />
        <KpiCard
          label="Assinaturas"
          value={formatCurrency(totalAssinaturas, false)}
          sub={`${filtered.filter((r) => r.type === "assinatura").length} lançamentos`}
          icon={Repeat}
          color="bg-blue-500/10 text-blue-600"
        />
        <KpiCard
          label="Loja / Produtos"
          value={formatCurrency(totalLoja, false)}
          sub={`${filtered.filter((r) => r.type === "loja").length} pedidos`}
          icon={ShoppingBag}
          color="bg-purple-500/10 text-purple-600"
        />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-9">
            <TabsTrigger value="all" className="text-xs px-3">
              Tudo
            </TabsTrigger>
            <TabsTrigger value="assinatura" className="text-xs px-3">
              Assinaturas
            </TabsTrigger>
            <TabsTrigger value="loja" className="text-xs px-3">
              Loja / Produtos
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-[11px] uppercase tracking-wider font-bold">Data</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-bold">
                Cliente
              </TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-bold">
                Descrição
              </TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-bold">Tipo</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-bold">
                Status
              </TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-bold text-right">
                Valor
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                  Nenhuma receita encontrada neste período.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={`${row.type}-${row.id}`} className="hover:bg-muted/20">
                  <TableCell className="text-sm text-muted-foreground">
                    {format(row.date, "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{row.name}</div>
                    <div className="text-xs text-muted-foreground">{row.email}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[250px] truncate">
                    {row.desc}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] gap-1">
                      {row.type === "assinatura" ? (
                        <>
                          <Repeat className="w-3 h-3" /> Assinatura
                        </>
                      ) : (
                        <>
                          <Package className="w-3 h-3" /> Produto
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>{statusBadge(row.status)}</TableCell>
                  <TableCell className="text-right font-bold text-emerald-600">
                    +{formatCurrency(row.amount, false)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL  ───────────────────────────────────────────────────
export function FinanceiroDashboard() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  // KPIs globais
  const { data: kpiData } = useQuery({
    queryKey: ["fin-kpis", selectedMonth, selectedYear],
    queryFn: async () => {
      const month = parseInt(selectedMonth);
      const year = parseInt(selectedYear);
      // Obter o último dia real do mês selecionado
      const lastDay = new Date(year, month + 1, 0).getDate();
      const monthStr = String(month + 1).padStart(2, "0");
      const startDate = `${year}-${monthStr}-01`;
      const endDate = `${year}-${monthStr}-${String(lastDay).padStart(2, "0")}`;
      const startDateTime = `${startDate}T00:00:00`;
      const endDateTime = `${endDate}T23:59:59`;

      const [{ data: orders }, { data: subs }, { data: expenses }, { data: revenues }] = await Promise.all([
        supabase
          .from("orders")
          .select("total, status, created_at")
          .gte("created_at", startDateTime)
          .lte("created_at", endDateTime),
        supabase
          .from("recurring_subscriptions")
          .select("amount, status, plan_name")
          .in("status", ["active", "paid"]),
        supabase
          .from("financial_expenses")
          .select("amount, status, due_date, paid_at"),
        supabase
          .from("financial_revenue")
          .select("amount, status, received_at")
          .gte("received_at", startDate)
          .lte("received_at", endDate),
      ]);

      const getPlanPeriodMonths = (planName: string): number => {
        const name = (planName || "").toLowerCase();
        if (name.includes("trimestral")) return 3;
        if (name.includes("semestral")) return 6;
        if (name.includes("anual")) return 12;
        return 1;
      };

      const receitasRealizadas =
        (orders || [])
          .filter((o: any) => o.status === "paid")
          .reduce((a: number, o: any) => a + Number(o.total), 0) +
        (revenues || [])
          .filter((r: any) => r.status === "received" || r.status === "paid")
          .reduce((a: number, r: any) => a + Number(r.amount), 0);

      const mrr = (subs || [])
        .filter((s: any) => s.status === "active" || s.status === "paid")
        .reduce((a: number, s: any) => {
          const period = getPlanPeriodMonths(s.plan_name || "");
          return a + Number(s.amount) / period;
        }, 0);

      const filteredExpenses = (expenses || []).filter((expense: any) => {
        if (!expense.due_date) return false;
        
        // Lógica idêntica ao ExpensesManager:
        // Se a despesa está paga E tem data de pagamento real (paid_at),
        // filtramos pela data real do pagamento.
        const dateSource = (expense.status === "paid" && expense.paid_at)
          ? expense.paid_at
          : expense.due_date;

        const ds = dateSource.split('T')[0];
        const [y, m, d] = ds.split('-');
        const dtSafe = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
        
        return dtSafe.getMonth() === month && dtSafe.getFullYear() === year;
      });

      const despesas = filteredExpenses.reduce((a: number, e: any) => a + Number(e.amount), 0);
      const despesasPagas = filteredExpenses
        .filter((e: any) => e.status === "paid")
        .reduce((a: number, e: any) => a + Number(e.amount), 0);
      const despesasPendentes = filteredExpenses
        .filter((e: any) => e.status === "pending")
        .reduce((a: number, e: any) => a + Number(e.amount), 0);

      return {
        receitas: receitasRealizadas,
        mrr,
        despesas,
        despesasPagas,
        despesasPendentes,
        lucroLiquido: receitasRealizadas - despesas,
        margem: receitasRealizadas > 0 ? ((receitasRealizadas - despesas) / receitasRealizadas) * 100 : 0,
      };
    },
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ── HEADER GLOBAL ── */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2.5 rounded-xl">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Visão Geral Financeira</h2>
              <p className="text-sm text-white/60 mt-0.5">
                DRE · Receitas · Despesas · Assinaturas · Loja
              </p>
            </div>
          </div>
          {/* Seletores de Período */}
          <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-36 bg-white/10 border-white/20 text-white h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthNames.map((m, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-24 bg-white/10 border-white/20 text-white h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPI Cards Globais */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-6">
          {[
            {
              label: "Entradas Reais (Extrato)",
              value: formatCurrency(kpiData?.receitas ?? 0, false),
              icon: TrendingUp,
              color: "text-emerald-400",
            },
            {
              label: "MRR (Projeção Mensal)",
              value: formatCurrency(kpiData?.mrr ?? 0, false),
              icon: Activity,
              color: "text-blue-400",
            },
            {
              label: "Total Despesas",
              value: formatCurrency(kpiData?.despesas ?? 0, false),
              icon: TrendingDown,
              color: "text-rose-400",
            },
            {
              label: "Lucro Líquido",
              value: formatCurrency(kpiData?.lucroLiquido ?? 0, false),
              icon: DollarSign,
              color: (kpiData?.lucroLiquido ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400",
            },
            {
              label: "Margem Líquida",
              value: `${(kpiData?.margem ?? 0).toFixed(1)}%`,
              icon: Activity,
              color: "text-blue-400",
            },
            {
              label: "Despesas Pend.",
              value: formatCurrency(kpiData?.despesasPendentes ?? 0, false),
              icon: AlertCircle,
              color: "text-orange-400",
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white/5 rounded-xl p-4 border border-white/10">
              <Icon className={`w-4 h-4 ${color} mb-2`} />
              <div className={`text-lg font-black ${color}`}>{value}</div>
              <div className="text-[10px] text-white/50 uppercase tracking-widest mt-0.5 font-semibold">
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── BLOCO 1: DRE / ANALYTICS ─────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-500/10 text-blue-600 p-2 rounded-xl">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">DRE Simplificado & MRR</h3>
            <p className="text-xs text-muted-foreground">
              Evolução de caixa e receita recorrente mensal
            </p>
          </div>
        </div>
        <div className="bg-background rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <CashFlowAnalytics selectedMonth={selectedMonth} selectedYear={selectedYear} />
        </div>
      </section>

      {/* ── BLOCO 2: RECEITAS (EXTRATO) ───────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-emerald-500/10 text-emerald-600 p-2 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Contas a Receber — Extrato</h3>
            <p className="text-xs text-muted-foreground">
              Assinaturas ativas + pedidos da loja (bonés, etc.)
            </p>
          </div>
        </div>
        <div className="bg-background rounded-2xl border border-border/50 shadow-sm p-6">
          <ReceitasPanel selectedMonth={selectedMonth} selectedYear={selectedYear} />
        </div>
      </section>

      {/* ── BLOCO 3: CONTAS A PAGAR ───────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-rose-500/10 text-rose-600 p-2 rounded-xl">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Contas a Pagar / Custos</h3>
            <p className="text-xs text-muted-foreground">
              Todos os lançamentos de despesas e custos operacionais
            </p>
          </div>
        </div>
        <div className="bg-background rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <ExpensesManager selectedMonth={selectedMonth} selectedYear={selectedYear} />
        </div>
      </section>
    </div>
  );
}
