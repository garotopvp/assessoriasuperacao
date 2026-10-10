import { useEffect } from "react";
import { AdminMetrics } from "@/components/admin/AdminMetrics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Users, ShoppingBag, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Dashboard Admin - Superação Assessoria";
  }, []);

  const quickActions = [
    {
      title: "Gerenciar Usuários",
      description: "Visualizar e gerenciar usuários cadastrados",
      icon: Users,
      path: "/admin?tab=contas",
      color: "text-blue-600",
    },
    {
      title: "Gerenciar Produtos",
      description: "Adicionar, editar e remover produtos",
      icon: Package,
      path: "/admin?tab=produtos",
      color: "text-green-600",
    },
    {
      title: "Pedidos",
      description: "Visualizar e processar pedidos",
      icon: ShoppingBag,
      path: "/admin?tab=pedidos",
      color: "text-purple-600",
    },
    {
      title: "Relatórios",
      description: "Ver métricas e relatórios",
      icon: FileText,
      path: "/admin?tab=assinaturas", // Assinaturas tem gráficos
      color: "text-orange-600",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard Administrativo</h1>
        <p className="text-muted-foreground">Bem-vindo ao painel de controle do Superação Assessoria</p>
      </div>

      {/* Métricas */}
      <AdminMetrics />

      {/* Ações Rápidas */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Ações Rápidas</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Card
              key={action.path}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(action.path)}
            >
              <CardHeader>
                <action.icon className={`h-8 w-8 ${action.color} mb-2`} />
                <CardTitle className="text-lg">{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Acessar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Atividades Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
          <CardDescription>Últimas ações realizadas no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4 pb-4 border-b last:border-0">
              <div className="h-2 w-2 bg-green-500 rounded-full mt-2" />
              <div className="flex-1">
                <p className="font-medium">Novo usuário cadastrado</p>
                <p className="text-sm text-muted-foreground">João Silva se cadastrou no sistema</p>
                <p className="text-xs text-muted-foreground mt-1">Há 5 minutos</p>
              </div>
            </div>
            <div className="flex items-start gap-4 pb-4 border-b last:border-0">
              <div className="h-2 w-2 bg-blue-500 rounded-full mt-2" />
              <div className="flex-1">
                <p className="font-medium">Pedido realizado</p>
                <p className="text-sm text-muted-foreground">Pedido #12345 no valor de R$ 189,90</p>
                <p className="text-xs text-muted-foreground mt-1">Há 15 minutos</p>
              </div>
            </div>
            <div className="flex items-start gap-4 pb-4 border-b last:border-0">
              <div className="h-2 w-2 bg-purple-500 rounded-full mt-2" />
              <div className="flex-1">
                <p className="font-medium">Produto atualizado</p>
                <p className="text-sm text-muted-foreground">
                  Camiseta Dry Fit - Estoque atualizado
                </p>
                <p className="text-xs text-muted-foreground mt-1">Há 1 hora</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
