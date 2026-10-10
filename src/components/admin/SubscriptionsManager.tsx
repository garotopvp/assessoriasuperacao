import { logger } from "@/lib/logger";
import { createSystemLog } from "@/utils/logger";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn, formatName } from "@/lib/utils";
import { usePlans } from "@/hooks/usePlans";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  RefreshCw,
  Search,
  Mail,
  Calendar,
  CreditCard,
  User,
  AlertCircle,
  CheckCircle,
  Phone,
  XCircle,
  Clock,
  Ban,
  Wand2,
  Send,
  FileText,
  Printer,
  Handshake,
  Download,
  MessageSquare,
} from "lucide-react";
import { DashboardCharts } from "@/components/admin/DashboardCharts";
import PlansPieChart from "@/components/admin/PlansPieChart";
import { TERMS_CONTENT, COMPANY_INFO } from "@/data/terms";

interface RecurringSubscription {
  id: string;
  user_id: string;
  student_name: string;
  student_email: string;
  student_phone: string | null;
  plan_name: string;
  amount: number;
  status: "active" | "past_due" | "canceled" | "blocked" | "waiting_details" | "partnership";
  next_billing_date: string;
  last_payment_at?: string;
  created_at: string;
  terms_accepted_at?: string;
  cpf?: string;
  squad_id?: string | null;
  auto_billing_enabled?: boolean;
}

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: any;
    className?: string;
  }
> = {
  active: {
    label: "Ativo",
    variant: "default",
    icon: CheckCircle,
    className: "bg-green-600 hover:bg-green-700",
  },
  past_due: { label: "Pagamento Pendente", variant: "destructive", icon: AlertCircle },
  canceled: { label: "Cancelado", variant: "outline", icon: XCircle },
  blocked: { label: "Bloqueado", variant: "destructive", icon: Ban },
  waiting_details: { label: "Aguardando Valor", variant: "secondary", icon: Clock },
  partnership: {
    label: "Parceria",
    variant: "default",
    icon: Handshake,
    className: "bg-purple-600 hover:bg-purple-700",
  },
};

// Helper: retorna quantos meses dura o ciclo de cada plano
const getPlanPeriodMonths = (planName: string): number => {
  const name = (planName || "").toLowerCase();
  if (name.includes("trimestral")) return 3;
  if (name.includes("semestral")) return 6;
  if (name.includes("anual")) return 12;
  return 1;
};

