import { useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WeeklyFeedback {
  id: string;
  week_start_date: string;
  feeling_level: number;
  intensity_level: number;
  adherence_level: number;
  pain_discomfort: boolean;
}

interface FeedbackAnalyticsProps {
  feedbacks: WeeklyFeedback[];
}

const COLORS = ["#22c55e", "#ef4444", "#f59e0b", "#3b82f6"];

export function FeedbackAnalytics({ feedbacks }: FeedbackAnalyticsProps) {
  // 1. Data for Evolution (Feeling and Intensity averages by week)
  const evolutionData = useMemo(() => {
    const weeklyGroups: Record<
      string,
      { totalFeeling: number; totalIntensity: number; count: number }
    > = {};

    feedbacks.forEach((f) => {
      if (!f.week_start_date) return;
      const week = f.week_start_date;
      if (!weeklyGroups[week]) {
        weeklyGroups[week] = { totalFeeling: 0, totalIntensity: 0, count: 0 };
      }
      weeklyGroups[week].totalFeeling += f.feeling_level || 0;
      weeklyGroups[week].totalIntensity += f.intensity_level || 0;
      weeklyGroups[week].count += 1;
    });

    return Object.entries(weeklyGroups)
      .map(([date, data]) => ({
        date: format(parseISO(date), "dd/MM", { locale: ptBR }),
        originalDate: date,
        feeling: Number((data.totalFeeling / data.count).toFixed(1)),
        intensity: Number((data.totalIntensity / data.count).toFixed(1)),
      }))
      .sort((a, b) => a.originalDate.localeCompare(b.originalDate));
  }, [feedbacks]);

  // 2. Data for Pain (Pie Chart)
  const painData = useMemo(() => {
    const painCount = feedbacks.filter((f) => f.pain_discomfort).length;
    const noPainCount = feedbacks.length - painCount;
    return [
      { name: "Sem Dor", value: noPainCount, color: "#22c55e" },
      { name: "Com Dor/Desconforto", value: painCount, color: "#ef4444" },
    ];
  }, [feedbacks]);

  // 3. Data for Adherence (Bar Chart)
  const adherenceData = useMemo(() => {
    const counts: Record<number, number> = { 4: 0, 3: 0, 2: 0, 1: 0 };
    feedbacks.forEach((f) => {
      if (f.adherence_level) {
        counts[f.adherence_level] = (counts[f.adherence_level] || 0) + 1;
      }
    });

    return [
      { label: "100%", value: counts[4], fill: "#22c55e" },
      { label: "~75%", value: counts[3], fill: "#10b981" },
      { label: "~50%", value: counts[2], fill: "#f59e0b" },
      { label: "< 25%", value: counts[1], fill: "#ef4444" },
    ];
  }, [feedbacks]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 animate-in fade-in duration-500">
      {/* Feeling Evolution */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Evolução do Bem-estar vs Intensidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolutionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 5]} fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Legend />
                <Line
                  name="Nível de Bem-estar"
                  type="monotone"
                  dataKey="feeling"
                  stroke="#22c55e"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#22c55e" }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  name="Nível de Intensidade"
                  type="monotone"
                  dataKey="intensity"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: "#f59e0b" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Adherence Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Distribuição de Aderência
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={adherenceData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="label"
                  type="category"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={45}
                />
                <Tooltip cursor={{ fill: "transparent" }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Pain Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Relatos de Dor/Desconforto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={painData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {painData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
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
