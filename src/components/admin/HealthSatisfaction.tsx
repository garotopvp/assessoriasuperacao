import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  HeartPulse,
  Smile,
  Meh,
  Frown,
  AlertCircle,
  TrendingUp,
  User,
  Phone,
  MessageCircle,
  Activity,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

interface DashboardStats {
  promoters: number;
  passives: number;
  detractors: number;
  avgNps: number;
  painReports: any[];
  recentAnamnesis: any[];
}

export function HealthSatisfaction() {
  const [stats, setStats] = useState<DashboardStats>({
    promoters: 0,
    passives: 0,
    detractors: 0,
    avgNps: 0,
    painReports: [],
    recentAnamnesis: [],
  });
  const [selectedAnamnesis, setSelectedAnamnesis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealthData();
  }, []);

  async function fetchHealthData() {
    setLoading(true);
    try {
      // 1. Buscar sessões com tags de dor ou NPS
      const { data: sessions, error } = await supabase
        .from("support_sessions")
        .select("*")
        .not("summary", "is", null);

      if (error) throw error;

      let promoters = 0;
      let passives = 0;
      let detractors = 0;
      let npsSum = 0;
      let npsCount = 0;

      sessions?.forEach((s) => {
        const npsMatch = s.summary?.match(/NPS: (\d+)/);
        if (npsMatch) {
          const score = parseInt(npsMatch[1]);
          npsSum += score;
          npsCount++;
          if (score >= 9) promoters++;
          else if (score >= 7) passives++;
          else detractors++;
        }
      });

      // 2. Buscar sessões com tag DOR_REPORTADA
      const { data: painSessions } = await supabase
        .from("support_sessions")
        .select("*, profile:profiles(*)")
        .contains("tags", ["DOR_REPORTADA"])
        .order("last_interaction", { ascending: false });

      // 3. Buscar Anamneses Recentes
      const { data: anamnesisData } = await supabase
        .from("student_anamnesis")
        .select("*, profile:profiles(*)")
        .order("created_at", { ascending: false })
        .limit(10);

      setStats({
        promoters,
        passives,
        detractors,
        avgNps: npsCount > 0 ? npsSum / npsCount : 0,
        painReports: painSessions || [],
        recentAnamnesis: anamnesisData || [],
      });
    } catch (err) {
      console.error("Erro ao carregar dados de saúde:", err);
    } finally {
      setLoading(false);
    }
  }

  const npsTotal = stats.promoters + stats.passives + stats.detractors;
  const npsScore = npsTotal > 0 ? ((stats.promoters - stats.detractors) / npsTotal) * 100 : 0;

  if (loading)
    return <div className="p-8 text-center text-muted-foreground">Carregando indicadores...</div>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">NPS Geral</CardTitle>
            <Smile className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{npsScore.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              Índice de satisfação (Net Promoter Score)
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-white dark:from-red-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Alertas de Dor</CardTitle>
            <HeartPulse className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.painReports.length}</div>
            <p className="text-xs text-muted-foreground text-red-600 font-medium">
              Casos que requerem atenção técnica
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Promotores (9-10)</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.promoters}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.promoters / (npsTotal || 1)) * 100).toFixed(0)}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Detratores (0-6)</CardTitle>
            <Frown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.detractors}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.detractors / (npsTotal || 1)) * 100).toFixed(0)}% do total
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Pain Management */}
        <Card className="col-span-1 border-red-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="text-red-500 h-5 w-5" />
              <CardTitle>Painel do Treinador: Alunos com Dor</CardTitle>
            </div>
            <CardDescription>
              Estes alunos reportaram desconforto no check-up de domingo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {stats.painReports.length === 0 ? (
                  <p className="text-sm text-center text-muted-foreground py-8 italic">
                    Nenhum alerta de dor registrado.
                  </p>
                ) : (
                  stats.painReports.map((report) => (
                    <div
                      key={report.id}
                      className="p-4 rounded-lg bg-muted/30 border border-border flex items-start justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <User className="h-5 w-5 mt-1 text-muted-foreground" />
                        <div>
                          <p className="font-semibold text-sm">
                            {report.profile?.nome_completo || report.student_phone}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Phone className="h-3 w-3" /> {report.student_phone}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="destructive" className="text-[10px]">
                              DOR REPORTADA
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {format(new Date(report.last_interaction), "dd/MM 'às' HH:mm", {
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <a
                        href={`https://wa.me/${report.student_phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MessageCircle className="h-5 w-5 text-green-500 hover:scale-110 transition-transform" />
                      </a>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Satisfaction Distribution */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Distribuição de Satisfação (NPS)</CardTitle>
            <CardDescription>Notas coletadas 2h após a aula experimental.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 mt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Smile className="h-4 w-4 text-green-500" /> Promotores
                </span>
                <span className="font-bold">{stats.promoters}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full"
                  style={{ width: `${(stats.promoters / (npsTotal || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Meh className="h-4 w-4 text-yellow-500" /> Passivos
                </span>
                <span className="font-bold">{stats.passives}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-yellow-500 h-3 rounded-full"
                  style={{ width: `${(stats.passives / (npsTotal || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Frown className="h-4 w-4 text-red-500" /> Detratores
                </span>
                <span className="font-bold">{stats.detractors}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-red-500 h-3 rounded-full"
                  style={{ width: `${(stats.detractors / (npsTotal || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div className="mt-6 p-4 bg-muted/40 rounded-lg text-xs text-muted-foreground leading-relaxed">
              💡 <strong>Dica:</strong> Alunos com nota 9 e 10 recebem automaticamente o incentivo
              para indicação de amigos (MGM). Detratores são automaticamente encaminhados para o
              setor de Comunicação.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Anamnesis Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="text-primary h-5 w-5" />
            <CardTitle>Últimas Anamneses Recebidas</CardTitle>
          </div>
          <CardDescription>Cadastros recentes com perfil de saúde e objetivos.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Objetivo</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead>Frequência</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentAnamnesis.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground italic"
                    >
                      Nenhuma anamnese encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.recentAnamnesis.map((anamnese) => (
                    <TableRow key={anamnese.id}>
                      <TableCell className="font-medium">
                        {anamnese.profile?.nome_completo || "Sem nome"}
                      </TableCell>
                      <TableCell className="text-xs uppercase font-bold text-muted-foreground">
                        {anamnese.objetivo_principal}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{anamnese.nivel_corrida}/10</Badge>
                      </TableCell>
                      <TableCell>{anamnese.frequencia_semanal}x/semana</TableCell>
                      <TableCell className="text-xs">
                        {(() => {
                          try {
                            return format(new Date(anamnese.created_at), "dd/MM/yyyy");
                          } catch (e) {
                            return "-";
                          }
                        })()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedAnamnesis(anamnese)}
                            >
                              Detalhes
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh]">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Activity className="text-primary" />
                                Anamnese: {anamnese.profile?.nome_completo}
                              </DialogTitle>
                              <DialogDescription>
                                Perfil completo de saúde e objetivos de corrida do aluno.
                              </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="pr-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                                <div className="space-y-4">
                                  <section>
                                    <h4 className="text-xs font-bold text-primary uppercase mb-2">
                                      Dados do Corredor
                                    </h4>
                                    <div className="space-y-1 text-sm">
                                      <p>
                                        <b>Data Nasc:</b>{" "}
                                        {(() => {
                                          try {
                                            return anamnese.data_nascimento
                                              ? format(
                                                  new Date(anamnese.data_nascimento),
                                                  "dd/MM/yyyy"
                                                )
                                              : "-";
                                          } catch (e) {
                                            return "-";
                                          }
                                        })()}
                                      </p>
                                      <p>
                                        <b>Peso:</b> {anamnese.peso} kg
                                      </p>
                                      <p>
                                        <b>Altura:</b> {anamnese.altura} cm
                                      </p>
                                      <p>
                                        <b>Profissão:</b> {anamnese.profissao} (
                                        {anamnese.carga_horaria})
                                      </p>
                                    </div>
                                  </section>
                                  <section>
                                    <h4 className="text-xs font-bold text-primary uppercase mb-2">
                                      Histórico & Metas
                                    </h4>
                                    <div className="space-y-1 text-sm">
                                      <p>
                                        <b>Nível:</b> {anamnese.nivel_corrida}/10
                                      </p>
                                      <p>
                                        <b>Freq:</b> {anamnese.frequencia_semanal}x por semana
                                      </p>
                                      <p>
                                        <b>Dias:</b> {anamnese.dias_favoraveis?.join(", ")}
                                      </p>
                                      <p>
                                        <b>Objetivo:</b> {anamnese.objetivo_principal}
                                      </p>
                                      <p>
                                        <b>Pace Atual:</b> {anamnese.pace_atual}
                                      </p>
                                      <p>
                                        <b>Equipamento:</b> {anamnese.uso_gps_app}
                                      </p>
                                    </div>
                                  </section>
                                </div>
                                <div className="space-y-4">
                                  <section>
                                    <h4 className="text-xs font-bold text-destructive uppercase mb-2">
                                      Saúde & Restrições
                                    </h4>
                                    <div className="space-y-1 text-sm">
                                      <p>
                                        <b>Medicamentos:</b>{" "}
                                        {anamnese.medicamento_controlado || "Nenhum"}
                                      </p>
                                      <p>
                                        <b>Restrições:</b> {anamnese.restricao_fisica || "Nenhuma"}
                                      </p>
                                      <p>
                                        <b>Lesões/Cirurgias:</b>{" "}
                                        {anamnese.historico_lesoes_cirurgias || "Nenhuma"}
                                      </p>
                                      <p>
                                        <b>Hiper/Diabetes:</b> {anamnese.hipertensao_diabetes}
                                      </p>
                                    </div>
                                  </section>
                                </div>
                              </div>
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
