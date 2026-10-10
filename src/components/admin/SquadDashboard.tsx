import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  TrendingDown,
  Activity,
  Heart,
  MessageCircle,
  ChevronRight,
  User,
  Zap,
  Clock,
  Smile,
} from "lucide-react";
import { format, subWeeks, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";

interface SquadAlert {
  user_id: string;
  student_name: string;
  type: "pain" | "adherence_drop" | "missing";
  severity: "critical" | "warning";
  details: string;
  phone?: string;
}

export function SquadDashboard() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      // Fetch last 4 weeks of data for trend analysis
      const fourWeeksAgo = format(subWeeks(new Date(), 4), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("weekly_feedbacks")
        .select("*, profiles(nome_completo, telefone, email)")
        .gte("week_start_date", fourWeeksAgo)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFeedbacks(data || []);
    } catch (err) {
      console.error("Erro ao carregar dashboard do squad:", err);
    } finally {
      setLoading(false);
    }
  }

  // --- LOGIC FOR HEALTH INDEX (OPTION 4) ---
  const healthIndex = useMemo(() => {
    if (feedbacks.length === 0) return 0;

    // Take current week data
    const currentWeekStr = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
    const currentFeedbacks = feedbacks.filter((f) => f.week_start_date === currentWeekStr);

    if (currentFeedbacks.length === 0) return 0;

    const avgFeeling =
      currentFeedbacks.reduce((acc, f) => acc + (f.feeling_level || 0), 0) /
      currentFeedbacks.length;
    const painPercentage =
      (currentFeedbacks.filter((f) => f.pain_discomfort).length / currentFeedbacks.length) * 100;
    const avgAdherence =
      currentFeedbacks.reduce((acc, f) => acc + (f.adherence_level || 0), 0) /
      (currentFeedbacks.length * 4);

    // Simple formula: (Feeling avg * 20) + (Adherence avg * 100) - (Pain * 0.5)
    // Adjusting to 0-100 range
    let score = avgFeeling * 10 + avgAdherence * 50;
    score = score - painPercentage * 0.2;

    return Math.min(Math.max(Math.round(score), 0), 100);
  }, [feedbacks]);

  // --- LOGIC FOR ALERTS (OPTION 1) ---
  const alerts = useMemo(() => {
    const currentAlerts: SquadAlert[] = [];
    const currentWeekStr = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

    // 1. Critical Pain
    feedbacks
      .filter(
        (f) => f.week_start_date === currentWeekStr && f.feeling_level <= 2 && f.pain_discomfort
      )
      .forEach((f) => {
        currentAlerts.push({
          user_id: f.user_id,
          student_name: f.profiles?.nome_completo || "Anônimo",
          type: "pain",
          severity: "critical",
          details: "Reportou dor intensa e bem-estar baixo.",
          phone: f.profiles?.telefone,
        });
      });

    // 2. Adherence Drop
    // Let's identify students whose adherence dropped compared to previous weeks
    const studentMap = new Map<string, any[]>();
    feedbacks.forEach((f) => {
      if (!studentMap.has(f.user_id)) studentMap.set(f.user_id, []);
      studentMap.get(f.user_id)?.push(f);
    });

    studentMap.forEach((userFeedbacks, userId) => {
      if (userFeedbacks.length >= 2) {
        const latest = userFeedbacks[0];
        const previous = userFeedbacks[1];
        if (latest.adherence_level < previous.adherence_level && latest.adherence_level <= 2) {
          currentAlerts.push({
            user_id: userId,
            student_name: latest.profiles?.nome_completo || "Anônimo",
            type: "adherence_drop",
            severity: "warning",
            details: `Caiu de ${previous.adherence_level * 25}% para ${latest.adherence_level * 25}% de aderência.`,
            phone: latest.profiles?.telefone,
          });
        }
      }
    });

    return currentAlerts;
  }, [feedbacks]);

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  if (loading)
    return (
      <div className="p-8 text-center text-muted-foreground">Iniciando Centro de Comando...</div>
    );

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Health Score Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 overflow-hidden border-none shadow-lg bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Índice de Saúde do Squad
            </CardTitle>
            <CardDescription>
              Métrica consolidada baseada nos feedbacks desta semana.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center gap-8 flex-col sm:flex-row">
              <div className="relative h-32 w-32 flex items-center justify-center">
                <svg className="h-full w-full -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    className="text-muted/20"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={364.4}
                    strokeDashoffset={364.4 - (364.4 * healthIndex) / 100}
                    strokeLinecap="round"
                    className={`${getHealthColor(healthIndex)} transition-all duration-1000`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-4xl font-black ${getHealthColor(healthIndex)}`}>
                    {healthIndex}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">
                    Score
                  </span>
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase">
                      Estado Geral
                    </p>
                    <p className="text-sm font-bold">
                      {healthIndex >= 80
                        ? "SQUAD VOANDO! 🏃‍♂️"
                        : healthIndex >= 60
                          ? "SINAL AMARELO ⚠️"
                          : "ATENÇÃO CRÍTICA 🚨"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase">
                      Recomendação
                    </p>
                    <p className="text-[11px] leading-tight font-medium">
                      {healthIndex >= 80
                        ? "Manter o volume de treinos e planilhas atuais."
                        : healthIndex >= 60
                          ? "Avaliar redução manual da rodagem se as dores aumentarem."
                          : "Revisar planilhas de força e volume urgente."}
                    </p>
                  </div>
                </div>
                <div className="pt-2">
                  <div className="flex justify-between text-[10px] mb-1 font-bold">
                    <span>META DE SAÚDE</span>
                    <span>85%</span>
                  </div>
                  <Progress value={healthIndex} className="h-2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Card */}
        <Card className="border-none shadow-lg bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Resumo Rápido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-background rounded-xl border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-500/10 rounded-lg">
                  <Heart className="h-4 w-4 text-orange-600" />
                </div>
                <span className="text-xs font-semibold">Relatos de Dor</span>
              </div>
              <span className="text-sm font-bold">
                {feedbacks.filter((f) => f.pain_discomfort).length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-background rounded-xl border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-500/10 rounded-lg">
                  <Zap className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-xs font-semibold">Volume Médio</span>
              </div>
              <span className="text-sm font-bold">78%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Central de Alertas (Option 1) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-bold">Central de Alertas</h3>
          {alerts.length > 0 && (
            <Badge className="bg-orange-600 text-white rounded-full px-2 py-0.5 text-[10px]">
              {alerts.length} PENDENTE(S)
            </Badge>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {alerts.length === 0 ? (
            <Card className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground border-dashed bg-muted/20">
              <Smile className="h-12 w-12 mb-3 opacity-20" />
              <p className="font-medium text-sm">
                Nenhum alerta crítico para hoje. Tudo sob controle!
              </p>
            </Card>
          ) : (
            alerts.map((alert, idx) => (
              <Card
                key={idx}
                className={`relative overflow-hidden border-l-4 ${alert.severity === "critical" ? "border-l-red-600" : "border-l-orange-500"} hover:shadow-md transition-all group`}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-muted">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="font-bold text-sm truncate max-w-[150px]">
                        {alert.student_name}
                      </span>
                    </div>
                    {alert.severity === "critical" && (
                      <Badge variant="destructive" className="animate-pulse text-[9px] px-1.5 py-0">
                        CRÍTICO
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1 mb-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                      {alert.type === "pain" ? (
                        <AlertTriangle className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {alert.type === "pain" ? "Lesão / Dor" : "Queda de Performance"}
                    </p>
                    <p className="text-xs text-muted-foreground leading-snug">{alert.details}</p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t mt-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-[10px] font-bold gap-1 px-2 border hover:bg-muted"
                      onClick={() => {
                        if (alert.phone) {
                          const cleanPhone = alert.phone.replace(/\D/g, "");
                          const finalPhone =
                            cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
                          const message = `Olá ${alert.student_name}! Vi seu feedback desta semana e fiquei preocupado com o relato. Como você está se sentindo hoje?`;
                          window.open(
                            `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`,
                            "_blank"
                          );
                        }
                      }}
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> WHATSAPP
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-[10px] font-bold gap-1 ml-auto text-muted-foreground"
                    >
                      PLANILHA <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Quick Tips */}
      <div className="p-4 bg-muted/40 rounded-xl border border-dashed flex items-start gap-3">
        <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Dica do sistema
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Segundas-feiras são os dias com maior volume de alertas. Tente responder os alertas{" "}
            <strong>Críticos</strong> nas primeiras 4h após o envio para aumentar o engajamento do
            aluno.
          </p>
        </div>
      </div>
    </div>
  );
}