export function SubscriptionsManager() {
  const [selectedSubscription, setSelectedSubscription] = useState<RecurringSubscription | null>(
    null
  );
  const [subscriptions, setSubscriptions] = useState<RecurringSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [tabFilter, setTabFilter] = useState<string>("active");
  const [editAmount, setEditAmount] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [sendEmailOnActivation, setSendEmailOnActivation] = useState(true);
  const [editNextBillingDate, setEditNextBillingDate] = useState<string>("");
  const [editName, setEditName] = useState<string>("");
  const [editPhone, setEditPhone] = useState<string>("");
  const [editStatus, setEditStatus] = useState<string>("");
  const [editPlanName, setEditPlanName] = useState<string>("");
  const [editLastPaymentDate, setEditLastPaymentDate] = useState<string>("");
  const [editSquadId, setEditSquadId] = useState<string | null>(null);
  const [squads, setSquads] = useState<{ id: string; name: string }[]>([]);
  const queryClient = useQueryClient();

  // Buscar configuração de cobrança automática
  const { data: billingConfig, isLoading: loadingConfig } = useQuery({
    queryKey: ["billing_config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_settings")
        .select("value")
        .eq("key", "billing_config")
        .maybeSingle();

      if (error) throw error;
      return data?.value || { auto_billing_enabled: true };
    },
  });

  const updateBillingToggle = useMutation({
    mutationFn: async (enabled: boolean) => {
      const config = (billingConfig as any) || { auto_billing_enabled: true };
      const newValue = { ...config, auto_billing_enabled: enabled };
      const { error } = await supabase
        .from("support_settings")
        .update({ value: newValue })
        .eq("key", "billing_config");

      if (error) throw error;
      return enabled;
    },
    onSuccess: (enabled) => {
      queryClient.setQueryData(["billing_config"], (old: any) => ({
        ...old,
        auto_billing_enabled: enabled,
      }));
      toast.success(enabled ? "Cobrança automática ATIVADA" : "Cobrança automática DESATIVADA");
    },
    onError: () => {
      toast.error("Erro ao atualizar configuração");
    },
  });

  const { plans } = usePlans(); // Use hook

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      // Fetch squads first
      const { data: squadsData } = await supabase.from("squads").select("id, name");
      if (squadsData) setSquads(squadsData);

      const { data, error } = await supabase
        .from("recurring_subscriptions" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const subs = (data as unknown as RecurringSubscription[]) || [];

      // Fetch profile data (terms acceptance, squad)
      const userIds = [...new Set(subs.map((s) => s.user_id).filter(Boolean))];

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles" as any)
          .select("user_id, terms_accepted_at, cpf, squad_id")
          .in("user_id", userIds);

        const mergedSubs = subs.map((sub) => {
          const profile = (profiles as any[])?.find((p: any) => p.user_id === sub.user_id);
          return {
            ...sub,
            terms_accepted_at: profile?.terms_accepted_at,
            cpf: profile?.cpf,
            squad_id: profile?.squad_id,
          };
        });
        setSubscriptions(mergedSubs as unknown as RecurringSubscription[]);
      } else {
        setSubscriptions(subs);
      }
    } catch (err) {
      logger.error("Error fetching subscriptions:", err);
      toast.error("Erro ao carregar assinaturas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  useEffect(() => {
    if (selectedSubscription) {
      setEditAmount(selectedSubscription.amount.toString());
      setEditName(selectedSubscription.student_name || "");
      setEditPhone(selectedSubscription.student_phone || "");
      setEditStatus(selectedSubscription.status);
      setEditPlanName(selectedSubscription.plan_name || "");
      setEditSquadId(selectedSubscription.squad_id || "none");

      // Format date for date input (YYYY-MM-DD)
      if (selectedSubscription.next_billing_date) {
        const date = new Date(selectedSubscription.next_billing_date);
        setEditNextBillingDate(date.toISOString().split("T")[0]);
      } else {
        setEditNextBillingDate("");
      }

      if (selectedSubscription.last_payment_at) {
        const date = new Date(selectedSubscription.last_payment_at);
        setEditLastPaymentDate(date.toISOString().split("T")[0]);
      } else {
        setEditLastPaymentDate("");
      }

      // Auto-fill amount if it's 0 or empty and plan is found
      if (
        (!selectedSubscription.amount || selectedSubscription.amount === 0) &&
        selectedSubscription.plan_name
      ) {
        // attempt to autofill directly? maybe better not to be too invasive.
        // But if plan is PARCERIA, it makes sense to init with 0.
        if (selectedSubscription.plan_name.toUpperCase().includes("PARCERIA")) {
          setEditAmount("0");
        }
      }
    }
  }, [selectedSubscription]);

  // Protection: disable email if setting a future date
  useEffect(() => {
    if (editNextBillingDate) {
      const billingDate = new Date(editNextBillingDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // If billing date is in the future (tomorrow or later), default to NOT sending email
      if (billingDate > today) {
        setSendEmailOnActivation(false);
      }
    }
  }, [editNextBillingDate]);

  // Auto-calculate next billing date when last payment or plan change
  useEffect(() => {
    if (editLastPaymentDate && editPlanName) {
      const lastDate = new Date(editLastPaymentDate);
      // Evitar loop infinito: só atualizamos se a data de cobrança for vazia ou se o usuário acabou de mudar a data de pagamento
      // (usamos um truque simples de ignorar se já houver uma data definida e ela não bater com o cálculo, permitindo ajuste manual)
      const months = getPlanPeriodMonths(editPlanName);
      const nextDate = new Date(lastDate);
      nextDate.setMonth(nextDate.getMonth() + months);
      
      const nextDateStr = nextDate.toISOString().split("T")[0];
      
      // Só atualiza se for diferente para evitar ciclos de renderização
      if (editNextBillingDate !== nextDateStr) {
        setEditNextBillingDate(nextDateStr);
        // Se mudou ou definiu data, o status provavelmente deve ser ativo
        if (editStatus === "waiting_details" || editStatus === "past_due") {
          setEditStatus("active");
        }
      }
    }
  }, [editLastPaymentDate, editPlanName]);

  const updateSubscription = async (id: string, updates: Partial<RecurringSubscription>) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("recurring_subscriptions" as any)
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      toast.success("Assinatura atualizada com sucesso");

      // Update local state
      setSubscriptions((subs) => subs.map((sub) => (sub.id === id ? { ...sub, ...updates } : sub)));

      if (selectedSubscription?.id === id) {
        setSelectedSubscription((prev) => (prev ? { ...prev, ...updates } : null));
      }

      return true; // Success
    } catch (err) {
      logger.error("Error updating subscription:", err);
      toast.error("Erro ao atualizar assinatura");
      return false; // Failure
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAcceptValue = async () => {
    if (!selectedSubscription) return;
    const amount = parseFloat(editAmount.replace(",", ".")); // Handle potential comma input
    if (isNaN(amount)) {
      toast.error("Valor inválido");
      return;
    }

    const isActivating = selectedSubscription.status === "waiting_details";
    const newStatus = (isActivating && editStatus === "waiting_details" ? "active" : editStatus) as
      | "active"
      | "past_due"
      | "canceled"
      | "blocked"
      | "waiting_details"
      | "partnership";

    const success = await updateSubscription(selectedSubscription.id, {
      amount: amount,
      student_name: editName,
      student_phone: editPhone,
      plan_name: editPlanName,
      status: newStatus,
      next_billing_date: editNextBillingDate
        ? new Date(editNextBillingDate).toISOString()
        : undefined,
      last_payment_at: editLastPaymentDate
        ? new Date(editLastPaymentDate).toISOString()
        : undefined,
    });

    if (success) {
      await createSystemLog({
        action: "update_subscription_value",
        category: "payment",
        level: "warning",
        message: `O valor ou data da assinatura de ${selectedSubscription.student_email} foi atualizado para R$ ${amount}.`,
        details: { subscriptionId: selectedSubscription.id, newAmount: amount, newStatus },
      });

      // Update squad in profile if changed
      if (editSquadId !== selectedSubscription.squad_id) {
        const finalSquadId = editSquadId === "none" ? null : editSquadId;
        await supabase
          .from("profiles")
          .update({ squad_id: finalSquadId })
          .eq("user_id", selectedSubscription.user_id);

        // Update local state for all subs of this user
        setSubscriptions((prev) =>
          prev.map((s) => (s.user_id === selectedSubscription.user_id ? { ...s, squad_id: finalSquadId } : s))
        );
      }
    }

    if (success && sendEmailOnActivation && isActivating) {
      // Trigger send email logic
      toast.info("Enviando email de cobrança...");

      try {
        const { error } = await supabase.functions.invoke("send-subscription-email", {
          body: { subscriptionId: selectedSubscription.id },
        });

        if (error) throw error;
        toast.success("Email de cobrança enviado automaticamente!");
      } catch (err) {
        logger.error("Erro ao enviar email automático:", err);
        toast.error("Erro ao enviar email de cobrança automático (assinatura foi ativada).");
      }
    }
  };

  const handleSetPartnership = async () => {
    if (!selectedSubscription) return;

    // Partnerships have 0 value and special status
    const success = await updateSubscription(selectedSubscription.id, {
      amount: 0,
      status: "partnership",
      next_billing_date: new Date(
        new Date().setFullYear(new Date().getFullYear() + 100)
      ).toISOString(), // Effectively never expires
    });

    if (success) {
      toast.success("Assinatura definida como Parceria!");
    }
  };

  const handlePrintTerms = (
    studentName: string,
    cpf: string | undefined,
    acceptedAt: string | undefined
  ) => {
    const printWindow = window.open("", "", "width=800,height=600");
    if (printWindow) {
      printWindow.document.write(`
            <html>
                <head>
                    <title>Termo de Adesão - ${studentName}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
                        h1 { font-size: 18px; text-align: center; margin-bottom: 20px; }
                        p { margin-bottom: 10px; font-size: 12px; }
                        .footer { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 10px; text-align: center; color: #666; }
                    </style>
                </head>
                <body>
                    <h1>TERMO DE RESPONSABILIDADE E ADESÃO</h1>
                    <p><strong>1. DO OBJETO</strong><br>O presente termo tem como objeto a prestação de serviços de assessoria esportiva e orientação de corrida pela empresa <strong>${COMPANY_INFO.razaoSocial}</strong>, inscrita no CNPJ sob o nº <strong>${COMPANY_INFO.cnpj}</strong>, nome fantasia <strong>${COMPANY_INFO.nomeFantasia}</strong>.</p>
                    <p><strong>2. DA SAÚDE E APTIDÃO FÍSICA</strong><br>Declaro, para os devidos fins, que estou apto(a) a praticar atividades físicas e que não possuo contraindicações médicas. Reconheço que é de minha inteira responsabilidade realizar exames médicos periódicos (check-up) antes de iniciar os treinos. Isento o SUPERAÇÃO ASSESSORIA ESPORTIVA e seus treinadores de qualquer responsabilidade sobre problemas de saúde pré-existentes ou mal súbitos que possam ocorrer durante a prática das atividades.</p>
                    <p><strong>3. DOS RISCOS DA ATIVIDADE</strong><br>Estou ciente de que a prática de corrida envolve riscos inerentes à atividade, tais como torções, quedas e lesões musculares. Assumo total responsabilidade por minha integridade física durante os treinos presenciais ou realizados à distância, comprometendo-me a seguir as orientações dos treinadores.</p>
                    <p><strong>4. DO USO DE IMAGEM</strong><br>Autorizo, a título gratuito, o uso da minha imagem em fotos e vídeos captados durante treinos e eventos do SUPERAÇÃO ASSESSORIA ESPORTIVA, para fins de divulgação nas redes sociais e materiais promocionais da assessoria.</p>
                    <p><strong>5. DA ASSINATURA E CANCELAMENTO</strong><br>Estou ciente de que os planos possuem renovação de acordo com a periodicidade contratada. O cancelamento deve ser solicitado com antecedência mínima de 30 dias. Não haverá reembolso de valores referentes a períodos não utilizados por desistência do aluno.</p>
                    <p><strong>6. DISPOSIÇÕES GERAIS</strong><br>Ao aceitar este termo, confirmo a veracidade de todas as informações prestadas no cadastro e concordo com as regras estabelecidas pela SUPERAÇÃO ASSESSORIA ESPORTIVA.</p>
                    <div class="footer">
                        <p>Aceite digital registrado em: ${acceptedAt ? new Date(acceptedAt).toLocaleString() : "N/A"}</p>
                        <p>Aluno: ${studentName}</p>
                        <p>CPF: ${cpf || "N/A"}</p>
                        <p>Documento gerado administrativamente</p>
                    </div>
                    <script>
                        window.onload = function() { window.print(); window.close(); }
                    </script>
                </body>
            </html>
        `);
      printWindow.document.close();
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const handleAutoFillValue = () => {
    if (!selectedSubscription) return;

    // Normalize string: remove accents, lowercase
    const normalize = (s: string) =>
      s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    const subPlanName = normalize(editPlanName);

    // Try to find the plan
    const foundPlan = plans.find((p) => {
      const pName = normalize(p.nome);
      return subPlanName.includes(pName) || pName.includes(subPlanName);
    });

    if (foundPlan) {
      setEditAmount(foundPlan.preco.toString());
      toast.success(`Valor do plano ${foundPlan.nome} aplicado!`);
    } else {
      toast.error("Plano correspondente não encontrado automaticamente.");
    }
  };

  const handleSendWhatsApp = async () => {
    if (!selectedSubscription || !selectedSubscription.student_phone) {
      toast.error("Telefone não disponível para cobrança.");
      return;
    }

    setIsSendingWhatsApp(true);
    try {
      // Buscar a fatura pendente mais recente para pegar o link de pagamento
      const { data: invoice } = await supabase
        .from("subscription_invoices")
        .select("payment_link")
        .eq("subscription_id", selectedSubscription.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const phone = selectedSubscription.student_phone.replace(/\D/g, "");
      const formattedPhone = phone.length <= 11 ? `55${phone}` : phone;
      const firstName = selectedSubscription.student_name
        ? selectedSubscription.student_name.split(" ")[0]
        : "Corredor";

      const paymentLink =
        invoice?.payment_link || "https://superacaoassessoria.com/minha-assinatura";

      const message = `Olá ${firstName}, tudo bem? 🏃‍♂️\n\nPassando para te lembrar que a sua mensalidade da assessoria está pendente.\n\nPara facilitar, você pode realizar o pagamento direto pelo link abaixo (PIX ou Cartão):\n\n🔗 ${paymentLink}\n\nQualquer dúvida, estamos à disposição! 🚀`;

      const { error } = await supabase.functions.invoke("send-whatsapp-message", {
        body: { phone: formattedPhone, message },
      });

      if (error) throw error;
      toast.success("Mensagem de cobrança enviada via WhatsApp!");

      await createSystemLog({
        action: "send_manual_whatsapp",
        category: "payment",
        level: "info",
        message: `Cobrança manual via WhatsApp enviada para ${selectedSubscription.student_name}.`,
        details: { subscriptionId: selectedSubscription.id },
      });
    } catch (err) {
      logger.error("Erro ao enviar WhatsApp:", err);
      toast.error("Erro ao enviar mensagem via WhatsApp. Verifique a conexão com o bot.");
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  const handleSendEmail = async () => {
    if (!selectedSubscription) return;
    setIsSendingEmail(true);
    try {
      const { error } = await supabase.functions.invoke("send-subscription-email", {
        body: { subscriptionId: selectedSubscription.id },
      });

      if (error) throw error;
      toast.success("Email de cobrança enviado com sucesso!");
    } catch (err) {
      logger.error("Erro ao enviar email:", err);
      toast.error("Erro ao enviar email de cobrança.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleExport = (dataToExport: RecurringSubscription[], fileNamePrefix: string) => {
    const safe = (str: string | null | undefined) => {
      if (!str) return '""';
      return `"${String(str).replace(/"/g, '""')}"`;
    };

    const headers = [
      "Nome",
      "Email",
      "Telefone",
      "Plano",
      "Valor",
      "Status",
      "Próxima Cobrança",
      "Criado em",
    ];

    const csvContent = [
      headers.join(","),
      ...dataToExport.map((sub) =>
        [
          safe(sub.student_name),
          safe(sub.student_email),
          safe(sub.student_phone),
          safe(sub.plan_name),
          safe((sub.amount || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })),
          safe(STATUS_CONFIG[sub.status]?.label || sub.status),
          safe(
            sub.next_billing_date
              ? new Date(sub.next_billing_date).toLocaleDateString("pt-BR")
              : "-"
          ),
          safe(new Date(sub.created_at).toLocaleDateString("pt-BR")),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${fileNamePrefix}_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = (dataToExport: RecurringSubscription[], title: string) => {
    const printWindow = window.open("", "", "width=1000,height=800");
    if (printWindow) {
      const rows = dataToExport.map((sub) => {
        return `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: 500;">
              ${sub.student_name}
              <div style="font-size: 11px; color: #666; font-weight: normal; margin-top: 2px;">
                ${sub.student_email}
              </div>
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">
              ${sub.student_phone || '-'}
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">
              ${sub.plan_name}
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">
              ${(sub.amount || 0).toLocaleString("pt-BR", { style: 'currency', currency: 'BRL' })}
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">
              ${STATUS_CONFIG[sub.status]?.label || sub.status}
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; font-size: 11px;">
               ${sub.next_billing_date ? new Date(sub.next_billing_date).toLocaleDateString("pt-BR") : "-"}
            </td>
          </tr>
        `;
      }).join('');

      printWindow.document.write(`
        <html>
          <head>
            <title>Relatório - ${title}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 30px; }
              h1 { font-size: 24px; margin-bottom: 10px; color: #111; }
              p { margin-bottom: 25px; color: #666; font-size: 14px; }
              table { width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; }
              th { padding: 12px 10px; background-color: #f1f5f9; border-bottom: 2px solid #e2e8f0; color: #334155; font-weight: 600; }
              tr:nth-child(even) { background-color: #f8fafc; }
              @media print {
                @page { margin: 15mm; size: auto; }
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            <h1>Relatório de Assinaturas</h1>
            <p><strong>Público:</strong> ${title} | <strong>Total:</strong> ${dataToExport.length} registros encontradas</p>
            <table>
              <thead>
                <tr>
                  <th>Aluno / Email</th>
                  <th>Telefone</th>
                  <th>Plano</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Próxima Cobr.</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
            <script>
              window.onload = function() { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.student_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.plan_name.toLowerCase().includes(searchTerm.toLowerCase());

    const isInactive = sub.status === "canceled" || sub.status === "blocked";
    let matchesTab = true;
    if (tabFilter === "active") matchesTab = !isInactive;
    else if (tabFilter === "inactive") matchesTab = isInactive;

    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
    const matchesPlan = planFilter === "all" || sub.plan_name === planFilter;

    return matchesSearch && matchesStatus && matchesTab && matchesPlan;
  });

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || {
      label: status,
      variant: "outline",
      icon: AlertCircle,
    };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={`gap-1 ${config.className || ""}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getPlanBadgeColor = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes("mensal")) return "bg-blue-600 hover:bg-blue-700 text-white border-none";
    if (name.includes("trimestral"))
      return "bg-purple-600 hover:bg-purple-700 text-white border-none";
    if (name.includes("semestral"))
      return "bg-orange-500 hover:bg-orange-600 text-white border-none";
    if (name.includes("anual")) return "bg-rose-600 hover:bg-rose-700 text-white border-none";
    if (name.includes("parceria")) return "bg-pink-500 hover:bg-pink-600 text-white border-none";
    if (name.includes("teste")) return "bg-emerald-500 hover:bg-emerald-600 text-white border-none";
    if (name.includes("recuperado")) return "bg-cyan-500 hover:bg-cyan-600 text-white border-none";
    return "bg-slate-600 text-white border-none";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Gerenciar Assinaturas</h2>

        <div className="flex items-center space-x-3 bg-muted/40 px-4 py-2.5 rounded-xl border border-border/50 shadow-inner">
          <div
            className={cn(
              "p-1.5 rounded-lg transition-colors border shadow-sm",
              (billingConfig as any)?.auto_billing_enabled
                ? "bg-green-500/10 text-green-500 border-green-500/20"
                : "bg-muted text-muted-foreground border-border/50"
            )}
          >
            <Clock className="w-4 h-4" />
          </div>
          <div className="flex flex-col pr-2">
            <Label htmlFor="auto-billing-sub" className="text-sm font-bold cursor-pointer">
              Cobrança Automática
            </Label>
            <span className="text-[10px] text-muted-foreground leading-tight">
              Envio no 5º e 10º dia útil às 12:30
            </span>
          </div>
          <Switch
            id="auto-billing-sub"
            checked={(billingConfig as any)?.auto_billing_enabled !== false}
            onCheckedChange={(checked) => updateBillingToggle.mutate(checked)}
            disabled={loadingConfig}
          />
        </div>
      </div>

      {/* Gráfico de Pizza dos Planos */}
      <PlansPieChart />

      <Tabs value={tabFilter} onValueChange={setTabFilter} className="w-full">
        <TabsList className="grid grid-cols-3 w-full sm:w-[500px] h-11 p-1">
          <TabsTrigger value="active" className="font-semibold text-sm">Ativos</TabsTrigger>
          <TabsTrigger value="inactive" className="font-semibold text-sm">Inativos</TabsTrigger>
          <TabsTrigger value="all" className="font-semibold text-sm">Todos</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por nome, email ou plano..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="past_due">Pendente</SelectItem>
            <SelectItem value="blocked">Bloqueado</SelectItem>
            <SelectItem value="canceled">Cancelado</SelectItem>
            <SelectItem value="waiting_details">Aguardando Valor</SelectItem>
            <SelectItem value="partnership">Parceria</SelectItem>
          </SelectContent>
        </Select>

        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrar por plano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Planos</SelectItem>
            <SelectItem value="Plano Mensal">Plano Mensal</SelectItem>
            <SelectItem value="Plano Trimestral">Plano Trimestral</SelectItem>
            <SelectItem value="Plano Semestral">Plano Semestral</SelectItem>
            <SelectItem value="Plano Anual">Plano Anual</SelectItem>
            <SelectItem value="Plano Teste">Plano Teste</SelectItem>
            <SelectItem value="Parceria">Parceria</SelectItem>
            <SelectItem value="Isento">Isento</SelectItem>
            <SelectItem value="Total Pass">Total Pass</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={fetchSubscriptions} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>

        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <Button
            variant="outline"
            className="whitespace-nowrap flex-1 sm:flex-none border-green-200 text-green-700 hover:bg-green-50"
            onClick={() => handleExport(filteredSubscriptions, `assinaturas_tela`)}
            disabled={loading || filteredSubscriptions.length === 0}
            title="Excel dos dados na tela atual"
          >
            <Download className="w-4 h-4 mr-2" />
            Excel
          </Button>

          <Button
            variant="outline"
            className="whitespace-nowrap flex-1 sm:flex-none border-blue-200 text-blue-700 hover:bg-blue-50"
            onClick={() => handleExportPDF(filteredSubscriptions, `Filtrado em Tela`)}
            disabled={loading || filteredSubscriptions.length === 0}
            title="Imprimir PDF dos dados na tela atual"
          >
            <Printer className="w-4 h-4 mr-2" />
            PDF
          </Button>

          <Button
            variant="default"
            className="whitespace-nowrap flex-1 sm:flex-none ml-0 sm:ml-2"
            onClick={() => handleExport(subscriptions, `assinaturas_todas`)}
            disabled={loading || subscriptions.length === 0}
            title="Exportar base completa para Excel"
          >
            <Download className="w-4 h-4 mr-2" />
            Excel Completo
          </Button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredSubscriptions.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-2xl border border-border">
          <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {subscriptions.length === 0
              ? "Nenhuma assinatura encontrada"
              : "Nenhum resultado para a busca"}
          </h3>
          <p className="text-muted-foreground">
            {subscriptions.length === 0
              ? "Crie links de pagamento para começar a ver as assinaturas aqui"
              : "Tente ajustar os filtros de busca"}
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[1000px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="text-center">Cobrança Auto.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Próx. Cobrança</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <button
                            className="font-medium hover:underline text-left"
                            onClick={() => setSelectedSubscription(subscription)}
                          >
                            {formatName(subscription.student_name)}
                          </button>
                          <div className="flex flex-col text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {subscription.student_email}
                            </div>
                            {subscription.student_phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {subscription.student_phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Modal Detalhes */}
                    <Dialog
                      open={!!selectedSubscription}
                      onOpenChange={() => setSelectedSubscription(null)}
                    >
                      <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
                        <DialogHeader>
                          <DialogTitle>Detalhes da Assinatura</DialogTitle>
                        </DialogHeader>
                        {selectedSubscription && (
                          <div className="space-y-6 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <b>Aluno:</b> {selectedSubscription.student_name}
                              </div>
                              <div>
                                <b>Email:</b> {selectedSubscription.student_email}
                              </div>
                              <div>
                                <b>Telefone:</b> {selectedSubscription.student_phone || "-"}
                              </div>
                              <div>
                                <b>Plano:</b> {selectedSubscription.plan_name}
                              </div>
                              <div>
                                <b>Valor:</b> {formatCurrency(selectedSubscription.amount)}
                              </div>
                              <div>
                                <b>Status:</b> {getStatusBadge(selectedSubscription.status)}
                              </div>
                              <div>
                                <b>Próx. Cobrança:</b>{" "}
                                {formatDate(selectedSubscription.next_billing_date)}
                              </div>
                              <div>
                                <b>Último Pagamento:</b>{" "}
                                {formatDate(selectedSubscription.last_payment_at || null)}
                              </div>
                              <div>
                                <b>Criado em:</b> {formatDateTime(selectedSubscription.created_at)}
                              </div>
                              <div>
                                <b>ID:</b>{" "}
                                <span className="font-mono text-xs">{selectedSubscription.id}</span>
                              </div>
                            </div>

                            {/* Terms Section */}
                            <div className="bg-muted p-3 rounded-md border border-border">
                              <div className="flex items-center justify-between mb-2">
                                <p className="font-semibold flex items-center gap-2">
                                  <FileText className="w-4 h-4" />
                                  Termo de Adesão
                                </p>
                                <Badge
                                  variant={
                                    selectedSubscription.terms_accepted_at ? "default" : "secondary"
                                  }
                                >
                                  {selectedSubscription.terms_accepted_at ? "Aceito" : "Pendente"}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mb-3">
                                {selectedSubscription.terms_accepted_at
                                  ? `Aceito em: ${formatDateTime(selectedSubscription.terms_accepted_at)}`
                                  : "O aluno ainda não aceitou o termo digitalmente."}
                              </p>
                              {selectedSubscription.terms_accepted_at && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  onClick={() =>
                                    handlePrintTerms(
                                      selectedSubscription.student_name,
                                      selectedSubscription.cpf,
                                      selectedSubscription.terms_accepted_at
                                    )
                                  }
                                >
                                  <Printer className="w-4 h-4 mr-2" />
                                  Imprimir Termo
                                </Button>
                              )}
                            </div>

                            <div className="bg-muted p-3 rounded-md border border-border">
                              <p className="font-semibold mb-2">Ações Rápidas</p>

                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full mb-2 justify-start border-emerald-200 hover:bg-emerald-50 text-emerald-700 font-medium"
                                onClick={handleSendWhatsApp}
                                disabled={isSendingWhatsApp}
                              >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                {isSendingWhatsApp ? "Enviando..." : "Cobrar via WhatsApp"}
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full mb-2 justify-start"
                                onClick={handleSendEmail}
                                disabled={isSendingEmail}
                              >
                                <Send className="w-4 h-4 mr-2" />
                                {isSendingEmail ? "Enviando..." : "Enviar Email de Cobrança"}
                              </Button>

                              <p className="text-xs text-muted-foreground mt-2">
                                O cancelamento deve ser feito manualmente no momento.
                              </p>
                            </div>

                            <div className="border-t border-border pt-4 space-y-4">
                              <h4 className="font-medium">
                                {selectedSubscription.status === "waiting_details"
                                  ? "Definir Dados e Ativar"
                                  : "Editar Assinatura"}
                              </h4>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <Label htmlFor="editName">Nome do Aluno</Label>
                                  <Input
                                    id="editName"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Nome completo"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label htmlFor="editPhone">Telefone de Cobrança</Label>
                                  <Input
                                    id="editPhone"
                                    value={editPhone}
                                    onChange={(e) => setEditPhone(e.target.value)}
                                    placeholder="Ex: 55139977..."
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label htmlFor="editStatus">Status da Assinatura</Label>
                                  <Select value={editStatus} onValueChange={setEditStatus}>
                                    <SelectTrigger id="editStatus">
                                      <SelectValue placeholder="Selecione o status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="active">Ativo</SelectItem>
                                      <SelectItem value="past_due">Pendente</SelectItem>
                                      <SelectItem value="blocked">Bloqueado</SelectItem>
                                      <SelectItem value="canceled">Cancelado</SelectItem>
                                      <SelectItem value="waiting_details">
                                        Aguardando Valor
                                      </SelectItem>
                                      <SelectItem value="partnership">Parceria</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label htmlFor="editPlan">Plano</Label>
                                  <Select value={editPlanName} onValueChange={setEditPlanName}>
                                    <SelectTrigger id="editPlan">
                                      <SelectValue placeholder="Selecione o plano" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {editPlanName && editPlanName.trim() !== "" && (
                                        <SelectItem value={editPlanName}>{editPlanName}</SelectItem>
                                      )}
                                      {[
                                        "Plano Mensal",
                                        "Plano Trimestral",
                                        "Plano Semestral",
                                        "Plano Anual",
                                        "Plano Teste",
                                        "Parceria",
                                        "Isento",
                                        "Total Pass"
                                      ]
                                        .filter((p) => p !== editPlanName)
                                        .map((plan) => (
                                          <SelectItem key={plan} value={plan}>
                                            {plan}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label htmlFor="billingDate">Próxima Cobrança (Opcional)</Label>
                                  <Input
                                    id="billingDate"
                                    type="date"
                                    value={editNextBillingDate}
                                    onChange={(e) => setEditNextBillingDate(e.target.value)}
                                    className="w-full"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label htmlFor="lastPayment">Último Pagamento (Opcional)</Label>
                                  <Input
                                    id="lastPayment"
                                    type="date"
                                    value={editLastPaymentDate}
                                    onChange={(e) => setEditLastPaymentDate(e.target.value)}
                                    className="w-full"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label htmlFor="editSquad">Squad (Grupo)</Label>
                                  <Select
                                    value={editSquadId || "none"}
                                    onValueChange={setEditSquadId}
                                  >
                                    <SelectTrigger id="editSquad">
                                      <SelectValue placeholder="Selecione o Squad" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">Sem Squad</SelectItem>
                                      {squads.map((squad) => (
                                        <SelectItem key={squad.id} value={squad.id}>
                                          {squad.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div className="flex items-end gap-3 pt-2">
                                <div className="space-y-1 flex-1">
                                  <Label htmlFor="amount">Valor da Assinatura (R$)</Label>
                                  <div className="flex gap-2">
                                    <Input
                                      id="amount"
                                      value={editAmount}
                                      onChange={(e) => setEditAmount(e.target.value)}
                                      type="number"
                                      step="0.01"
                                      placeholder="0.00"
                                    />
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={handleAutoFillValue}
                                      title="Definir automaticamente pelo plano"
                                      type="button"
                                    >
                                      <Wand2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                                <Button
                                  onClick={handleAcceptValue}
                                  disabled={isUpdating}
                                  className="bg-green-600 hover:bg-green-700 text-white mb-0.5"
                                >
                                  {isUpdating
                                    ? "Salvando..."
                                    : selectedSubscription.status === "waiting_details"
                                      ? "Aceitar Valor"
                                      : "Salvar Alteração"}
                                </Button>
                              </div>

                              {selectedSubscription.status === "waiting_details" && (
                                <>
                                  <div className="mt-2 text-center text-xs text-muted-foreground">
                                    <span>ou</span>
                                  </div>

                                  <Button
                                    variant="outline"
                                    className="w-full mt-2 border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800"
                                    onClick={handleSetPartnership}
                                    disabled={isUpdating}
                                  >
                                    <Handshake className="w-4 h-4 mr-2" />
                                    Ativar como Parceria (Isento)
                                  </Button>
                                </>
                              )}

                              <p className="text-[10px] text-muted-foreground mt-[-8px]">
                                Se o aluno já pagou antecipado, ajuste a data de cobrança acima para
                                o vencimento futuro.
                              </p>

                              {selectedSubscription.status === "waiting_details" && (
                                <div className="flex items-center space-x-2 mt-4">
                                  <Checkbox
                                    id="sendEmail"
                                    checked={sendEmailOnActivation}
                                    onCheckedChange={(c) => setSendEmailOnActivation(!!c)}
                                  />
                                  <Label
                                    htmlFor="sendEmail"
                                    className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    Enviar email de cobrança automaticamente ao ativar
                                  </Label>
                                </div>
                              )}

                              {selectedSubscription.status === "waiting_details" && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Ao clicar em Aceitar Valor, o status da assinatura mudará para{" "}
                                  <strong>Ativo</strong> e o valor será atualizado.
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        <DialogFooter className="mt-4 pt-4 border-t">
                          <DialogClose asChild>
                            <Button variant="outline" className="w-full sm:w-auto">
                              Fechar
                            </Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <TableCell>
                      <Badge
                        className={cn(
                          "whitespace-nowrap shadow-sm font-bold",
                          getPlanBadgeColor(subscription.plan_name)
                        )}
                      >
                        {subscription.plan_name}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(subscription.amount)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Switch
                          checked={subscription.auto_billing_enabled !== false}
                          onCheckedChange={(checked) =>
                            updateSubscription(subscription.id, { auto_billing_enabled: checked })
                          }
                          className="data-[state=checked]:bg-green-600"
                        />
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {formatDate(subscription.next_billing_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(subscription.created_at)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {subscription.status === "active" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 h-8"
                          onClick={() =>
                            updateSubscription(subscription.id, { status: "canceled" })
                          }
                          title="Pausar cobranças (Mantém acesso)"
                        >
                          <Ban className="w-3.5 h-3.5 mr-1" />
                          Pausar
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-emerald-600 hover:text-emerald-600 hover:bg-emerald-50 h-8"
                          onClick={() => updateSubscription(subscription.id, { status: "active" })}
                          title="Ativar Aluno"
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          Ativar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Results count */}
      {filteredSubscriptions.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Mostrando {filteredSubscriptions.length} de {subscriptions.length} assinatura
          {subscriptions.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
