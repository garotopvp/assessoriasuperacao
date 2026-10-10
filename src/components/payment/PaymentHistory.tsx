import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Transaction {
  id: string;
  created_at: string;
  total: number;
  status: string;
  stripe_payment_intent: string;
  customer_email: string;
}

export function PaymentHistory() {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["payment-history", page],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não autenticado");

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from("orders")
        .select("*", { count: "exact" })
        .eq("user_id", user.user.id)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        transactions: data || [],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      paid: { label: "Pago", className: "bg-green-100 text-green-800" },
      pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-800" },
      failed: { label: "Falhou", className: "bg-red-100 text-red-800" },
      refunded: { label: "Reembolsado", className: "bg-gray-100 text-gray-800" },
    };

    const { label, className } = statusMap[status] || { label: status, className: "bg-gray-100" };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}>{label}</span>
    );
  };

  const getPaymentMethodLabel = (paymentIntent: string | null) => {
    if (!paymentIntent) return "N/A";
    if (paymentIntent.startsWith("pi_")) return "Cartão de Crédito";
    return "PIX";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-3/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Histórico de Pagamentos
        </CardTitle>
        <CardDescription>Visualize todas as suas transações e baixe comprovantes</CardDescription>
      </CardHeader>
      <CardContent>
        {transactions?.transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Você ainda não tem transações registradas.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {transactions?.transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Pedido #{transaction.id.slice(0, 8)}</span>
                      {getStatusBadge(transaction.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(transaction.created_at), "dd 'de' MMMM 'de' yyyy", {
                          locale: ptBR,
                        })}
                      </span>
                      <span>{getPaymentMethodLabel(transaction.stripe_payment_intent)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-semibold">
                      {formatCurrency(transaction.total, false)}
                    </span>
                    {transaction.status === "paid" && (
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Nota Fiscal
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {transactions && transactions.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {page} de {transactions.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(transactions.totalPages, p + 1))}
                  disabled={page === transactions.totalPages}
                >
                  Próxima
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
