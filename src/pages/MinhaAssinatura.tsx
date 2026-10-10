import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { useSubscription } from "@/hooks/useSubscription";

const MinhaAssinatura = () => {
  const { user, loading: authLoading } = useAuth();
  const { subscription, loading, refetch } = useSubscription();

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-600">Ativa</Badge>;
      case "past_due":
        return <Badge variant="destructive">Pagamento pendente</Badge>;
      case "canceled":
        return <Badge variant="secondary">Cancelada</Badge>;
      case "blocked":
        return <Badge variant="destructive">Bloqueada</Badge>;
      case "waiting_details":
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600 border-none text-white font-bold">
            Aguardando Pagamento
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status || "Desconhecido"}</Badge>;
    }
  };

  return (
    <Layout>
      <section className="py-16 bg-muted min-h-[60vh]">
        <div className="container max-w-2xl">
          <h1 className="text-3xl font-black mb-8">MINHA ASSINATURA</h1>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : subscription ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Plano {subscription.plan_name}</CardTitle>
                    <CardDescription>
                      {subscription.status === "active"
                        ? "Sua assinatura está ativa e regular."
                        : subscription.status === "past_due"
                          ? "Há um pagamento pendente. Regularize para evitar bloqueio."
                          : "Status da assinatura."}
                    </CardDescription>
                  </div>
                  {getStatusBadge(subscription.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2
                      className={`w-5 h-5 ${subscription.status === "active" ? "text-green-600" : "text-gray-400"}`}
                    />
                    <div>
                      <p className="font-medium">
                        {subscription.status === "active" ? "Acesso liberado" : "Acesso restrito"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {subscription.status === "active"
                          ? `Você tem acesso a todos os benefícios do plano ${subscription.plan_name}`
                          : "Regularize sua assinatura para retomar o acesso."}
                      </p>
                    </div>
                  </div>

                  {subscription.next_billing_date && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Próxima renovação</p>
                        <p className="text-sm text-muted-foreground">
                          {format(
                            new Date(subscription.next_billing_date),
                            "dd 'de' MMMM 'de' yyyy",
                            { locale: ptBR }
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {subscription.status === "past_due" && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex flex-col items-start gap-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-destructive">Pagamento Pendente</p>
                        <p className="text-sm text-muted-foreground">
                          Identificamos uma fatura em aberto. Regularize para evitar o bloqueio do
                          seu acesso.
                        </p>
                      </div>
                    </div>

                    {subscription.invoice_link ? (
                      <Button
                        asChild
                        className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold"
                      >
                        <a
                          href={subscription.invoice_link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Pagar Fatura Agora
                        </a>
                      </Button>
                    ) : (
                      <Button
                        asChild
                        className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold gap-2"
                      >
                        <Link
                          to={`/pagamento-aluno?planId=${subscription.plan_name === "Trimestral" ? "trimestral" : subscription.plan_name === "Semestral" ? "semestral" : subscription.plan_name === "Anual" ? "anual" : "mensal"}&amount=${subscription.amount || 149.97}&description=Regularização Plano ${subscription.plan_name}`}
                        >
                          Realizar Pagamento (Cartão ou PIX)
                        </Link>
                      </Button>
                    )}
                  </div>
                )}

                {subscription.status === "waiting_details" && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 flex flex-col items-start gap-4 shadow-sm animate-in fade-in duration-500">
                    <div className="flex items-start gap-3">
                      <div className="bg-amber-500/20 p-2 rounded-full mt-0.5">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-bold text-amber-700 text-base">Pagamento Pendente</p>
                        <p className="text-sm text-amber-900/80 mt-1 leading-relaxed">
                          Sua assinatura foi processada, mas o pagamento ainda não foi concluído.
                          Finalize agora para liberar o acesso ao Clube!
                        </p>
                      </div>
                    </div>

                    <Button
                      asChild
                      className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-bold text-base shadow-[0_8px_20px_-8px_rgba(245,158,11,0.5)] transition-all gap-2"
                    >
                      <Link
                        to={`/pagamento-aluno?planId=${subscription.plan_name === "Trimestral" ? "trimestral" : subscription.plan_name === "Semestral" ? "semestral" : subscription.plan_name === "Anual" ? "anual" : "mensal"}&amount=${subscription.amount || 149.97}&description=Ativação Plano ${subscription.plan_name}`}
                      >
                        Finalizar Pagamento (PIX ou Cartão)
                      </Link>
                    </Button>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Para cancelar ou alterar o plano, entre em contato com o suporte.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Nenhuma assinatura ativa</CardTitle>
                <CardDescription>
                  Você ainda não possui uma assinatura de assessoria.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-6 text-center">
                  <p className="text-muted-foreground mb-4">
                    Conheça nossos planos de assessoria e comece sua evolução hoje.
                  </p>
                  <Button asChild>
                    <Link to="/assessoria">Ver Planos</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default MinhaAssinatura;
