import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { FileText, RefreshCw, Eye } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

export function InvoicesManager() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select(
          `
          *,
          recurring_subscriptions(student_name, student_email)
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Erro ao carregar NFs");
        throw error;
      }
      return data || [];
    },
  });

  const handleRetryEmit = async (id: string) => {
    // In future: this triggers the webhook process for emissão.
    toast.success("Processamento de reenvio simulado por agora.");
  };

  const filtered = invoices?.filter((inv) => {
    const sub = inv.recurring_subscriptions as any;
    const term = searchTerm.toLowerCase();
    return (
      sub?.student_name?.toLowerCase().includes(term) ||
      sub?.student_email?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Emissão de Notas Fiscais
          </h3>
          <p className="text-sm text-muted-foreground">
            Acompanhe o disparo automático de NFs para os clientes (eNotas / Bling).
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-lg border border-border">
        <Input
          placeholder="Buscar NF por nome ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
              <tr>
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Data Cobrança</th>
                <th className="px-6 py-3">Status da NF</th>
                <th className="px-6 py-3">Valor</th>
                <th className="px-6 py-3">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    Carregando notas fiscais...
                  </td>
                </tr>
              ) : filtered?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    Nenhuma nota fiscal encontrada no registro.
                  </td>
                </tr>
              ) : (
                filtered?.map((inv: any) => (
                  <tr key={inv.id} className="border-b border-border hover:bg-muted/50">
                    <td className="px-6 py-4 font-medium">
                      {inv.recurring_subscriptions?.student_name || "Sem Nome"}
                      <div className="text-xs text-muted-foreground font-normal">
                        {inv.recurring_subscriptions?.student_email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {format(new Date(inv.created_at), "dd/MM/yyyy HH:mm")}
                    </td>
                    <td className="px-6 py-4">
                      {inv.status === "emitted" ? (
                        <span className="bg-[#25D366]/10 text-[#25D366] px-2 py-1 rounded-full text-xs font-medium">
                          Emitida com Sucesso
                        </span>
                      ) : inv.status === "pending" ? (
                        <span className="bg-primary/20 text-primary px-2 py-1 rounded-full text-xs font-medium">
                          Pendente Processamento
                        </span>
                      ) : (
                        <span className="bg-destructive/10 text-destructive px-2 py-1 rounded-full text-xs font-medium">
                          Falha na Emissão
                        </span>
                      )}

                      {inv.error_message && (
                        <div
                          className="text-xs text-destructive mt-1 max-w-[200px] truncate"
                          title={inv.error_message}
                        >
                          * Erro prefeitura
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(inv.amount)}
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      {inv.status === "failed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRetryEmit(inv.id)}
                          className="h-8"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Reemitir
                        </Button>
                      )}
                      {inv.status === "emitted" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Download XML/PDF"
                        >
                          <Eye className="w-4 h-4 text-primary" />
                        </Button>
                      )}
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
