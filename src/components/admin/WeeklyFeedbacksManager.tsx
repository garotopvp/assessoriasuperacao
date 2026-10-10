import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  Trash2,
  Activity,
  Smile,
  Meh,
  Frown,
  ThumbsUp,
  Search,
  Download,
  ListFilter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { LucideIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { FeedbackAnalytics } from "./FeedbackAnalytics";
import { PendingFeedbacks } from "./PendingFeedbacks";
import { BarChart2, User, ChevronRight, Calendar } from "lucide-react";

interface WeeklyFeedback {
  id: string;
  created_at: string;
  week_start_date: string;
  intensity_level: number;
  adherence_level: number;
  feeling_level: number;
  pain_discomfort: boolean;
  pain_area: string[] | null;
  pain_intensity: number | null;
  pain_details: string | null;
  missed_workout_reason: string | null;
  comments: string | null;
  improvement_suggestions: string | null;
  user_id?: string;
  profiles?: {
    nome_completo: string | null;
    email: string | null;
  };
}

const FEELING_ICONS: Record<number, { icon: LucideIcon; label: string; color: string }> = {
  5: { icon: Smile, label: "Excelente", color: "text-green-500" },
  4: { icon: ThumbsUp, label: "Muito Bom", color: "text-teal-500" },
  3: { icon: Meh, label: "Normal", color: "text-yellow-500" },
  2: { icon: Frown, label: "Cansado", color: "text-orange-500" },
  1: { icon: Activity, label: "Exausto", color: "text-red-500" },
};

export function WeeklyFeedbacksManager() {
  return (
    <Tabs defaultValue="list" className="space-y-4 w-full">
      <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
        <TabsList className="inline-flex h-auto p-1 bg-muted/50 min-w-full md:min-w-0 justify-start">
          <TabsTrigger
            value="list"
            className="gap-2 whitespace-nowrap px-4 py-2 text-xs md:text-sm"
          >
            <ListFilter className="h-4 w-4" />
            Feedbacks Recebidos
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="gap-2 whitespace-nowrap px-4 py-2 text-xs md:text-sm"
          >
            <BarChart2 className="h-4 w-4" />
            Análise Visual
          </TabsTrigger>
          <TabsTrigger
            value="pending"
            className="gap-2 whitespace-nowrap px-4 py-2 text-xs md:text-sm"
          >
            <Activity className="h-4 w-4" />
            Pendências e Cobrança
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="list" className="space-y-4">
        <WeeklyFeedbacksList />
      </TabsContent>

      <TabsContent value="analytics" className="space-y-4">
        <WeeklyFeedbacksAnalyticsWrapper />
      </TabsContent>

      <TabsContent value="pending" className="space-y-4">
        <PendingFeedbacks />
      </TabsContent>
    </Tabs>
  );
}

function WeeklyFeedbacksList() {
  const [feedbacks, setFeedbacks] = useState<WeeklyFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("weekly_feedbacks")
        .select(
          `
                    *,
                    profiles:user_id (nome_completo, email)
                `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      console.log("Feedbacks fetched:", data); // Debug log
      setFeedbacks(data as unknown as WeeklyFeedback[]);
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
      toast.error("Erro ao carregar feedbacks.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este feedback? Esta ação não pode ser desfeita."))
      return;

    try {
      const { error } = await supabase.from("weekly_feedbacks").delete().eq("id", id);

      if (error) throw error;

      setFeedbacks((prev) => prev.filter((f) => f.id !== id));
      toast.success("Feedback excluído com sucesso.");
    } catch (error) {
      console.error("Error deleting feedback:", error);
      toast.error("Erro ao excluir feedback.");
    }
  };

  const getAdherenceLabel = (level: number) => {
    switch (level) {
      case 4:
        return "100%";
      case 3:
        return "~75%";
      case 2:
        return "~50%";
      case 1:
        return "< 25%";
      default:
        return "-";
    }
  };

  const filteredFeedbacks = feedbacks.filter(
    (feedback) =>
      feedback.profiles?.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.comments?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Activity className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full overflow-hidden">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Feedbacks</h2>
          <p className="text-xs md:text-sm text-muted-foreground">Acompanhamento dos alunos.</p>
        </div>
        <div className="flex w-full md:w-auto gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar aluno..."
              className="pl-8 text-sm h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">Data / Semana</TableHead>
                  <TableHead className="min-w-[180px]">Aluno</TableHead>
                  <TableHead className="text-center min-w-[80px]">Sensação</TableHead>
                  <TableHead className="text-center min-w-[100px]">Intensidade</TableHead>
                  <TableHead className="text-center min-w-[100px]">Aderência</TableHead>
                  <TableHead className="min-w-[150px]">Dor / Desconforto</TableHead>
                  <TableHead className="min-w-[200px]">Comentários</TableHead>
                  <TableHead className="text-right min-w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeedbacks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhum feedback encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFeedbacks.map((feedback) => {
                    const FeelingIcon = FEELING_ICONS[feedback.feeling_level]?.icon || Activity;
                    const feelingColor =
                      FEELING_ICONS[feedback.feeling_level]?.color || "text-gray-500";

                    return (
                      <TableRow key={feedback.id} className="hover:bg-muted/50">
                        <TableCell className="align-top whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-medium text-xs">
                              Ref:{" "}
                              {feedback.week_start_date
                                ? format(new Date(feedback.week_start_date), "dd/MM", {
                                    locale: ptBR,
                                  })
                                : "-"}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              Enviado: {format(new Date(feedback.created_at), "dd/MM HH:mm")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <button
                            onClick={() =>
                              setSelectedStudent({
                                id: feedback.user_id as string,
                                name: feedback.profiles?.nome_completo || "Anônimo",
                              })
                            }
                            className="flex flex-col text-left hover:text-primary transition-colors group"
                          >
                            <span className="font-medium text-sm group-hover:underline flex items-center gap-1">
                              {feedback.profiles?.nome_completo || "Anônimo"}
                              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </span>
                            <span
                              className="text-[10px] text-muted-foreground truncate max-w-[150px]"
                              title={feedback.profiles?.email || ""}
                            >
                              {feedback.profiles?.email}
                            </span>
                          </button>
                        </TableCell>
                        <TableCell className="align-top text-center">
                          <div
                            className="flex justify-center"
                            title={FEELING_ICONS[feedback.feeling_level]?.label}
                          >
                            <FeelingIcon className={`h-5 w-5 ${feelingColor}`} />
                          </div>
                        </TableCell>
                        <TableCell className="align-top text-center">
                          <Badge
                            variant="outline"
                            className={
                              feedback.intensity_level >= 4
                                ? "border-red-200 bg-red-50 text-red-700"
                                : feedback.intensity_level === 3
                                  ? "border-yellow-200 bg-yellow-50 text-yellow-700"
                                  : "border-green-200 bg-green-50 text-green-700"
                            }
                          >
                            {feedback.intensity_level}/5
                          </Badge>
                        </TableCell>
                        <TableCell className="align-top text-center">
                          <div className="flex flex-col items-center">
                            <Badge
                              variant={feedback.adherence_level >= 3 ? "secondary" : "destructive"}
                            >
                              {getAdherenceLabel(feedback.adherence_level)}
                            </Badge>
                            {feedback.missed_workout_reason && (
                              <span
                                className="text-[10px] mt-1 text-muted-foreground max-w-[100px] truncate"
                                title={feedback.missed_workout_reason}
                              >
                                {feedback.missed_workout_reason}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          {feedback.pain_discomfort ? (
                            <div className="flex flex-col gap-1">
                              <Badge variant="destructive" className="w-fit text-[10px] px-1.5 h-5">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Sim{" "}
                                {feedback.pain_intensity !== null
                                  ? `(${feedback.pain_intensity})`
                                  : ""}
                              </Badge>
                              {feedback.pain_area && (
                                <span className="text-[10px] font-medium leading-tight text-destructive">
                                  {feedback.pain_area.join(", ")}
                                </span>
                              )}
                              {feedback.pain_details && (
                                <span
                                  className="text-[10px] text-muted-foreground italic truncate max-w-[120px]"
                                  title={feedback.pain_details}
                                >
                                  "{feedback.pain_details}"
                                </span>
                              )}
                            </div>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-muted-foreground border-muted bg-transparent"
                            >
                              Não
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="align-top max-w-[200px]">
                          <div className="space-y-2">
                            {feedback.comments && (
                              <p
                                className="text-xs text-muted-foreground line-clamp-2"
                                title={feedback.comments}
                              >
                                "{feedback.comments}"
                              </p>
                            )}
                            {feedback.improvement_suggestions && (
                              <div className="p-1.5 bg-blue-50/50 rounded border border-blue-100/50">
                                <p className="text-[10px] text-blue-600 font-medium mb-0.5">
                                  Sugestão:
                                </p>
                                <p
                                  className="text-[10px] text-blue-700/80 line-clamp-2"
                                  title={feedback.improvement_suggestions}
                                >
                                  {feedback.improvement_suggestions}
                                </p>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="align-top text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(feedback.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      <StudentDetailSheet
        student={selectedStudent}
        allFeedbacks={feedbacks}
        onClose={() => setSelectedStudent(null)}
      />
    </div>
  );
}

function WeeklyFeedbacksAnalyticsWrapper() {
  const [feedbacks, setFeedbacks] = useState<WeeklyFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const { data } = await supabase
          .from("weekly_feedbacks")
          .select("*")
          .order("week_start_date", { ascending: true });
        setFeedbacks((data as any[]) || []);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading)
    return (
      <div className="h-[400px] flex items-center justify-center">
        <Activity className="animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Análise Squad</h2>
        <p className="text-muted-foreground">Visão geral de desempenho e saúde do grupo.</p>
      </div>
      <FeedbackAnalytics feedbacks={feedbacks} />
    </div>
  );
}

function StudentDetailSheet({
  student,
  allFeedbacks,
  onClose,
}: {
  student: { id: string; name: string } | null;
  allFeedbacks: WeeklyFeedback[];
  onClose: () => void;
}) {
  const studentFeedbacks = useMemo(() => {
    if (!student) return [];
    return allFeedbacks
      .filter((f) => f.user_id === student.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [student, allFeedbacks]);

  return (
    <Sheet open={!!student} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-6 border-b">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-xl">{student?.name}</SheetTitle>
              <SheetDescription>Histórico completo de feedbacks e evolução.</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {studentFeedbacks.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">
              Nenhum feedback encontrado para este aluno.
            </p>
          ) : (
            studentFeedbacks.map((fb) => {
              const FeelingIcon = FEELING_ICONS[fb.feeling_level]?.icon || Activity;
              const feelingColor = FEELING_ICONS[fb.feeling_level]?.color || "text-gray-500";

              return (
                <Card key={fb.id} className="overflow-hidden border-l-4 border-l-primary">
                  <CardHeader className="py-3 bg-muted/30">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        Semana:{" "}
                        {fb.week_start_date
                          ? format(new Date(fb.week_start_date), "dd/MM/yyyy", { locale: ptBR })
                          : "-"}
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        Enviado em {format(new Date(fb.created_at), "dd/MM HH:mm")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="py-4 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex flex-col items-center p-2 bg-muted/20 rounded-lg">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold mb-1">
                          Sensação
                        </span>
                        <FeelingIcon className={`h-6 w-6 ${feelingColor}`} />
                        <span className="text-[10px] mt-1 font-medium">
                          {FEELING_ICONS[fb.feeling_level]?.label}
                        </span>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-muted/20 rounded-lg">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold mb-1">
                          Intensidade
                        </span>
                        <span className="text-lg font-bold">{fb.intensity_level}/5</span>
                        <span className="text-[10px] text-muted-foreground">Esforço</span>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-muted/20 rounded-lg">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold mb-1">
                          Aderência
                        </span>
                        <span className="text-lg font-bold">
                          {fb.adherence_level === 4
                            ? "100%"
                            : fb.adherence_level === 3
                              ? "75%"
                              : fb.adherence_level === 2
                                ? "50%"
                                : "25%"}
                        </span>
                        <span className="text-[10px] text-muted-foreground text-center truncate w-full">
                          Dos treinos
                        </span>
                      </div>
                    </div>

                    {fb.pain_discomfort && (
                      <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-bold text-red-800">Relato de Dor</span>
                          <Badge className="bg-red-600 ml-auto">Nível {fb.pain_intensity}</Badge>
                        </div>
                        <p className="text-xs font-semibold text-red-700 mb-1">
                          Áreas: {fb.pain_area?.join(", ")}
                        </p>
                        <p className="text-xs text-red-600/80 italic">"{fb.pain_details}"</p>
                      </div>
                    )}

                    {fb.comments && (
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-tight">
                          Comentários do Aluno:
                        </span>
                        <p className="text-sm text-foreground leading-relaxed italic bg-muted/10 p-3 rounded border">
                          "{fb.comments}"
                        </p>
                      </div>
                    )}

                    {fb.improvement_suggestions && (
                      <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                        <span className="text-xs font-bold text-blue-700 uppercase block mb-1">
                          Sugestão de Melhoria:
                        </span>
                        <p className="text-xs text-blue-800">{fb.improvement_suggestions}</p>
                      </div>
                    )}

                    {fb.missed_workout_reason && (
                      <div className="p-2 border border-dashed rounded text-xs text-muted-foreground">
                        <span className="font-bold">Motivo de falta:</span>{" "}
                        {fb.missed_workout_reason}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
