import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { SalesFunnelManager } from "@/components/admin/SalesFunnelManager";
import { PaymentLinkGenerator } from "@/components/admin/PaymentLinkGenerator";
import { QuickRepliesManager } from "@/components/admin/QuickRepliesManager";
import { ProductsManager } from "@/components/admin/features/ProductsManager";
import { OrdersManager } from "@/components/admin/OrdersManager";
import { DiscountCoupons } from "@/components/admin/DiscountCoupons";
import { PartnersManager } from "@/components/admin/PartnersManager";
import { PollsManager } from "@/components/admin/PollsManager";
import AdminDashboard from "@/pages/AdminDashboard";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  DollarSign,
  Zap,
  Package,
  ShoppingBag,
  Ticket,
  Users,
  Activity,
  BarChart3,
  ArrowLeft,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminGroups = [
  {
    title: "Comercial & Vendas",
    tabs: [
      { id: "dashboard", label: "Dashboard (KPIs)", icon: BarChart3, component: AdminDashboard },
      {
        id: "funis",
        label: "Funis de Vendas (CRM)",
        icon: TrendingUp,
        component: SalesFunnelManager,
      },
      {
        id: "pagamentos",
        label: "Gerar Link Recebimento",
        icon: DollarSign,
        component: PaymentLinkGenerator,
      },
      {
        id: "respostas",
        label: "Scripts Prontos (ZAP)",
        icon: Zap,
        component: QuickRepliesManager,
      },
      { id: "enquetes", label: "Enquetes de Intent", icon: Activity, component: PollsManager },
      { id: "parceiros", label: "Parceiros / Afiliados", icon: Users, component: PartnersManager },
    ],
  },
  {
    title: "Varejo & Loja",
    tabs: [
      { id: "produtos", label: "Estoque de Produtos", icon: Package, component: ProductsManager },
      { id: "pedidos", label: "Pedidos e Entregas", icon: ShoppingBag, component: OrdersManager },
      { id: "cupons", label: "Ofertas e Cupons", icon: Ticket, component: DiscountCoupons },
    ],
  },
];

const allTabs = adminGroups.flatMap((group) => group.tabs);

export default function AdminComercial() {
  const navigate = useNavigate();
  const { user, loading, isAdmin, isComercial, signOut } = useAuthContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get("tab");
  const isValidTab = allTabs.some((t) => t.id === tabParam);
  const currentTab = tabParam && isValidTab ? tabParam : "funis";
  const activeTabDetails = allTabs.find((t) => t.id === currentTab);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  useEffect(() => {
    // Só redireciona se já terminou de carregar TODAS as permissões
    if (!loading) {
      if (!user) {
        navigate("/admin/login");
      } else if (!isAdmin && !isComercial) {
        navigate("/admin/login");
      }
    }
  }, [loading, user, isAdmin, isComercial, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading || !user) return null;
  if (!isAdmin && !isComercial) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="w-full px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-none">Painel Comercial</h1>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
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
          <aside className="w-full md:w-72 bg-card border-b md:border-b-0 md:border-r border-border flex-shrink-0 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-x-auto md:overflow-y-auto no-scrollbar scroll-smooth">
              <TabsList className="flex md:flex-col h-auto bg-transparent p-2 md:p-4 gap-1 md:gap-2 justify-start w-full min-w-max md:min-w-0">
                {adminGroups.map((group) => (
                  <div key={group.title} className="w-full mb-2 md:mb-4">
                    <div className="px-2 mb-2 hidden md:block">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase">
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
                              "w-auto md:w-full justify-start gap-3 px-3 py-2.5 rounded-md",
                              "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                              isActive ? "shadow-md" : ""
                            )}
                          >
                            <Icon
                              className={cn(
                                "w-4 h-4",
                                isActive ? "text-primary-foreground" : "text-muted-foreground"
                              )}
                            />
                            {tab.label}
                          </TabsTrigger>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </TabsList>
            </div>
          </aside>
          <main className="flex-1 overflow-auto p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold">{activeTabDetails?.label}</h2>
              <Separator />
              <div className="min-h-[500px]">
                {allTabs.map((tab) => {
                  const Component = tab.component;
                  return (
                    <TabsContent key={tab.id} value={tab.id} className="m-0 mt-4">
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
