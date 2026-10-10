import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Search, RefreshCw, Smartphone, Mail } from "lucide-react";
import { format, startOfWeek, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Student {
  user_id: string;
  nome_completo: string | null;
  email: string | null;
  telefone: string | null;
  last_feedback_date?: string | null;
}

export function PendingFeedbacks() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [sendingReminders, setSendingReminders] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [sendingIndividual, setSendingIndividual] = useState<string | null>(null);
  const [sendLogs, setSendLogs] = useState<Record<string, { email?: string; whatsapp?: string }>>(
    {}
  ); // user_id -> { email?: date, whatsapp?: date }

  // Function to calculate previous week start
  const getPreviousWeekStart = () => {
    return startOfWeek(subDays(new Date(), 7), { weekStartsOn: 1 });
  };

  const sendReminders = async (userIds?: string[], channels: string[] = ["email"]) => {
    const count = userIds
      ? userIds.length
      : selectedUsers.size > 0
        ? selectedUsers.size
        : filteredStudents.length;
    const targetIds = userIds || (selectedUsers.size > 0 ? Array.from(selectedUsers) : undefined);
    const channelsLabel = channels.join(" e ");

    if (!confirm(`Deseja enviar lembretes por ${channelsLabel} para ${count} alunos?`)) return;

    try {
      if (userIds && userIds.length === 1) {
        setSendingIndividual(userIds[0]);
      } else {
        setSendingReminders(true);
      }

      const { data, error } = await supabase.functions.invoke("send-feedback-reminders", {
        body: {
          userIds: targetIds,
          channels: channels,
        },
      });

      if (error) throw error;

      toast.success(`Lembretes enviados com sucesso via ${channelsLabel}!`);
      console.log("Reminders result:", data);

      // Refresh counts and logs after sending
      fetchPendingFeedbacks();
      if (!userIds) setSelectedUsers(new Set());
    } catch (error: any) {
      console.error("Error sending reminders:", error);
      toast.error("Erro ao enviar lembretes: " + (error.message || "Erro desconhecido"));
    } finally {
      setSendingReminders(false);
      setSendingIndividual(null);
    }
  };

  useEffect(() => {
    fetchPendingFeedbacks();
  }, []);

  const fetchPendingFeedbacks = async () => {
    try {
      setLoading(true);
      const weekStartStr = format(currentWeekStart, "yyyy-MM-dd");

      // 1. Get all students (profiles that are not admins)
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, nome_completo, email, telefone, is_admin")
        .eq("is_admin", false);

      if (profilesError) throw profilesError;

      // 2. Get feedbacks for the current week
      const { data: feedbacks, error: feedbacksError } = await supabase
        .from("weekly_feedbacks")
        .select("user_id, created_at")
        .gte("week_start_date", weekStartStr);

      if (feedbacksError) throw feedbacksError;

      // 3. Get send logs for the current week (to prevent spam)
      const { data: logs, error: logsError } = await supabase
        .from("feedback_reminders_log")
        .select("user_id, sent_at, channel")
        .eq("week_start_date", weekStartStr);

      if (logsError) throw logsError;

      const logMap: Record<string, { email?: string; whatsapp?: string }> = {};
      logs?.forEach((log) => {
        if (log.user_id) {
          if (!logMap[log.user_id]) logMap[log.user_id] = {};
          if (log.channel === "whatsapp") {
            logMap[log.user_id].whatsapp = log.sent_at;
          } else {
            logMap[log.user_id].email = log.sent_at;
          }
        }
      });
      setSendLogs(logMap);

      // 4. Filter students who haven't submitted feedback
      const submittedUserIds = new Set(feedbacks?.map((f) => f.user_id));
      const pendingStudents =
        profiles?.filter((profile) => !submittedUserIds.has(profile.user_id)) || [];

      // Sort alphabetically
      pendingStudents.sort((a, b) => (a.nome_completo || "").localeCompare(b.nome_completo || ""));

      setStudents(pendingStudents);
    } catch (error) {
      console.error("Error fetching pending feedbacks:", error);
      toast.error("Erro ao carregar lista de pendências.");
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppClick = (student: Student) => {
    if (!student.telefone) {
      toast.error("Telefone não cadastrado para este aluno.");
      return;
    }

    // Clean phone number (remove non-digits)
    const cleanPhone = student.telefone.replace(/\D/g, "");

    // Add country code if missing (assuming BR +55)
    const finalPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;

    const firstName = student.nome_completo?.split(" ")[0] || "Atleta";
    const message = `Fala ${firstName}! 🏃‍♂️\n\nNão esqueça de enviar seu feedback semanal do Superação Assessoria!\nÉ rapidinho e ajuda muito nos ajustes do treino:\n\nhttps://superacaoassessoria.com/app/feedback`;

    const url = `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const sendTestEmail = async () => {
    const email = window.prompt("Digite o email para teste:", "rinaldopedroso@gmail.com");
    if (!email) return;

    try {
      setSendingReminders(true);
      const { data, error } = await supabase.functions.invoke("send-feedback-reminders", {
        body: { testEmail: email },
      });

      if (error) throw error;

      toast.success(`Email de teste enviado para ${email}!`);
      console.log("Test email result:", data);
    } catch (error: any) {
      console.error("Error sending test email:", error);
      toast.error("Erro ao enviar email de teste: " + (error.message || "Erro desconhecido"));
    } finally {
      setSendingReminders(false);
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredStudents.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredStudents.map((s) => s.user_id)));
    }
  };

  const toggleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-muted/30 p-4 rounded-lg border">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Cobrança de Feedback
          </h3>
          <p className="text-sm text-muted-foreground">
            Alunos que ainda não enviaram feedback da semana de{" "}
            <strong>{format(currentWeekStart, "dd 'de' MMMM", { locale: ptBR })}</strong>.
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar aluno..."
              className="pl-8 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchPendingFeedbacks}
            title="Atualizar lista"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            variant="outline"
            onClick={sendTestEmail}
            disabled={sendingReminders}
            title="Enviar email de teste"
            className="gap-2"
          >
            <Mail className="h-4 w-4" />
            <span className="hidden md:inline">Teste Email</span>
          </Button>
          <Button
            variant={selectedUsers.size > 0 ? "default" : "secondary"}
            onClick={() => sendReminders(undefined, ["email"])}
            disabled={sendingReminders || filteredStudents.length === 0}
            title={
              selectedUsers.size > 0
                ? `Enviar Email para ${selectedUsers.size} selecionados`
                : "Enviar Email para todos os pendentes"
            }
            className="gap-2"
          >
            <Mail className="h-4 w-4" />
            <span className="hidden md:inline">
              {selectedUsers.size > 0 ? `Email (${selectedUsers.size})` : "Email Todos"}
            </span>
          </Button>
          <Button
            variant={selectedUsers.size > 0 ? "default" : "secondary"}
            onClick={() => sendReminders(undefined, ["whatsapp"])}
            disabled={sendingReminders || filteredStudents.length === 0}
            title={
              selectedUsers.size > 0
                ? `Enviar WhatsApp Bot para ${selectedUsers.size} selecionados`
                : "Enviar WhatsApp Bot para todos os pendentes"
            }
            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="hidden md:inline">
              {selectedUsers.size > 0 ? `WPP Bot (${selectedUsers.size})` : "WPP Bot Todos"}
            </span>
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      checked={
                        filteredStudents.length > 0 &&
                        selectedUsers.size === filteredStudents.length
                      }
                      onChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="min-w-[150px]">Aluno</TableHead>
                  <TableHead className="min-w-[120px]">Contato</TableHead>
                  <TableHead className="text-right min-w-[200px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-green-600 font-medium">
                      🎉 Todos os alunos enviaram feedback esta semana!
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow
                      key={student.user_id}
                      className={selectedUsers.has(student.user_id) ? "bg-muted/50" : ""}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300"
                          checked={selectedUsers.has(student.user_id)}
                          onChange={() => toggleSelectUser(student.user_id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{student.nome_completo || "Sem nome"}</span>
                          <div className="flex items-center gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs text-muted-foreground">{student.email}</span>
                              {sendLogs[student.user_id]?.email && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] py-0 h-4 bg-blue-50 text-blue-700 border-blue-200"
                                  title={`E-mail enviado em ${format(new Date(sendLogs[student.user_id].email!), "dd/MM HH:mm")}`}
                                >
                                  Email OK
                                </Badge>
                              )}
                              {sendLogs[student.user_id]?.whatsapp && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] py-0 h-4 bg-green-50 text-green-700 border-green-200"
                                  title={`WhatsApp enviado em ${format(new Date(sendLogs[student.user_id].whatsapp!), "dd/MM HH:mm")}`}
                                >
                                  WPP Bot OK
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Smartphone className="h-4 w-4" />
                          {student.telefone || "Não cadastrado"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant={sendLogs[student.user_id]?.email ? "ghost" : "outline"}
                            size="sm"
                            className="gap-1 px-2"
                            onClick={() => sendReminders([student.user_id], ["email"])}
                            disabled={
                              sendingReminders ||
                              sendingIndividual === student.user_id ||
                              !student.email
                            }
                            title={
                              sendLogs[student.user_id]?.email
                                ? "Reenviar e-mail (já enviado esta semana)"
                                : "Enviar e-mail reminder"
                            }
                          >
                            <Mail
                              className={`h-4 w-4 ${sendingIndividual === student.user_id ? "animate-spin" : ""}`}
                            />
                            {sendLogs[student.user_id]?.email ? "Reenviar" : "Email"}
                          </Button>
                          <Button
                            variant={sendLogs[student.user_id]?.whatsapp ? "ghost" : "outline"}
                            size="sm"
                            className="gap-1 px-2 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                            onClick={() => sendReminders([student.user_id], ["whatsapp"])}
                            disabled={
                              sendingReminders ||
                              sendingIndividual === student.user_id ||
                              !student.telefone
                            }
                            title={
                              sendLogs[student.user_id]?.whatsapp
                                ? "Reenviar WhatsApp Bot (já enviado esta semana)"
                                : "Enviar WhatsApp automático via Bot"
                            }
                          >
                            <MessageCircle
                              className={`h-4 w-4 ${sendingIndividual === student.user_id ? "animate-spin" : ""}`}
                            />
                            {sendLogs[student.user_id]?.whatsapp ? "Reenviar WPP" : "Bot WPP"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 px-2 text-muted-foreground hover:text-foreground"
                            onClick={() => handleWhatsAppClick(student)}
                            disabled={!student.telefone}
                            title="Abrir WhatsApp manual"
                          >
                            <Smartphone className="h-4 w-4" />
                          </Button>
                        </div>
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
