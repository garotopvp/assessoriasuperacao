import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Send, Users, Clock, CheckCircle2, XCircle, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Campaign {
  id: string;
  title: string;
  message: string;
  target_audience: {
    type: string;
    filters?: any;
  };
  status: "DRAFT" | "SCHEDULED" | "SENDING" | "COMPLETED" | "CANCELLED";
  scheduled_at?: string;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  created_at: string;
  completed_at?: string;
}

export function BroadcastManager() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [sending, setSending] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState("ALL");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("broadcast_campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar campanhas");
      console.error(error);
    } else {
      setCampaigns(data || []);
    }
    setLoading(false);
  };

  const getTargetPhones = async (targetType: string) => {
    let phones: string[] = [];

    switch (targetType) {
      case "ALL":
        // Todos os perfis
        const { data: allProfiles } = await supabase
          .from("profiles")
          .select("telefone")
          .not("telefone", "is", null);
        phones = allProfiles?.map((p) => p.telefone) || [];
        break;

      case "ACTIVE":
        // Apenas assinantes ativos
        const { data: activeProfiles } = await supabase
          .from("profiles")
          .select("telefone")
          .not("telefone", "is", null);

        if (activeProfiles) {
          for (const profile of activeProfiles) {
            const { data: subscription } = await supabase
              .from("recurring_subscriptions")
              .select("status")
              .eq("user_phone", profile.telefone)
              .eq("status", "active")
              .single();

            if (subscription) {
              phones.push(profile.telefone);
            }
          }
        }
        break;

      case "TRIAL":
        // Apenas trial (sem assinatura ativa)
        const { data: trialProfiles } = await supabase
          .from("profiles")
          .select("telefone")
          .not("telefone", "is", null);

        if (trialProfiles) {
          for (const profile of trialProfiles) {
            const { data: subscription } = await supabase
              .from("recurring_subscriptions")
              .select("status")
              .eq("user_phone", profile.telefone)
              .eq("status", "active")
              .single();

            if (!subscription) {
              phones.push(profile.telefone);
            }
          }
        }
        break;

      case "INACTIVE":
        // Sem interação nos últimos 7 dias
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: inactiveSessions } = await supabase
          .from("support_sessions")
          .select("student_phone")
          .lt("last_interaction", sevenDaysAgo.toISOString());

        phones = [...new Set(inactiveSessions?.map((s) => s.student_phone) || [])];
        break;
    }

    return [...new Set(phones)]; // Remove duplicatas
  };

  const createCampaign = async () => {
    if (!title || !message) {
      toast.error("Preencha todos os campos");
      return;
    }

    const scheduledAt =
      scheduleDate && scheduleTime
        ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
        : null;

    const { data, error } = await supabase
      .from("broadcast_campaigns")
      .insert([
        {
          title,
          message,
          target_audience: { type: targetType },
          status: scheduledAt ? "SCHEDULED" : "DRAFT",
          scheduled_at: scheduledAt,
        },
      ])
      .select()
      .single();

    if (error) {
      toast.error("Erro ao criar campanha");
      console.error(error);
    } else {
      toast.success("Campanha criada com sucesso!");
      setShowCreateDialog(false);
      resetForm();
      fetchCampaigns();

      // Se não for agendada, perguntar se quer enviar agora
      if (!scheduledAt) {
        if (confirm("Deseja enviar esta campanha agora?")) {
          sendCampaign(data.id);
        }
      }
    }
  };

  const sendCampaign = async (campaignId: string) => {
    setSending(true);

    const campaign = campaigns.find((c) => c.id === campaignId);
    if (!campaign) return;

    try {
      // Buscar telefones do público-alvo
      const phones = await getTargetPhones(campaign.target_audience.type);

      if (phones.length === 0) {
        toast.error("Nenhum destinatário encontrado");
        setSending(false);
        return;
      }

      // Atualizar status da campanha
      await supabase.from("broadcast_campaigns").update({ status: "SENDING" }).eq("id", campaignId);

      // Criar registros de destinatários
      const recipients = phones.map((phone) => ({
        campaign_id: campaignId,
        student_phone: phone,
        status: "PENDING",
      }));

      await supabase.from("broadcast_recipients").insert(recipients);

      // Chamar Edge Function para enviar mensagens
      const { data, error } = await supabase.functions.invoke("send-broadcast", {
        body: {
          campaign_id: campaignId,
          message: campaign.message,
          phones,
        },
      });

      if (error) throw error;

      toast.success(`Campanha enviada para ${phones.length} pessoas!`);
      fetchCampaigns();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar campanha");
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setTargetType("ALL");
    setScheduleDate("");
    setScheduleTime("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="outline">Rascunho</Badge>;
      case "SCHEDULED":
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-500">
            <Clock className="w-3 h-3 mr-1" /> Agendada
          </Badge>
        );
      case "SENDING":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-500">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Enviando
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Concluída
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="outline">
            <XCircle className="w-3 h-3 mr-1" /> Cancelada
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTargetLabel = (type: string) => {
    switch (type) {
      case "ALL":
        return "Todos";
      case "ACTIVE":
        return "Assinantes Ativos";
      case "TRIAL":
        return "Trial";
      case "INACTIVE":
        return "Inativos (7+ dias)";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Campanhas de Broadcast</h2>
          <p className="text-muted-foreground">Envie mensagens em massa para seus alunos</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Campanha</DialogTitle>
              <DialogDescription>
                Crie uma campanha de mensagens para enviar em massa
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="title">Título da Campanha</Label>
                <Input
                  id="title"
                  placeholder="Ex: Boas-vindas Novos Alunos"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="message">Mensagem</Label>
                <Textarea
                  id="message"
                  placeholder="Digite a mensagem que será enviada..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Você pode usar variáveis: {"{nome}"}, {"{plano}"}
                </p>
              </div>

              <div>
                <Label htmlFor="target">Público-Alvo</Label>
                <Select value={targetType} onValueChange={setTargetType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos os Alunos</SelectItem>
                    <SelectItem value="ACTIVE">Apenas Assinantes Ativos</SelectItem>
                    <SelectItem value="TRIAL">Apenas Trial</SelectItem>
                    <SelectItem value="INACTIVE">Inativos (7+ dias sem interação)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduleDate">Agendar para (Opcional)</Label>
                  <Input
                    id="scheduleDate"
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="scheduleTime">Horário</Label>
                  <Input
                    id="scheduleTime"
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    disabled={!scheduleDate}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={createCampaign}>Criar Campanha</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12">Carregando...</div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Send className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma campanha criada ainda</p>
            <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Campanha
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle>{campaign.title}</CardTitle>
                      {getStatusBadge(campaign.status)}
                    </div>
                    <CardDescription className="line-clamp-2">{campaign.message}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {campaign.status === "DRAFT" && (
                      <Button
                        size="sm"
                        onClick={() => sendCampaign(campaign.id)}
                        disabled={sending}
                      >
                        {sending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Enviar Agora
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Público-Alvo</p>
                    <p className="font-medium">{getTargetLabel(campaign.target_audience.type)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Enviadas</p>
                    <p className="font-medium">{campaign.sent_count}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Entregues</p>
                    <p className="font-medium">{campaign.delivered_count}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Lidas</p>
                    <p className="font-medium">{campaign.read_count}</p>
                  </div>
                </div>
                {campaign.scheduled_at && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Agendada para{" "}
                      {format(new Date(campaign.scheduled_at), "dd/MM/yyyy 'às' HH:mm")}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
