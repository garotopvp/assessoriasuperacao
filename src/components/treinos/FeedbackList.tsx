import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Trash2,
  AlertTriangle,
  Activity,
  CalendarDays,
  Smile,
  Meh,
  Frown,
  ThumbsUp,
  LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useWeeklyFeedback } from "@/hooks/useWeeklyFeedback";
import { Badge } from "@/components/ui/badge";

const FEELING_ICONS: Record<number, { icon: LucideIcon; label: string; color: string }> = {
  5: { icon: Smile, label: "Excelente", color: "text-green-500" },
  4: { icon: ThumbsUp, label: "Muito Bom", color: "text-teal-500" },
  3: { icon: Meh, label: "Normal", color: "text-yellow-500" },
  2: { icon: Frown, label: "Cansado", color: "text-orange-500" },
  1: { icon: Activity, label: "Exausto", color: "text-red-500" },
};

export function FeedbackList() {
  const { feedbacks, loading, deleteFeedback } = useWeeklyFeedback();

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg bg-accent/20">
        <CalendarDays className="mx-auto h-12 w-12 opacity-50 mb-4" />
        <h3 className="text-lg font-medium mb-1">Nenhum feedback enviado</h3>
        <p>Envie seu feedback semanal para que o treinador possa acompanhar sua evolução!</p>
      </div>
    );
  }

  const getIntensityLabel = (level: number | null) => {
    switch (level) {
      case 1:
        return <span className="text-green-600">Muito Leve</span>;
      case 2:
        return <span className="text-teal-600">Leve</span>;
      case 3:
        return <span className="text-yellow-600">Moderada</span>;
      case 4:
        return <span className="text-orange-600">Forte</span>;
      case 5:
        return <span className="text-red-600">Muito Forte</span>;
      default:
        return "-";
    }
  };

  const getAdherenceLabel = (level: number | null) => {
    switch (level) {
      case 4:
        return "100% dos Treinos";
      case 3:
        return "Maioria dos Treinos";
      case 2:
        return "Metade dos Treinos";
      case 1:
        return "Poucos / Nenhum";
      default:
        return "-";
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {feedbacks.map((item) => {
        const FeelingData = item.feeling_level ? FEELING_ICONS[item.feeling_level] : null;
        const FeelingIcon = FeelingData?.icon || Activity;

        return (
          <Card
            key={item.id}
            className="relative group overflow-hidden transition-all hover:shadow-md border-border/60"
          >
            <CardHeader className="pb-3 bg-muted/40 flex flex-row items-center justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-base font-bold text-primary flex items-center gap-2">
                  Feedback Semanal
                  {item.pain_discomfort && (
                    <Badge
                      variant="destructive"
                      className="ml-2 text-[10px] h-5 px-1.5 animate-pulse"
                    >
                      <AlertTriangle className="w-3 h-3 mr-1" /> Dor Relatada
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="flex items-center gap-1 text-xs">
                  Ref. Semana:{" "}
                  <span className="font-medium text-foreground">
                    {item.week_start_date
                      ? format(new Date(item.week_start_date), "dd 'de' MMMM", { locale: ptBR })
                      : "Data não informada"}
                  </span>
                </CardDescription>
              </div>
              <div className="text-xs text-muted-foreground">
                Enviado em {format(new Date(item.created_at), "dd/MM/yyyy")}
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Intensidade */}
                <div className="bg-background border rounded p-3 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                    Intensidade
                  </span>
                  <span className="font-bold text-sm">
                    {getIntensityLabel(item.intensity_level)}
                  </span>
                  {item.intensity_level && (
                    <div className="w-full h-1 bg-muted mt-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          item.intensity_level <= 2
                            ? "bg-green-500"
                            : item.intensity_level === 3
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${(item.intensity_level / 5) * 100}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Aderência */}
                <div className="bg-background border rounded p-3 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                    Aderência
                  </span>
                  <span className="font-bold text-sm">
                    {getAdherenceLabel(item.adherence_level)}
                  </span>
                  {item.missed_workout_reason && (
                    <Badge variant="outline" className="mt-1 text-[10px] truncate max-w-full">
                      Motivo: {item.missed_workout_reason}
                    </Badge>
                  )}
                </div>

                {/* Bem-estar */}
                <div className="bg-background border rounded p-3 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                    Bem-estar
                  </span>
                  <div className="flex items-center gap-2">
                    <FeelingIcon className={`w-5 h-5 ${FeelingData?.color}`} />
                    <span className={`font-bold text-sm ${FeelingData?.color}`}>
                      {FeelingData?.label || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pain Details */}
              {item.pain_discomfort && (
                <div className="mt-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-md text-xs border border-red-200 dark:border-red-900/50">
                  <div className="flex items-center justify-between mb-2">
                    <strong className="text-red-700 dark:text-red-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Relato de Dor
                    </strong>
                    {item.pain_intensity !== null && (
                      <Badge variant="outline" className="border-red-200 text-red-700 bg-white">
                        Nível: {item.pain_intensity}/10
                      </Badge>
                    )}
                  </div>

                  {item.pain_area && item.pain_area.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {item.pain_area.map((area, idx) => (
                        <span
                          key={idx}
                          className="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 px-2 py-0.5 rounded text-[10px] font-medium border border-red-200 dark:border-red-800"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  )}

                  {item.pain_details && (
                    <p className="text-foreground/80 italic">"{item.pain_details}"</p>
                  )}
                </div>
              )}

              {/* Comments */}
              {item.improvement_suggestions && (
                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md text-xs italic text-blue-700 dark:text-blue-300 border-l-2 border-blue-500">
                  <span className="not-italic font-semibold block mb-1 text-[10px] uppercase">
                    Sugestão de Melhoria:
                  </span>
                  "{item.improvement_suggestions}"
                </div>
              )}

              {item.comments && (
                <div className="mt-2 p-3 bg-muted/30 rounded-md text-xs italic text-muted-foreground border-l-2 border-primary/50">
                  <span className="not-italic font-semibold text-foreground/70 block mb-1 text-[10px] uppercase">
                    Observações:
                  </span>
                  "{item.comments}"
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-0 flex justify-end pb-3 pr-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all h-8 text-xs"
                onClick={() => {
                  if (confirm("Tem certeza que deseja excluir este feedback?")) {
                    deleteFeedback(item.id);
                  }
                }}
              >
                <Trash2 className="h-3 w-3 mr-1" /> Excluir
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
