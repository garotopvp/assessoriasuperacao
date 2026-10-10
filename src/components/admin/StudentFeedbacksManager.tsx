import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Eye, Clock, Mail, User, Star, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

type StudentFeedback = {
  id: string;
  name?: string;
  email: string;
  time_in_advisory?: string;
  rating?: number;
  nps_score?: number;
  shirt_size?: string;
  shirt_model?: string;
  blood_type?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  instagram?: string;
  improve: string;
  missing: string;
  good: string;
  created_at: string;
};

export function StudentFeedbacksManager() {
  const [feedbacks, setFeedbacks] = useState<StudentFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<StudentFeedback | null>(null);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("student_feedbacks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setFeedbacks(data || []);
    } catch (error) {
      console.error("Erro ao buscar feedbacks de alunos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pesquisa de Satisfação (Alunos)</h2>
          <p className="text-muted-foreground">
            Visualize as respostas completas do formulário público de avaliação.
          </p>
        </div>
        <Badge variant="secondary" className="px-4 py-1 text-sm">
          {feedbacks.length} {feedbacks.length === 1 ? "Resposta" : "Respostas"}
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Últimos Preenchimentos</CardTitle>
          <CardDescription>
            Lista de alunos que enviaram feedback.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] rounded-md border w-full">
            <Table>
              <TableHeader className="sticky top-0 bg-secondary/90 z-10 backdrop-blur supports-[backdrop-filter]:bg-secondary/50">
                <TableRow>
                  <TableHead className="w-[180px]">Data</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Nota</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Carregando dados...
                    </TableCell>
                  </TableRow>
                ) : feedbacks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Nenhum feedback encontrado. Compartilhe o link /pesquisa-satisfacao para receber respostas.
                    </TableCell>
                  </TableRow>
                ) : (
                  feedbacks.map((f) => (
                    <TableRow key={f.id} className="group hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          {format(new Date(f.created_at), "dd/MM/yyyy • HH:mm", {
                            locale: ptBR,
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold">{f.name || "Não informado"}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {f.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-yellow-500 font-bold">
                          <Star className="w-4 h-4 fill-current" />
                          {f.rating ? f.rating : "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                              onClick={() => setSelectedFeedback(f)}
                            >
                              <Eye className="w-4 h-4" />
                              <span className="hidden sm:inline">Ver Detalhes</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2 text-2xl mb-2 text-primary">
                                <User className="w-6 h-6" />
                                {selectedFeedback?.name || "Aluno sem nome"}
                              </DialogTitle>
                              <DialogDescription className="text-base flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4" /> 
                                  {selectedFeedback?.email}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  Enviado em {selectedFeedback?.created_at && format(new Date(selectedFeedback.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                                </div>
                              </DialogDescription>
                            </DialogHeader>

                            <div className="flex items-center gap-6 p-4 rounded-xl border bg-secondary/20">
                              <div className="flex flex-col gap-1">
                                <span className="text-sm font-semibold text-muted-foreground uppercase">Avaliação</span>
                                <div className="flex items-center gap-1 text-yellow-500 font-black text-2xl">
                                  <Star className="w-6 h-6 fill-current" />
                                  {selectedFeedback?.rating || "-"} / 5
                                </div>
                              </div>
                              <div className="h-10 w-px bg-border"></div>
                              <div className="flex flex-col gap-1 text-center md:text-left">
                                <span className="text-sm font-semibold text-muted-foreground uppercase flex items-center gap-1 justify-center md:justify-start">
                                  <Calendar className="w-4 h-4" /> Tempo de Casa
                                </span>
                                <span className="font-bold text-lg">
                                  {selectedFeedback?.time_in_advisory || "Não informado"}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl border bg-secondary/10">
                              <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground uppercase font-semibold">Tamanho da Camiseta</span>
                                <span className="font-medium text-sm">
                                  {selectedFeedback?.shirt_model ? `${selectedFeedback.shirt_model} - ` : ""}
                                  {selectedFeedback?.shirt_size || "Não informado"}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground uppercase font-semibold">Tipo Sanguíneo</span>
                                <span className="font-medium text-sm">{selectedFeedback?.blood_type || "N/A"}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground uppercase font-semibold">Instagram</span>
                                <span className="font-medium text-sm">{selectedFeedback?.instagram ? `@${selectedFeedback.instagram}` : "N/A"}</span>
                              </div>
                              <div className="flex flex-col md:col-span-1 mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <span className="text-xs text-red-600 uppercase font-black">Contato de Emergência</span>
                                <span className="font-medium text-sm text-red-700">
                                  {selectedFeedback?.emergency_contact_name ? `${selectedFeedback.emergency_contact_name} - ` : "Não informado"}
                                  {selectedFeedback?.emergency_contact_phone || ""}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-6 pt-2">
                              {/* Respostas discursivas */}
                              <div className="space-y-3 bg-secondary/30 p-5 rounded-lg border border-green-500/20">
                                <h4 className="font-bold text-sm uppercase text-muted-foreground flex items-center gap-2 pb-2 border-b">
                                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                  O que já está muito bom e deve continuar?
                                </h4>
                                <div className="text-base leading-relaxed pl-2 whitespace-pre-wrap">
                                  {selectedFeedback?.good || "-"}
                                </div>
                              </div>

                              <div className="space-y-3 bg-secondary/30 p-5 rounded-lg border border-blue-500/20">
                                <h4 className="font-bold text-sm uppercase text-muted-foreground flex items-center gap-2 pb-2 border-b">
                                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                  O que sente falta hoje na assessoria?
                                </h4>
                                <div className="text-base leading-relaxed pl-2 whitespace-pre-wrap">
                                  {selectedFeedback?.missing || "-"}
                                </div>
                              </div>

                              <div className="space-y-3 bg-secondary/30 p-5 rounded-lg border border-red-500/20">
                                <h4 className="font-bold text-sm uppercase text-muted-foreground flex items-center gap-2 pb-2 border-b">
                                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                  O que acha que pode melhorar?
                                </h4>
                                <div className="text-base leading-relaxed pl-2 whitespace-pre-wrap">
                                  {selectedFeedback?.improve || "-"}
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
      <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg flex items-center justify-between">
         <p className="text-sm">
           <strong>Link do formulário para compartilhar:</strong> <a href="/pesquisa-satisfacao" className="text-primary hover:underline font-medium ml-1" target="_blank" rel="noreferrer">SeuSite.com/pesquisa-satisfacao</a>
         </p>
      </div>
    </div>
  );
}
