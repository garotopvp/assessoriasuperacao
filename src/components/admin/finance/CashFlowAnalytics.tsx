import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  DollarSign,
  Wallet,
  TrendingUp,
  BarChart3,
  ShoppingCart,
  AlertCircle,
  PieChart as PieIcon,
  CheckCircle2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 backdrop-blur-xl border border-border/50 p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] min-w-[200px] animate-in zoom-in-95 duration-200">
        <p className="font-bold text-sm mb-3 text-foreground tracking-tight">{label}</p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between items-center gap-4 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground font-medium">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}
              </span>
              <span className="font-black text-foreground drop-shadow-sm">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(entry.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function CashFlowAnalytics({ 
  selectedMonth = new Date().getMonth().toString(), 
  selectedYear = new Date().getFullYear().toString() 
}: { 
  selectedMonth?: string; 
  selectedYear?: string; 
}) {
  const [timeRange, setTimeRange] = useState<"diario" | "semanal" | "mensal" | "trimestral">(
    "mensal"
  );

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["cashflow_analytics", "chart", timeRange, selectedMonth, selectedYear],
    queryFn: async () => {
      const month = parseInt(selectedMonth);
      const year = parseInt(selectedYear);
      const targetDate = new Date(year, month, 15); // Meio do mês para evitar bugs de timezone
      // Calculando receita previsível das ultimas assinaturas ativas
      const { data: subs, error: subsError } = await supabase
        .from("recurring_subscriptions")
        .select("amount, status, created_at, plan_name")
        .eq("status", "active");

      // Custos listados
      const { data: expenses, error: expError } = await supabase
        .from("financial_expenses")
        .select("amount, status, type, due_date, paid_at, category");

      // Pedidos / Vendas Avulsas via Stripe e OpenPix
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("total, status, created_at, payment_provider")
        .in("status", ["paid", "refunded"]); // Agora pegamos estornos também

      // Entradas Manuais (PIX, Dinheiro)
      const { data: revenues, error: revError } = await supabase
        .from("financial_revenue")
        .select("amount, status, received_at")
        .in("status", ["received", "paid"]);

      if (subsError || expError || ordersError || revError) {
        console.error("error fetching analytics data");
        return {
          totalMRR: 0,
          totalExpenses: 0,
          totalOrders: 0,
          totalRefunds: 0,
          netProfit: 0,
          chartData: [],
        };
      }

      // Função auxiliar para obter o período do plano em meses
      const getPlanPeriodMonths = (planName: string): number => {
        const name = (planName || "").toLowerCase();
        if (name.includes("trimestral")) return 3;
        if (name.includes("semestral")) return 6;
        if (name.includes("anual")) return 12;
        return 1;
      };

      // Receita recorrente MRR (Mês Atual) - Dividido pelo período para refletir o valor mensal real
      const mrr = subs?.reduce((acc, sub) => {
        const period = getPlanPeriodMonths(sub.plan_name || "");
        return acc + Number(sub.amount) / period;
      }, 0) || 0;

      const now = targetDate;
      // Filtrar custos apenas do mês atual para o card principal
      const exps =
        expenses
          ?.filter((exp) => {
            if (!exp.due_date) return false;
            
            // Lógica idêntica ao ExpensesManager
            const dateSource = (exp.status === "paid" && exp.paid_at)
              ? exp.paid_at
              : exp.due_date;

            const ds = dateSource.split('T')[0];
            const [y, m, d] = ds.split('-');
            const dtSafe = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);

            return dtSafe.getMonth() === now.getMonth() && dtSafe.getFullYear() === now.getFullYear();
          })
          .reduce((acc, exp) => acc + Number(exp.amount), 0) || 0;

      // Filtrar Vendas Avulsas do Mês Atual (Stripe e OpenPix) - APENAS PAGAS
      const currentMonthOrders =
        orders
          ?.filter((ord) => {
            if (!ord.created_at || ord.status !== "paid") return false;
            const d = new Date(ord.created_at);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          })
          .reduce((acc, ord) => acc + Number(ord.total || 0), 0) || 0;

      // Filtrar Estornos (Refunded) do Mês Atual
      const currentMonthRefunds =
        orders
          ?.filter((ord) => {
            if (!ord.created_at || ord.status !== "refunded") return false;
            const d = new Date(ord.created_at);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          })
          .reduce((acc, ord) => acc + Number(ord.total || 0), 0) || 0;

      const currentMonthRevenues =
        revenues
          ?.filter((rev) => {
            if (!rev.received_at || (rev.status !== "received" && rev.status !== "paid")) return false;
            const d = new Date(rev.received_at);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          })
          .reduce((acc, rev) => acc + Number(rev.amount || 0), 0) || 0;

      // Receita REALIZADA (Baseada no Extrato e Lançamentos Reais)
      const realizedRevenue = currentMonthOrders + currentMonthRevenues;
      
      // Caixa Líquido REAL: O que entrou de fato - (O que saiu + Estornos)
      const profit = realizedRevenue - (exps + currentMonthRefunds);

      // ---- Construção Dinâmica para o Gráfico ----
      const chartData: any[] = [];
      const monthNames = [
        "Jan",
        "Fev",
        "Mar",
        "Abr",
        "Mai",
        "Jun",
        "Jul",
        "Ago",
        "Set",
        "Out",
        "Nov",
        "Dez",
      ];

      if (timeRange === "diario") {
        for (let i = 14; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
          chartData.push({
            name: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
            dateObj: d,
            Receitas: 0,
            Vendas: 0,
            Despesas: 0,
            Estornos: 0,
          });
        }
      } else if (timeRange === "semanal") {
        for (let i = 7; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 7);
          const weekStart = new Date(d);
          weekStart.setDate(d.getDate() - d.getDay());
          chartData.push({
            name: `Sem ${String(weekStart.getDate()).padStart(2, "0")}/${String(weekStart.getMonth() + 1).padStart(2, "0")}`,
            dateObj: weekStart,
            Receitas: 0,
            Vendas: 0,
            Despesas: 0,
            Estornos: 0,
          });
        }
      } else if (timeRange === "mensal") {
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          chartData.push({
            name: monthNames[d.getMonth()],
            monthIndex: d.getMonth(),
            year: d.getFullYear(),
            Receitas: 0,
            Vendas: 0,
            Despesas: 0,
            Estornos: 0,
          });
        }
      } else if (timeRange === "trimestral") {
        for (let i = 3; i >= 0; i--) {
          const currentQuarter = Math.floor(now.getMonth() / 3);
          let q = currentQuarter - i;
          let y = now.getFullYear();
          if (q < 0) {
            q += 4;
            y -= 1;
          }
          chartData.push({
            name: `Tri ${q + 1} ${y}`,
            quarter: q,
            year: y,
            Receitas: 0,
            Vendas: 0,
            Despesas: 0,
            Estornos: 0,
          });
        }
      }

      // Removemos o preenchimento automático das barras com base no MRR teórico
      // pois o usuário deseja apenas fluxo de caixa REAL (Baseado em ordens e receitas no extrato).
      /*
      subs?.forEach((sub) => {
        if (!sub.created_at) return;
        const d = new Date(sub.created_at);

        const period = getPlanPeriodMonths(sub.plan_name || "");
        const monthlyAmount = Number(sub.amount) / period;

        chartData.forEach((m) => {
          if (timeRange === "diario") {
            // Dividimos o valor mensal por 30 pra ver quanto significa por dia
            if (m.dateObj.getTime() >= new Date(d.setHours(0, 0, 0, 0)).getTime())
              m.Receitas += monthlyAmount / 30;
          } else if (timeRange === "semanal") {
            if (m.dateObj.getTime() >= new Date(d.setHours(0, 0, 0, 0)).getTime())
              m.Receitas += monthlyAmount / 4;
          } else if (timeRange === "mensal") {
            if (
              m.year > d.getFullYear() ||
              (m.year === d.getFullYear() && m.monthIndex >= d.getMonth())
            ) {
              m.Receitas += monthlyAmount;
            }
          } else if (timeRange === "trimestral") {
            const subQ = Math.floor(d.getMonth() / 3);
            if (m.year > d.getFullYear() || (m.year === d.getFullYear() && m.quarter >= subQ)) {
              m.Receitas += monthlyAmount * 3;
            }
          }
        });
      });
      */

      // Preencher Despesas
      expenses?.forEach((exp: any) => {
        if (!exp.due_date) return;
        
        const dateSource = (exp.status === "paid" && exp.paid_at)
          ? exp.paid_at
          : exp.due_date;

        const ds = dateSource.split('T')[0];
        const [y, m, dNum] = ds.split('-');
        const d = new Date(Number(y), Number(m) - 1, Number(dNum), 12, 0, 0);

        chartData.forEach((m) => {
          let match = false;
          if (timeRange === "diario") {
            match =
              d.getDate() === m.dateObj.getDate() &&
              d.getMonth() === m.dateObj.getMonth() &&
              d.getFullYear() === m.dateObj.getFullYear();
          } else if (timeRange === "semanal") {
            const expWeekStart = new Date(d);
            expWeekStart.setDate(d.getDate() - d.getDay());
            match =
              expWeekStart.getDate() === m.dateObj.getDate() &&
              expWeekStart.getMonth() === m.dateObj.getMonth() &&
              expWeekStart.getFullYear() === m.dateObj.getFullYear();
          } else if (timeRange === "mensal") {
            match = m.year === d.getFullYear() && m.monthIndex === d.getMonth();
          } else if (timeRange === "trimestral") {
            match = m.year === d.getFullYear() && m.quarter === Math.floor(d.getMonth() / 3);
          }

          if (match) {
            m.Despesas += Number(exp.amount);
          }
        });
      });

      // Preencher Pedidos (Stripe/Pix)
      orders?.forEach((ord) => {
        if (!ord.created_at) return;
        const d = new Date(ord.created_at);

        chartData.forEach((m) => {
          let match = false;
          if (timeRange === "diario") {
            match =
              d.getDate() === m.dateObj.getDate() &&
              d.getMonth() === m.dateObj.getMonth() &&
              d.getFullYear() === m.dateObj.getFullYear();
          } else if (timeRange === "semanal") {
            const ordWeekStart = new Date(d);
            ordWeekStart.setDate(d.getDate() - d.getDay());
            match =
              ordWeekStart.getDate() === m.dateObj.getDate() &&
              ordWeekStart.getMonth() === m.dateObj.getMonth() &&
              ordWeekStart.getFullYear() === m.dateObj.getFullYear();
          } else if (timeRange === "mensal") {
            match = m.year === d.getFullYear() && m.monthIndex === d.getMonth();
          } else if (timeRange === "trimestral") {
            match = m.year === d.getFullYear() && m.quarter === Math.floor(d.getMonth() / 3);
          }

          if (match) {
            if (ord.status === "paid") {
              m.Vendas += Number(ord.total || 0);
            } else if (ord.status === "refunded") {
              m.Estornos += Number(ord.total || 0);
            }
          }
        });
      });

      // Preencher Entradas Manuais
      revenues?.forEach((rev) => {
        if (!rev.received_at) return;
        const d = new Date(rev.received_at);

        chartData.forEach((m) => {
          let match = false;
          if (timeRange === "diario") {
            match =
              d.getDate() === m.dateObj.getDate() &&
              d.getMonth() === m.dateObj.getMonth() &&
              d.getFullYear() === m.dateObj.getFullYear();
          } else if (timeRange === "semanal") {
            const revWeekStart = new Date(d);
            revWeekStart.setDate(d.getDate() - d.getDay());
            match =
              revWeekStart.getDate() === m.dateObj.getDate() &&
              revWeekStart.getMonth() === m.dateObj.getMonth() &&
              revWeekStart.getFullYear() === m.dateObj.getFullYear();
          } else if (timeRange === "mensal") {
            match = m.year === d.getFullYear() && m.monthIndex === d.getMonth();
          } else if (timeRange === "trimestral") {
            match = m.year === d.getFullYear() && m.quarter === Math.floor(d.getMonth() / 3);
          }

          if (match) {
            if (rev.status === "received" || rev.status === "paid") {
              m.Vendas += Number(rev.amount || 0);
            }
          }
        });
      });

      // ---- Distribuição por Categoria (Pie Chart) ----
      const categoriesMap = new Map();
      expenses?.forEach((exp: any) => {
        if (!exp.due_date) return;
        const dateSource = (exp.status === "paid" && exp.paid_at) ? exp.paid_at : exp.due_date;
        const ds = dateSource.split('T')[0];
        const [y, m, d] = ds.split('-');
        const dtSafe = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);

        if (dtSafe.getMonth() === now.getMonth() && dtSafe.getFullYear() === now.getFullYear()) {
          const cat = exp.category || "Outros";
          categoriesMap.set(cat, (categoriesMap.get(cat) || 0) + Number(exp.amount));
        }
      });

      const pieData = Array.from(categoriesMap.entries()).map(([name, value]) => ({
        name,
        value,
      })).sort((a, b) => b.value - a.value);

      return {
        totalMRR: mrr,
        totalExpenses: exps,
        totalOrders: currentMonthOrders + currentMonthRevenues,
        totalRefunds: currentMonthRefunds,
        netProfit: profit,
        chartData,
        pieData,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-muted/30 h-[140px] rounded-2xl animate-pulse border border-border/50"></div>
          <div className="bg-muted/30 h-[140px] rounded-2xl animate-pulse border border-border/50"></div>
          <div className="bg-muted/30 h-[140px] rounded-2xl animate-pulse border border-border/50"></div>
        </div>
        <div className="bg-muted/30 h-[380px] rounded-2xl animate-pulse border border-border/50"></div>
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val || 0);
  };

  const mrr = analytics?.totalMRR || 0;
  const exps = analytics?.totalExpenses || 0;
  const ords = analytics?.totalOrders || 0;
  const refunds = analytics?.totalRefunds || 0;
  const profit = analytics?.netProfit || 0;
  const chartData = analytics?.chartData || [];
  const pieData = analytics?.pieData || [];

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40 pb-6">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2.5 text-foreground tracking-tight">
            <div className="bg-primary/10 p-2 rounded-xl border border-primary/20">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            DRE e Fluxo de Caixa
          </h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-lg">
            Acompanhamento de DRE (Demonstrativo de Resultados) e previsibilidade de caixa baseada
            em assinaturas e custos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        {/* Card Entradas */}
        <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-background/50 p-6 shadow-sm transition-all hover:bg-background hover:shadow-md">
          <div className="absolute right-0 top-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-indigo-500/10 blur-2xl transition-all group-hover:bg-indigo-500/20" />
          <div className="relative z-10">
            <div className="flex items-center justify-between text-muted-foreground mb-4">
              <span className="text-[11px] font-bold tracking-widest uppercase">
                Entradas (Mês)
              </span>
              <div className="bg-indigo-500/10 p-2 rounded-lg">
                <ShoppingCart className="h-4 w-4 text-indigo-500" />
              </div>
            </div>
            <div className="text-3xl lg:text-4xl font-black text-foreground tracking-tight">
              {formatCurrency(ords)}
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs lg:text-sm font-medium text-indigo-500">
              <CheckCircle2 className="h-3 w-3" />
              <span>Vendas e Pix (Extrato)</span>
            </div>
          </div>
        </div>

        {/* Card Custos */}
        <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-background/50 p-6 shadow-sm transition-all hover:bg-background hover:shadow-md">
          <div className="absolute right-0 top-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-rose-500/10 blur-2xl transition-all group-hover:bg-rose-500/20" />
          <div className="relative z-10">
            <div className="flex items-center justify-between text-muted-foreground mb-4">
              <span className="text-[11px] font-bold tracking-widest uppercase">Custos do Mês</span>
              <div className="bg-rose-500/10 p-2 rounded-lg">
                <Wallet className="h-4 w-4 text-rose-500" />
              </div>
            </div>
            <div className="text-3xl lg:text-3xl font-black text-foreground tracking-tight">
              {formatCurrency(exps)}
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs lg:text-sm font-medium text-rose-500">
              <ArrowDownRight className="h-3 w-3" />
              <span>Despesas Fixas</span>
            </div>
          </div>
        </div>

        {/* Card Estornos */}
        <div className="group relative overflow-hidden rounded-2xl border border-orange-500/30 bg-orange-500/5 p-6 shadow-sm transition-all hover:bg-orange-500/10 hover:shadow-md">
          <div className="absolute right-0 top-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-orange-500/20 blur-2xl transition-all group-hover:bg-orange-500/30" />
          <div className="relative z-10">
            <div className="flex items-center justify-between text-orange-600/80 dark:text-orange-400 mb-4">
              <span className="text-[11px] font-bold tracking-widest uppercase">
                Total Estornado
              </span>
              <div className="bg-orange-500/20 p-2 rounded-lg">
                <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="text-3xl lg:text-3xl font-black text-orange-600 dark:text-orange-400 tracking-tight">
              {formatCurrency(refunds)}
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs lg:text-sm font-medium text-orange-600/80 dark:text-orange-400">
              <ArrowDownRight className="h-3 w-3" />
              <span>Pedidos devolvidos</span>
            </div>
          </div>
        </div>

        {/* Card Margem Bruta / Caixa Líquido */}
        <div className={`group relative overflow-hidden rounded-2xl border ${profit < 0 ? 'border-rose-500/30 bg-rose-500/5' : 'border-primary/20 bg-gradient-to-br from-primary/5 to-background'} p-6 shadow-sm transition-all hover:shadow-md ${profit < 0 ? 'hover:border-rose-500/50' : 'hover:border-primary/40'}`}>
          {/* Barra de destaque inferior */}
          <div className={`absolute inset-x-0 bottom-0 h-1.5 ${profit < 0 ? 'bg-rose-500' : 'bg-gradient-to-r from-primary to-primary/60'}`} />
          <div className={`absolute -right-6 -top-6 h-32 w-32 rounded-full ${profit < 0 ? 'bg-rose-500/10' : 'bg-primary/10'} blur-3xl transition-all group-hover:blur-2xl`} />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className={`text-[11px] font-bold tracking-widest uppercase ${profit < 0 ? 'text-rose-600' : 'text-primary'}`}>
                Caixa Líquido
              </span>
              <div className={`${profit < 0 ? 'bg-rose-500/10' : 'bg-primary/10'} p-2 rounded-lg`}>
                <TrendingUp className={`h-4 w-4 ${profit < 0 ? 'text-rose-600 rotate-180' : 'text-primary'}`} />
              </div>
            </div>
            <div className={`text-3xl lg:text-4xl font-black tracking-tight ${profit < 0 ? 'text-rose-600' : 'text-foreground'}`}>
              {formatCurrency(profit)}
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs lg:text-sm font-medium text-foreground/80">
              <span className={`inline-block w-2 h-2 rounded-full ${profit < 0 ? 'bg-rose-500' : 'bg-primary'} animate-pulse`} />
              <span>{profit < 0 ? 'Atenção: Fluxo Negativo' : 'Receitas Totais - Despesas'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico Real Integrado e Distribuição */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-border/50 bg-card p-0 shadow-sm transition-all hover:shadow-md">
          <div className="p-6 md:px-8 md:pt-8 md:pb-6 border-b border-border/40 bg-muted/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Fluxo Histórico
              </h3>
              <p className="text-sm text-muted-foreground">
                Comparativo de Recorrência (MRR baseada na data de entrada dos alunos) + Pedidos
                Stripe/Pix vs Despesas.
              </p>
            </div>
            <div className="w-[180px]">
              <Select value={timeRange} onValueChange={(val: any) => setTimeRange(val)}>
                <SelectTrigger className="bg-background border-border shadow-sm">
                  <SelectValue placeholder="Filtro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diario">Diário (Últ, 15 dias)</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-6 md:p-8 w-full">
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  barGap={6}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 13, fontWeight: 500, fill: "var(--muted-foreground)" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                    tickFormatter={(value) => `R$ ${value}`}
                  />
                  <RechartsTooltip
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    content={<CustomChartTooltip />}
                  />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="circle" />
                  <Bar
                    dataKey="Vendas"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                    name="Entradas (Extrato)"
                    animationDuration={1500}
                  />
                  <Bar
                    dataKey="Estornos"
                    fill="#f97316"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                    stackId="despesas"
                    name="Estornados (Devolvido)"
                    animationDuration={1500}
                  />
                  <Bar
                    dataKey="Despesas"
                    fill="#f43f5e"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                    stackId="despesas"
                    name="Saídas (Custos)"
                    animationDuration={1500}
                    animationBegin={200}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-0 shadow-sm transition-all hover:shadow-md">
          <div className="p-6 md:px-8 md:pt-8 md:pb-6 border-b border-border/40 bg-muted/10">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-primary" />
              Custos por Categoria
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Para onde foi o dinheiro este mês
            </p>
          </div>
          <div className="p-6 h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={1500}
                >
                  {pieData.map((entry: any, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={[
                        "#f43f5e", "#6366f1", "#10b981", "#f59e0b", 
                        "#8b5cf6", "#ec4899", "#06b6d4"
                      ][index % 7]} 
                    />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend layout="vertical" align="right" verticalAlign="middle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
