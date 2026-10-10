import { logger } from "@/lib/logger";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { PieChart as PieChartIcon, TrendingUp, CalendarDays } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PlanStats {
  name: string;
  value: number;
  percentage: number;
  totalBilling: number; // valor bruto total de todos os assinantes deste plano
  divisor: number;
}

// Retorna quantos meses dura o ciclo de cada plano
const getPlanPeriodMonths = (planName: string): number => {
  const name = (planName || "").toLowerCase();
  if (name.includes("trimestral")) return 3;
  if (name.includes("semestral")) return 6;
  if (name.includes("anual")) return 12;
  return 1;
};

const getPlanColorHex = (planName: string) => {
  const name = (planName || "").toLowerCase();
  if (name.includes("mensal")) return "#2563eb";
  if (name.includes("trimestral")) return "#9333ea";
  if (name.includes("semestral")) return "#f97316";
  if (name.includes("anual")) return "#e11d48";
  if (name.includes("parceria")) return "#ec4899";
  if (name.includes("teste")) return "#10b981";
  if (name.includes("recuperado")) return "#06b6d4";
  return "#475569";
};

const normalizePlanName = (planName: string): string => {
  const n = (planName || "").toLowerCase().trim();
  if (n.includes("mensal") && !n.includes("teste")) return "Plano Mensal";
  if (n.includes("trimestral")) return "Plano Trimestral";
  if (n.includes("semestral")) return "Plano Semestral";
  if (n.includes("anual")) return "Plano Anual";
  if (n.includes("teste")) return "Plano Teste";
  if (n.includes("parceria")) return "Parceria";
  if (n.includes("isento")) return "Isento";
  if (n.includes("total pass") || n.includes("totalpass")) return "Total Pass";
  return planName || "Sem plano";
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

// Calcula o total previsto de cobrança para um mês específico
// usando o next_billing_date real de cada assinatura
const calculateMonthForecast = (subscriptions: any[], year: number, month: number): number => {
  const targetStart = new Date(year, month, 1);
  const targetEnd = new Date(year, month + 1, 0, 23, 59, 59);
  let total = 0;

  subscriptions
    .filter((s) => s.status !== "canceled" && Number(s.amount) > 0 && s.next_billing_date)
    .forEach((sub) => {
      const periodMonths = getPlanPeriodMonths(sub.plan_name || "");
      // Parse the billing date safely
      const raw = sub.next_billing_date.split("T")[0];
      const [y, m, d] = raw.split("-").map(Number);
      let billingDate = new Date(y, m - 1, d, 12, 0, 0);

      // Se a próxima cobrança ainda está no futuro mas antes de targetEnd,
      // verifica se cai no mês alvo. Também projeta para frente se passou.
      // Avança até alcançar ou passar o início do mês alvo
      while (billingDate < targetStart) {
        billingDate = new Date(billingDate);
        billingDate.setMonth(billingDate.getMonth() + periodMonths);
      }

      // Se caiu dentro do mês alvo, soma o valor bruto
      if (billingDate <= targetEnd) {
        total += Number(sub.amount);
      }
    });

  return total;
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const periodLabel =
      data.divisor === 3 ? "trimestre" :
      data.divisor === 6 ? "semestre" :
      data.divisor === 12 ? "ano" : "mês";
    return (
      <div className="bg-white border border-border/50 p-3 rounded-xl shadow-xl min-w-[160px] animate-in zoom-in-95 duration-200 z-[100]">
        <p className="font-bold text-sm mb-3 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: payload[0].payload.fill }} />
          {data.name}
        </p>
        <div className="space-y-1.5">
          <p className="text-sm flex items-center justify-between gap-6">
            <span className="text-muted-foreground font-medium">Assinantes</span>
            <span className="font-black text-foreground">{data.value}</span>
          </p>
          <p className="text-sm flex items-center justify-between gap-6">
            <span className="text-muted-foreground font-medium">Proporção</span>
            <span className="font-black text-foreground">{data.percentage}%</span>
          </p>
          <p className="text-sm flex items-center justify-between gap-6 border-t border-border/40 pt-1.5 mt-1.5">
            <span className="text-muted-foreground font-medium">Bruto Total</span>
            <div className="flex flex-col items-end">
              <span className="font-black text-emerald-600 leading-none">{formatCurrency(data.totalBilling)}</span>
            </div>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const ForecastTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 border border-border/50 p-3 rounded-xl shadow-lg">
        <p className="font-bold text-sm mb-1">{label}</p>
        <p className="text-emerald-600 font-black text-sm">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export default function PlansPieChart() {
  const [allData, setAllData] = useState<any[]>([]);
  const [planStats, setPlanStats] = useState<PlanStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");

  useEffect(() => { fetchPlanStats(); }, []);
  useEffect(() => { if (allData.length > 0) processStats(allData, activeTab); }, [activeTab, allData]);

  const fetchPlanStats = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("recurring_subscriptions" as any)
        .select("plan_name, plan_id, status, amount, next_billing_date");
      if (error) throw error;
      setAllData(data || []);
      processStats(data || [], "active");
    } catch (error) {
      logger.error("Erro ao buscar estatísticas de planos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const processStats = (data: any[], filter: string) => {
    const filtered = data.filter((sub) =>
      filter === "active" ? sub.status !== "canceled" : sub.status === "canceled"
    );

    const planCounts: Record<string, number> = {};
    const planBillingTotal: Record<string, number> = {};
    const planDivisor: Record<string, number> = {};

    filtered.forEach((sub: any) => {
      const planName = normalizePlanName(sub.plan_name);
      const divisor = getPlanPeriodMonths(planName);
      planCounts[planName] = (planCounts[planName] || 0) + 1;
      planBillingTotal[planName] = (planBillingTotal[planName] || 0) + (Number(sub.amount) || 0);
      planDivisor[planName] = divisor;
    });

    const total = Object.values(planCounts).reduce((s, c) => s + c, 0);
    const stats: PlanStats[] = Object.entries(planCounts)
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? Math.round((value / total) * 100) : 0,
        totalBilling: planBillingTotal[name] || 0,
        divisor: planDivisor[name] || 1,
      }))
      .sort((a, b) => b.value - a.value);

    setPlanStats(stats);
  };

  // Previsão dos próximos 6 meses com base no next_billing_date real
  const forecastData = useMemo(() => {
    const activeSubs = allData.filter((s) => s.status !== "canceled");
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = addMonths(now, i);
      const year = d.getFullYear();
      const month = d.getMonth();
      const label = format(d, "MMM/yy", { locale: ptBR });
      const value = calculateMonthForecast(activeSubs, year, month);
      return { label, value, month, year };
    });
  }, [allData]);

  const currentMonthForecast = forecastData[0]?.value ?? 0;

  if (isLoading) {
    return (
      <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden h-full">
        <CardContent className="p-6">
          <div className="h-[300px] flex items-center justify-center">
            <div className="w-48 h-48 rounded-full border-8 border-muted/30 border-t-primary/40 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (planStats.length === 0) {
    return (
      <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden h-full">
        <CardContent className="p-6 flex flex-col items-center justify-center h-full gap-4">
          <PieChartIcon className="w-8 h-8 text-muted-foreground/50" />
          <p className="font-semibold text-foreground">Nenhum dado encontrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden h-full transition-all hover:shadow-md">
      <CardHeader className="border-b border-border/40 pb-4 bg-muted/10 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2.5 text-lg font-bold">
          <div className="bg-primary/10 p-1.5 rounded-lg border border-primary/20">
            <PieChartIcon className="w-4 h-4 text-primary" />
          </div>
          Distribuição de Planos
        </CardTitle>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
          <TabsList className="grid grid-cols-2 h-8 p-1 bg-muted/50">
            <TabsTrigger value="active" className="text-[10px] uppercase font-bold px-3">Ativos</TabsTrigger>
            <TabsTrigger value="canceled" className="text-[10px] uppercase font-bold px-3">Cancelados</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="pt-6 px-6 pb-6 space-y-6">

        {/* Gráfico Donut */}
        <div className="relative">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={planStats} cx="50%" cy="50%" innerRadius={70} outerRadius={100}
                paddingAngle={3} stroke="rgba(255,255,255,0.05)" strokeWidth={2}
                dataKey="value" animationBegin={0} animationDuration={1200} animationEasing="ease-out">
                {planStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getPlanColorHex(entry.name)}
                    className="hover:opacity-80 transition-opacity duration-300 outline-none drop-shadow-sm" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
            <div className="bg-background/40 backdrop-blur-sm rounded-full p-2 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-foreground tracking-tight leading-none">
                {planStats.reduce((acc, curr) => acc + curr.value, 0)}
              </span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Total</span>
            </div>
          </div>
        </div>

        {/* Legenda: valor BRUTO por plano */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
          {planStats.map((plan) => (
            <div key={plan.name}
              className="group flex flex-col p-3 rounded-xl hover:bg-muted/40 transition-colors border border-transparent hover:border-border/50">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="w-3 h-3 rounded-full flex-shrink-0 transition-transform group-hover:scale-125 duration-300"
                    style={{ backgroundColor: getPlanColorHex(plan.name) }} />
                  <span className="text-sm font-semibold text-foreground truncate">{plan.name}</span>
                </div>
                <span className="font-black text-sm shrink-0 ml-2">{plan.percentage}%</span>
              </div>
              <div className="flex justify-between items-end ml-[22px]">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">{plan.value} usuário{plan.value !== 1 ? "s" : ""}</span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    {formatCurrency(plan.totalBilling)}
                  </span>
                </div>
                <div className="w-14 h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${plan.percentage}%`, backgroundColor: getPlanColorHex(plan.name) }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Previsão de Recebíveis — baseada no next_billing_date real */}
        <div className="border-t border-border/40 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-foreground">
              Previsão de Recebíveis (próximos 6 meses)
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mb-3 -mt-1">
            Calculado pelo <strong>next_billing_date</strong> real de cada assinatura. 
            Planos semestrais/trimestrais aparecem apenas no mês da cobrança.
          </p>

          {/* Mini barras */}
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={forecastData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<ForecastTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)", radius: 6 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
                {forecastData.map((entry, i) => (
                  <Cell key={i} fill={i === 0 ? "#10b981" : "#a7f3d0"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Destaque do mês atual */}
          <div className="flex items-center justify-between mt-3 bg-emerald-50/60 border border-emerald-200/50 rounded-xl px-4 py-2.5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
                  Previsto para {format(new Date(), "MMMM", { locale: ptBR })}
                </span>
                <span className="text-[10px] text-emerald-600/70">
                  Cobranças com vencimento neste mês
                </span>
              </div>
            </div>
            <span className="text-lg font-black text-emerald-700">
              {formatCurrency(currentMonthForecast)}
            </span>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
