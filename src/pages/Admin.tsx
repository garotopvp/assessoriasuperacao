import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { ProductsManager } from "@/components/admin/features/ProductsManager";
import { ArtigosManager } from "@/components/admin/ArtigosManager";
import { HeroImagesManager } from "@/components/admin/HeroImagesManager";
import { SubscriptionsManager } from "@/components/admin/SubscriptionsManager";
import { AdminsManager } from "@/components/admin/AdminsManager";
import { DiscountCoupons } from "@/components/admin/DiscountCoupons";
import { PaymentLinkGenerator } from "@/components/admin/PaymentLinkGenerator";
import { AccountsCentral } from "@/components/admin/AccountsCentral";
import { BulkImportInvite } from "@/components/admin/BulkImportInvite";
import { OrdersManager } from "@/components/admin/OrdersManager";
import { RegataOrdersManager } from "@/components/admin/RegataOrdersManager";
import { PlansManager } from "@/components/admin/PlansManager";
import { PartnersManager } from "@/components/admin/PartnersManager";
import { RacesManager } from "@/components/admin/RacesManager";
import { WeeklyFeedbacksManager } from "@/components/admin/WeeklyFeedbacksManager";
import { StudentFeedbacksManager } from "@/components/admin/StudentFeedbacksManager";
import { SupportCRM } from "@/components/admin/SupportCRM";
import { PollsManager } from "@/components/admin/PollsManager";
import { HealthSatisfaction } from "@/components/admin/HealthSatisfaction";
import { CRMAnalytics } from "@/components/admin/CRMAnalytics";
import { BroadcastManager } from "@/components/admin/BroadcastManager";
import { QuickRepliesManager } from "@/components/admin/QuickRepliesManager";
import { SalesFunnelManager } from "@/components/admin/SalesFunnelManager";
import { BotFlowManager } from "@/components/admin/BotFlowManager";
import { TeachersManager } from "@/components/admin/TeachersManager";
import { SystemLogsManager } from "@/components/admin/SystemLogsManager";
import { AdminNotifications } from "@/components/admin/AdminNotifications";
import AdminDashboard from "@/pages/AdminDashboard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MuralAvisosManager } from "@/components/admin/MuralAvisosManager";
import {
  Package,
  LogOut,
  ArrowLeft,
  FileText,
  Image,
  CreditCard,
  Shield,
  Ticket,
  DollarSign,
  Users,
  ShoppingBag,
  Shirt,
  LayoutList,
  MessageSquare,
  Calendar,
  UserPlus,
  Settings,
  Menu,
  Activity,
  Headset,
  BarChart3,
  Send,
  Zap,
  TrendingUp,
  Terminal,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminGroups = [
  {
    title: "Dashboard",
    tabs: [{ id: "visao_geral", label: "Visão Geral", icon: BarChart3, component: AdminDashboard }],
  },
  {
    title: "Gestão Comercial (Loja)",
    tabs: [
      { id: "lote_regatas", label: "Lote Regatas Z-NINE", icon: Shirt, component: RegataOrdersManager },
      { id: "produtos", label: "Produtos", icon: Package, component: ProductsManager },
      { id: "pedidos", label: "Pedidos Gerais", icon: ShoppingBag, component: OrdersManager },
      { id: "cupons", label: "Cupons", icon: Ticket, component: DiscountCoupons },
    ],
  },
  {
    title: "Atendimento (CRM)",
    tabs: [
      { id: "suporte", label: "Central de Suporte", icon: Headset, component: SupportCRM },
      { id: "mural", label: "Mural de Avisos", icon: Megaphone, component: MuralAvisosManager },
      {
        id: "health_satisfaction",
        label: "Saúde & Satisfação",
        icon: Activity,
        component: HealthSatisfaction,
      },
      { id: "analytics", label: "Analytics", icon: BarChart3, component: CRMAnalytics },
      { id: "broadcast", label: "Campanhas", icon: Send, component: BroadcastManager },
      { id: "enquetes", label: "Enquetes", icon: Activity, component: PollsManager },
      {
        id: "respostas_rapidas",
        label: "Respostas Rápidas",
        icon: Zap,
        component: QuickRepliesManager,
      },
      { id: "funis", label: "Funis de Vendas", icon: TrendingUp, component: SalesFunnelManager },
      {
        id: "fluxograma",
        label: "Fluxograma do Bot",
        icon: MessageSquare,
        component: BotFlowManager,
      },
    ],
  },
  {
    title: "Financeiro & Planos",
    tabs: [
      {
        id: "assinaturas",
        label: "Assinaturas",
        icon: CreditCard,
        component: SubscriptionsManager,
      },
      { id: "planos", label: "Planos", icon: LayoutList, component: PlansManager },
      { id: "pagamentos", label: "Pagamentos", icon: DollarSign, component: PaymentLinkGenerator },
    ],
  },
  {
    title: "Conteúdo & App",
    tabs: [
      { id: "corridas", label: "Corridas", icon: Calendar, component: RacesManager },
      { id: "artigos", label: "Artigos", icon: FileText, component: ArtigosManager },
      { id: "capas", label: "Capas", icon: Image, component: HeroImagesManager },
      { id: "parceiros", label: "Parceiros", icon: Users, component: PartnersManager },
    ],
  },
  {
    title: "Gestão de Pessoas (CRM)",
    tabs: [
      { id: "contas", label: "Contas Criadas", icon: UserPlus, component: AccountsCentral },
      { id: "importar", label: "Importar Alunos", icon: Users, component: BulkImportInvite },
      {
        id: "feedbacks_semanais",
        label: "Feedbacks Semanais",
        icon: Activity,
        component: WeeklyFeedbacksManager,
      },
      {
        id: "pesquisa_satisfacao",
        label: "Pesquisa de Satisfação",
        icon: MessageSquare,
        component: StudentFeedbacksManager,
      },
    ],
  },
  {
    title: "Configurações",
    tabs: [
      { id: "admins", label: "Gerenciar Admins", icon: Shield, component: AdminsManager },
      {
        id: "professores",
        label: "Gerenciar Professores",
        icon: Users,
        component: TeachersManager,
      },
      { id: "logs", label: "Monitoramento / Logs", icon: Terminal, component: SystemLogsManager },
    ],
  },
];

// Flat list for easy access to components and labels
const allTabs = adminGroups.flatMap((group) => group.tabs);

export default function Admin() {
  const navigate = useNavigate();
  const { user, loading, isAdmin, signOut } = useAuthContext();
  const [searchParams, setSearchParams] = useSearchParams();

  // Validate and get current tab safely
  const tabParam = searchParams.get("tab");
  const isValidTab = allTabs.some((t) => t.id === tabParam);
  // Se o parametro existe e é válido, usa ele. Senão, usa 'visao_geral' (default)
  const currentTab = tabParam && isValidTab ? tabParam : "visao_geral";

  const activeTabDetails = allTabs.find((t) => t.id === currentTab);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  // Redirect if not admin
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/admin/login");
    }
  }, [loading, user, isAdmin, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="w-full px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              title="Voltar para o site"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-none">Painel Administrativo</h1>
                <p className="text-xs text-muted-foreground mt-1">Gerenciamento do sistema</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <AdminNotifications />

            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium">{user.email}</span>
              <span className="text-xs text-muted-foreground capitalize">Administrador</span>
            </div>
            <Button variant="destructive" size="sm" onClick={handleSignOut} className="gap-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden max-w-[1920px] mx-auto w-full">
        <Tabs
          value={currentTab}
          onValueChange={handleTabChange}
          orientation="vertical"
          className="flex-1 flex flex-col md:flex-row overflow-hidden"
        >
          {/* Sidebar Navigation */}
          <aside className="w-full md:w-72 bg-card border-b md:border-b-0 md:border-r border-border flex-shrink-0 flex flex-col overflow-hidden">
            {/* Desktop Sidebar & Mobile Scrollable List */}
            <div className="flex-1 overflow-x-auto md:overflow-y-auto no-scrollbar scroll-smooth">
              <TabsList className="flex md:flex-col h-auto bg-transparent p-2 md:p-4 gap-1 md:gap-2 justify-start w-full min-w-max md:min-w-0">
                {adminGroups.map((group, groupIndex) => (
                  <div key={group.title} className="w-full mb-2 md:mb-4">
                    <div className="px-2 mb-2 hidden md:block">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {group.title}
                      </h3>
                    </div>
                    <div className="flex md:flex-col gap-1">
                      {group.tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = currentTab === tab.id;
                        return (
                          <TabsTrigger
                            key={tab.id}
                            value={tab.id}
                            className={cn(
                              "w-auto md:w-full justify-start gap-3 px-3 py-2.5 rounded-md transition-all",
                              "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                              "data-[state=inactive]:hover:bg-accent data-[state=inactive]:hover:text-accent-foreground",
                              "border border-transparent",
                              isActive ? "shadow-md" : ""
                            )}
                          >
                            <Icon
                              className={cn(
                                "w-4 h-4 flex-shrink-0",
                                isActive ? "text-primary-foreground" : "text-muted-foreground"
                              )}
                            />
                            <span className="truncate">{tab.label}</span>
                          </TabsTrigger>
                        );
                      })}
                    </div>
                    {groupIndex < adminGroups.length - 1 && (
                      <Separator className="my-2 bg-border/50 hidden md:block" />
                    )}
                  </div>
                ))}
              </TabsList>
            </div>

            {/* Sidebar Footer Stats (Optional) */}
            <div className="p-4 border-t border-border hidden md:block">
              <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground text-center">
                Superação Assessoria &copy; {new Date().getFullYear()}
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto bg-background/50 p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    {activeTabDetails?.label || "Dashboard"}
                  </h2>
                  <p className="text-muted-foreground">
                    Gerencie os {activeTabDetails?.label?.toLowerCase() ?? "itens"} do sistema aqui.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="min-h-[500px]">
                {allTabs.map((tab) => {
                  const Component = tab.component;
                  return (
                    <TabsContent
                      key={tab.id}
                      value={tab.id}
                      className="m-0 mt-4 animate-in fade-in-50 duration-300 slide-in-from-left-2"
                    >
                      <Component />
                    </TabsContent>
                  );
                })}
              </div>
            </div>
          </main>
        </Tabs>
      </div>
    </div>
  );
}
