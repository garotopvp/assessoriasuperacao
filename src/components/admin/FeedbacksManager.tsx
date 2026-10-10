import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Feedback {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  category?: string;
  status?: string;
  user?: {
    // Join manual ou view
    email: string;
    nome_completo?: string;
  };
}

export function FeedbacksManager() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({ average: 0, total: 0, nps: 0 });

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);

      // Fetch feedbacks
      const { data: feedbacksData, error } = await supabase
        .from("feedbacks")
        .select(
          `
          *,
          profiles:user_id (nome_completo)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Map and type assertion since join returns array or object depending on relationship
      const formattedFeedbacks = feedbacksData.map((item: any) => ({
        ...item,
        category: item.category || "Geral",
        status: item.status || "pendente",
        user: item.profiles
          ? {
              email: "Email restrito", // Email column not available in profiles table
              nome_completo: item.profiles.nome_completo,
            }
          : null,
      }));

      setFeedbacks(formattedFeedbacks);

      // Calculate metrics
      if (formattedFeedbacks.length > 0) {
        const total = formattedFeedbacks.length;
        const sum = formattedFeedbacks.reduce(
          (acc: number, curr: Feedback) => acc + curr.rating,
          0
        );
        const average = sum / total;

        // NPS approximation (Promoters: 5, Detractors: 1-3, Neutrals: 4) - Adapting 5-star to NPS logic
        const promoters = formattedFeedbacks.filter((f: Feedback) => f.rating === 5).length;
        const detractors = formattedFeedbacks.filter((f: Feedback) => f.rating <= 3).length;
        const nps = ((promoters - detractors) / total) * 100;

        setMetrics({ average, total, nps });
      } else {
        setMetrics({ average: 0, total: 0, nps: 0 });
      }
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Carregando avaliações...</div>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média de Satisfação</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.average.toFixed(1)} / 5.0</div>
            <p className="text-xs text-muted-foreground">Baseado em {metrics.total} avaliações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NPS Aproximado</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.nps.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Score de lealdade (-100 a 100)</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Avaliações</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assunto</TableHead>
                <TableHead>Aluno</TableHead>
                <TableHead>Nota</TableHead>
                <TableHead>Comentário</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feedbacks.map((feedback) => (
                <TableRow key={feedback.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(feedback.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        feedback.status === "resolvido"
                          ? "default"
                          : feedback.status === "lido"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {feedback.status?.toUpperCase() || "PENDENTE"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {feedback.category || "Geral"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {feedback.user?.nome_completo || "Anônimo"}
                      </span>
                      <span className="text-xs text-muted-foreground">{feedback.user?.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex text-yellow-500">
                      {Array.from({ length: feedback.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md truncate" title={feedback.comment || ""}>
                    {feedback.comment || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
