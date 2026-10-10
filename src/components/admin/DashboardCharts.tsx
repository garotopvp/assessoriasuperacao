import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Subscription {
  id: string;
  plan_name: string;
  status: string;
  created_at: string;
}

interface DashboardChartsProps {
  subscriptions: Subscription[];
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export function DashboardCharts({ subscriptions }: DashboardChartsProps) {
  // Dados para Status (Ativo vs Inadimplente vs Cancelado)
  const statusData = [
    {
      name: "Ativos",
      value: subscriptions.filter((s) => s.status === "active" || s.status === "trialing").length,
      fill: "#22c55e", // Green
    },
    {
      name: "Pendentes",
      value: subscriptions.filter((s) => s.status === "past_due" || s.status === "unpaid").length,
      fill: "#ef4444", // Red
    },
    {
      name: "Cancelados",
      value: subscriptions.filter((s) => s.status === "canceled").length,
      fill: "#94a3b8", // Gray
    },
  ];

  // Dados para Planos (Pizza)
  const planCounts: Record<string, number> = {};
  subscriptions.forEach((sub) => {
    // Normaliza nome do plano (ex: "Plano Mensal - ..." -> "Mensal")
    let simpleName = sub.plan_name;
    if (sub.plan_name.toLowerCase().includes("mensal")) simpleName = "Mensal";
    else if (sub.plan_name.toLowerCase().includes("trimestral")) simpleName = "Trimestral";
    else if (sub.plan_name.toLowerCase().includes("semestral")) simpleName = "Semestral";
    else if (sub.plan_name.toLowerCase().includes("anual")) simpleName = "Anual";

    planCounts[simpleName] = (planCounts[simpleName] || 0) + 1;
  });

  const planData = Object.entries(planCounts).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Gráfico de Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status da Base</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Planos */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Planos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {planData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
