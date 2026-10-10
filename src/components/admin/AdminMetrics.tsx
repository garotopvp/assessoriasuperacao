import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, TrendingUp, ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function AdminMetrics() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["admin-metrics"],
    queryFn: async () => {
      // Total de usuários ativos
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Usuários com assinatura ativa
      const { count: activeSubscribers } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Receita total (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: revenueData } = await supabase
        .from("orders")
        .select("total")
        .eq("status", "paid")
        .gte("created_at", thirtyDaysAgo.toISOString());

      const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

      // Total de pedidos (últimos 30 dias)
      const { count: totalOrders } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo.toISOString());

      // Taxa de conversão (pedidos pagos / total de pedidos)
      const { count: paidOrders } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "paid")
        .gte("created_at", thirtyDaysAgo.toISOString());

      const conversionRate = totalOrders ? ((paidOrders || 0) / totalOrders) * 100 : 0;

      return {
        totalUsers: totalUsers || 0,
        activeSubscribers: activeSubscribers || 0,
        totalRevenue,
        totalOrders: totalOrders || 0,
        conversionRate,
      };
    },
    refetchInterval: 60000, // Atualiza a cada 1 minuto
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-20" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics?.totalUsers}</div>
          <p className="text-xs text-muted-foreground">
            {metrics?.activeSubscribers} assinantes ativos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita (30 dias)</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(metrics?.totalRevenue || 0, false)}
          </div>
          <p className="text-xs text-muted-foreground">{metrics?.totalOrders} pedidos realizados</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics?.conversionRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics?.totalOrders}</div>
          <p className="text-xs text-muted-foreground">Nos últimos 30 dias</p>
        </CardContent>
      </Card>
    </div>
  );
}
