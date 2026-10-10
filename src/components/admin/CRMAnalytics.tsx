import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  MessageSquare,
  Users,
  Smile,
  Frown,
  Meh,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

interface AnalyticsData {
  date: string;
  total_sessions: number;
  active_sessions: number;
  closed_sessions: number;
  avg_response_time_seconds: number;
  positive_sentiment_count: number;
  negative_sentiment_count: number;
  neutral_sentiment_count: number;
  total_messages: number;
  bot_messages: number;
  admin_messages: number;
  student_messages: number;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  description?: string;
}

function MetricCard({ title, value, change, icon, description }: MetricCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            {isPositive && <TrendingUp className="w-4 h-4 text-green-500" />}
            {isNegative && <TrendingDown className="w-4 h-4 text-red-500" />}
            <span
              className={`text-xs font-medium ${isPositive ? "text-green-500" : isNegative ? "text-red-500" : "text-muted-foreground"}`}
            >
              {isPositive && "+"}
              {change}% vs. semana passada
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CRMAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayStats, setTodayStats] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetchAnalytics();
    calculateTodayStats();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("crm_analytics")
      .select("*")
      .order("date", { ascending: false })
      .limit(30);

    if (error) {
      toast.error("Erro ao carregar analytics");
      console.error(error);
    } else {
      setAnalytics(data || []);
    }
    setLoading(false);
  };

  const calculateTodayStats = async () => {
    const today = new Date().toISOString().split("T")[0];

    // Buscar sessões de hoje
    const { data: sessions } = await supabase
      .from("support_sessions")
      .select("*")
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`);

    // Buscar mensagens de hoje
    const { data: messages } = await supabase
      .from("support_messages")
      .select("*")
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`);

    if (sessions && messages) {
      const stats: AnalyticsData = {
        date: today,
        total_sessions: sessions.length,
        active_sessions: sessions.filter((s) => s.status === "ACTIVE").length,
        closed_sessions: sessions.filter((s) => s.status === "CLOSED").length,
        avg_response_time_seconds: 0, // Calcular depois
        positive_sentiment_count: sessions.filter((s) => s.sentiment_label === "POSITIVE").length,
        negative_sentiment_count: sessions.filter((s) => s.sentiment_label === "NEGATIVE").length,
        neutral_sentiment_count: sessions.filter((s) => s.sentiment_label === "NEUTRAL").length,
        total_messages: messages.length,
        bot_messages: messages.filter((m) => m.sender_type === "BOT" || m.sender_type === "SYSTEM")
          .length,
        admin_messages: messages.filter((m) => m.sender_type === "ADMIN").length,
        student_messages: messages.filter((m) => m.sender_type === "STUDENT").length,
      };

      setTodayStats(stats);

      // Salvar no banco
      await supabase.from("crm_analytics").upsert([stats], { onConflict: "date" });
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  const totalSentiment =
    (todayStats?.positive_sentiment_count || 0) +
    (todayStats?.negative_sentiment_count || 0) +
    (todayStats?.neutral_sentiment_count || 0);

  const sentimentPercentages = {
    positive:
      totalSentiment > 0
        ? (((todayStats?.positive_sentiment_count || 0) / totalSentiment) * 100).toFixed(1)
        : "0",
    negative:
      totalSentiment > 0
        ? (((todayStats?.negative_sentiment_count || 0) / totalSentiment) * 100).toFixed(1)
        : "0",
    neutral:
      totalSentiment > 0
        ? (((todayStats?.neutral_sentiment_count || 0) / totalSentiment) * 100).toFixed(1)
        : "0",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Analytics do CRM</h2>
        <p className="text-muted-foreground">Métricas e insights sobre o atendimento</p>
      </div>

      {/* Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Sessões Hoje"
          value={todayStats?.total_sessions || 0}
          icon={<Users className="w-4 h-4" />}
          description={`${todayStats?.active_sessions || 0} ativas, ${todayStats?.closed_sessions || 0} encerradas`}
        />

        <MetricCard
          title="Mensagens Hoje"
          value={todayStats?.total_messages || 0}
          icon={<MessageSquare className="w-4 h-4" />}
          description={`${todayStats?.student_messages || 0} de alunos, ${todayStats?.admin_messages || 0} de admins`}
        />

        <MetricCard
          title="Tempo Médio de Resposta"
          value={formatTime(todayStats?.avg_response_time_seconds || 0)}
          icon={<Clock className="w-4 h-4" />}
          description="Tempo para primeira resposta"
        />

        <MetricCard
          title="Taxa de Satisfação"
          value={`${sentimentPercentages.positive}%`}
          icon={<Smile className="w-4 h-4" />}
          description="Sentimento positivo detectado"
        />
      </div>

      {/* Análise de Sentimento */}
      <Card>
        <CardHeader>
          <CardTitle>Análise de Sentimento</CardTitle>
          <CardDescription>Distribuição do sentimento dos alunos hoje</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Smile className="w-4 h-4 text-green-500" />
                  <span className="font-medium">Positivo</span>
                </div>
                <span className="text-muted-foreground">
                  {todayStats?.positive_sentiment_count || 0} ({sentimentPercentages.positive}%)
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${sentimentPercentages.positive}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Meh className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium">Neutro</span>
                </div>
                <span className="text-muted-foreground">
                  {todayStats?.neutral_sentiment_count || 0} ({sentimentPercentages.neutral}%)
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full transition-all"
                  style={{ width: `${sentimentPercentages.neutral}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Frown className="w-4 h-4 text-red-500" />
                  <span className="font-medium">Negativo</span>
                </div>
                <span className="text-muted-foreground">
                  {todayStats?.negative_sentiment_count || 0} ({sentimentPercentages.negative}%)
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all"
                  style={{ width: `${sentimentPercentages.negative}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Distribuição de Mensagens */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Mensagens</CardTitle>
          <CardDescription>Quem está enviando mais mensagens</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-blue-500 text-blue-500">
                  <Users className="w-3 h-3 mr-1" />
                  Alunos
                </Badge>
              </div>
              <span className="text-sm font-medium">{todayStats?.student_messages || 0}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-purple-500 text-purple-500">
                  <Activity className="w-3 h-3 mr-1" />
                  Bot
                </Badge>
              </div>
              <span className="text-sm font-medium">{todayStats?.bot_messages || 0}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-green-500 text-green-500">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Admins
                </Badge>
              </div>
              <span className="text-sm font-medium">{todayStats?.admin_messages || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histórico (últimos 7 dias) */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico (Últimos 7 Dias)</CardTitle>
          <CardDescription>Evolução das métricas ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analytics.slice(0, 7).map((day) => (
              <div
                key={day.date}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <span className="text-sm font-medium">
                  {new Date(day.date).toLocaleDateString("pt-BR", {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                  })}
                </span>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{day.total_sessions} sessões</span>
                  <span>{day.total_messages} msgs</span>
                  <Badge
                    variant={
                      day.positive_sentiment_count > day.negative_sentiment_count
                        ? "default"
                        : "destructive"
                    }
                  >
                    {day.positive_sentiment_count > day.negative_sentiment_count ? "😊" : "😐"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
