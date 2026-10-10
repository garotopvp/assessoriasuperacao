import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  MessageSquare,
  AlertTriangle,
  Search,
  UserX,
  AlertCircle,
  Phone,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ChurnGuard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
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
      const newValue = { ...billingConfig, auto_billing_enabled: enabled };
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

  const { data: failedSubscriptions, isLoading } = useQuery({
    queryKey: ["failed_subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recurring_subscriptions")
        .select(
          `
          id,
          status,
          amount,
          next_billing_date,
          student_name,
          student_email,
          student_phone
        `
        )
        .in("status", ["past_due", "unpaid", "canceled"])
        .order("next_billing_date", { ascending: false });

      if (error) {
        console.error("Error fetching failed subscriptions:", error);
        throw error;
      }
      return data || [];
    },
  });

  const handleSendReminder = async (
    phone: string | null,
    name: string | null,
    id: string = "test"
  ) => {
    if (!phone) {
      toast.error("Usuário sem telefone cadastrado");
      return;
    }

    setSendingReminder(id);
    try {
      const cleanPhone = phone.replace(/\D/g, "");
      const formattedPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
      const firstName = name && name !== "Aluno Teste" ? name.split(" ")[0] : "Corredor";
      const text = `Olá ${firstName}, tudo bem? Passando aqui para te lembrar do pagamento da mensalidade da assessoria.\n\nVocê pode realizar o pagamento no cartão de crédito (com opção de assinar recorrente ou pagar avulso todo mês) e também via PIX, acessando o link abaixo:\n\n🔗 https://superacaoassessoria.com/pagamento-aluno\n\nQualquer dúvida, estou à disposição! 跑‍💨`;

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error("Não autenticado");

      const { data, error } = await supabase.functions.invoke("send-whatsapp-message", {
        body: { phone: formattedPhone, message: text },
      });

      if (error) throw error;
      toast.success("Mensagem enviada com sucesso pelo robô Z-API!");
    } catch (error) {
      console.error("Erro ao enviar WhatsApp pelo robô:", error);
      toast.error("Erro no robô, abrindo WhatsApp Web...");

      const cleanPhone = phone.replace(/\D/g, "");
      const firstName = name && name !== "Aluno Teste" ? name.split(" ")[0] : "Corredor";
      const text = `Olá ${firstName}, tudo bem? Passando aqui para te lembrar do pagamento da mensalidade da assessoria.\n\nVocê pode realizar o pagamento no cartão de crédito (com opção de assinar recorrente ou pagar avulso todo mês) e também via PIX, acessando o link abaixo:\n\n🔗 https://superacaoassessoria.com/pagamento-aluno\n\nQualquer dúvida, estou à disposição! 🏃‍♂️💨`;
      const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(text)}`;
      window.open(url, "_blank");
    } finally {
      setSendingReminder(null);
    }
  };

  const filtered = failedSubscriptions?.filter((sub) => {
    const term = searchTerm.toLowerCase();
    return (
      sub?.student_name?.toLowerCase().includes(term) ||
      sub?.student_email?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in zoom-in-95 duration-500">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40 pb-6">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2.5 text-foreground tracking-tight">
            <div className="bg-destructive/10 p-2 rounded-xl border border-destructive/20 shadow-sm">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            Recuperação de Caixa (Churn Guard)
          </h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-lg">
            Monitoramento de alunos inativos, com problemas no cartão de crédito ou atraso no
            pagamento via PIX.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3 bg-muted/40 px-4 py-2.5 rounded-xl border border-border/50 shadow-inner">
            <div
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                billingConfig?.auto_billing_enabled
                  ? "bg-green-500/20 text-green-500"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Clock className="w-4 h-4" />
            </div>
            <div className="flex flex-col pr-2">
              <Label htmlFor="auto-billing" className="text-sm font-bold cursor-pointer">
                Cobrança Automática
              </Label>
              <span className="text-[10px] text-muted-foreground leading-tight">
                Envio no 5º e 10º dia útil às 12:30
              </span>
            </div>
            <Switch
              id="auto-billing"
              checked={billingConfig?.auto_billing_enabled !== false}
              onCheckedChange={(checked) => updateBillingToggle.mutate(checked)}
              disabled={loadingConfig}
            />
          </div>

          <Button
            variant="outline"
            className="gap-2 bg-primary/5 hover:bg-primary/10 text-primary border-primary/20 transition-all font-semibold"
            onClick={() => handleSendReminder("35998629449", "Aluno Teste")}
            disabled={sendingReminder === "test"}
          >
            <MessageSquare className="w-4 h-4" />
            {sendingReminder === "test" ? "Enviando..." : "Testar Robô (35 99862-9449)"}
          </Button>
        </div>
      </div>

      {/* Barra de Busca Premium */}
      <div className="relative group max-w-xl">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        </div>
        <Input
          placeholder="Buscar por nome ou e-mail do aluno..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-12 rounded-xl border-border/50 bg-background/50 backdrop-blur-sm shadow-sm focus-visible:ring-primary/20 transition-all font-medium text-sm"
        />
      </div>

      {/* Tabela de Dados */}
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-muted/30 border-b border-border/50 text-xs uppercase text-muted-foreground tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Aluno</th>
                <th className="px-6 py-4">Status & Contato</th>
                <th className="px-6 py-4">Valor da Fatura</th>
                <th className="px-6 py-4 text-right">Ação Rápida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {isLoading ? (
                // Skeleton Moderno
                Array(4)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={`skeleton-${i}`}>
                      <td className="px-6 py-4">
                        <div className="h-5 bg-muted/50 rounded-md w-3/4 animate-pulse mb-2" />
                        <div className="h-3 bg-muted/30 rounded-md w-1/2 animate-pulse" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-5 bg-muted/50 rounded-md w-3/4 animate-pulse mb-2" />
                        <div className="h-3 bg-muted/30 rounded-md w-1/2 animate-pulse" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-5 bg-muted/50 rounded-md w-32 animate-pulse" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="h-9 bg-muted/50 rounded-lg w-32 inline-block animate-pulse" />
                      </td>
                    </tr>
                  ))
              ) : filtered?.length === 0 ? (
                // Empty State Premium
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="bg-primary/10 p-4 rounded-full border border-primary/20">
                        <UserX className="w-8 h-8 text-primary" />
                      </div>
                      <div className="max-w-xs mx-auto">
                        <p className="text-foreground font-bold text-lg">
                          Nenhum aluno inadimplente
                        </p>
                        <p className="text-muted-foreground text-sm mt-1">
                          Você não tem nenhuma ação pendente no momento. Suas finanças estão em dia!
                          🎉
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered?.map((sub: any) => (
                  <tr
                    key={sub.id}
                    className="group hover:bg-muted/20 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 relative">
                      {/* Indicador sutil lateral ao passar o mouse */}
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-transparent group-hover:bg-primary transition-colors" />

                      <div className="font-semibold text-foreground tracking-tight">
                        {sub.student_name || "Aluno sem Nome"}
                      </div>
                      <div className="text-xs text-muted-foreground font-medium mt-0.5">
                        {sub.student_email}
                      </div>
                    </td>

                    <td className="px-6 py-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                            sub.status === "past_due"
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                              : sub.status === "canceled"
                                ? "bg-destructive/10 text-destructive border-destructive/20"
                                : "bg-muted text-muted-foreground border-border"
                          )}
                        >
                          <span className="flex items-center gap-1">
                            {sub.status === "past_due" && <AlertCircle className="w-3 h-3" />}
                            {sub.status === "past_due"
                              ? "Fatura em Atraso"
                              : sub.status === "canceled"
                                ? "Assinatura Cancelada"
                                : sub.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        <Phone className="w-3 h-3" />
                        {sub.student_phone || "Não informado"}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(sub.amount)}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 bg-[#25D366]/5 hover:bg-[#25D366]/10 text-foreground border-[#25D366]/30 hover:border-[#25D366]/50 shadow-sm transition-all"
                        onClick={() => handleSendReminder(sub.student_phone, sub.student_name)}
                      >
                        <MessageSquare className="w-4 h-4 text-[#25D366]" />
                        <span className="font-semibold">Cobrar via ZAP</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
