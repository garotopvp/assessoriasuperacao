import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { SubscriptionsManager } from "@/components/admin/SubscriptionsManager";
import { PlansManager } from "@/components/admin/PlansManager";
import { PaymentLinkGenerator } from "@/components/admin/PaymentLinkGenerator";
import { SystemLogsManager } from "@/components/admin/SystemLogsManager";
import { ChurnGuard } from "@/components/admin/finance/ChurnGuard";
import { ExpensesManager } from "@/components/admin/finance/ExpensesManager";
import { InvoicesManager } from "@/components/admin/finance/InvoicesManager";
import { CashFlowAnalytics } from "@/components/admin/finance/CashFlowAnalytics";
import { TransactionHistory } from "@/components/admin/finance/TransactionHistory";
import { FinanceiroDashboard } from "@/components/admin/finance/FinanceiroDashboard";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CreditCard,
  LayoutList,
  BarChart3,
  DollarSign,
  Terminal,
  ShieldAlert,
  Wallet,
  FileText,
  Activity,
  ArrowLeft,
  Settings,
  LogOut,
  ListOrdered,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminGroups = [
  {
    title: "Visão Geral",
    tabs: [
      {
        id: "visao-geral",
        label: "Visão Geral Financeira",
        icon: LayoutDashboard,
        component: FinanceiroDashboard,
      },
    ],
  },
  {
    title: "Administrativo & Financeiro",
    tabs: [
      {
        id: "dashboard",
        label: "DRE Simplificado & MRR",
        icon: Activity,
        component: CashFlowAnalytics,
      },
      {
        id: "extrato",
        label: "Extrato / Transações",
        icon: ListOrdered,
        component: TransactionHistory,
      },
      {
        id: "despesas",
        label: "Contas a Pagar / Custos",
        icon: Wallet,
        component: ExpensesManager,
      },
      {
        id: "assinaturas",
        label: "Assinaturas & Cobranças",
        icon: CreditCard,
        component: SubscriptionsManager,
      },
      { id: "churn", label: "Recuperação / Churn Guard", icon: ShieldAlert, component: ChurnGuard },
      {
        id: "planos",
        label: "Configurar Preços/Planos",
        icon: LayoutList,
        component: PlansManager,
      },
      {
        id: "pagamentos",
        label: "Links de Pagamento Avulso",
        icon: DollarSign,
        component: PaymentLinkGenerator,
      },
    ],
  },
  {
    title: "Auditoria e Compliance",
    tabs: [
      {
        id: "notas",
        label: "Emissão de Notas Fiscais",
        icon: FileText,
        component: InvoicesManager,
      },
      { id: "logs", label: "Monitoramento / Logs", icon: Terminal, component: SystemLogsManager },
    ],
  },
];

const allTabs = adminGroups.flatMap((group) => group.tabs);

export default function AdminFinanceiro() {
  const navigate = useNavigate();
  const { user, loading, isAdmin, isFinanceiro, signOut } = useAuthContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get("tab");
  const isValidTab = allTabs.some((t) => t.id === tabParam);
  const currentTab = tabParam && isValidTab ? tabParam : "visao-geral";
  const activeTabDetails = allTabs.find((t) => t.id === currentTab);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  useEffect(() => {
    // Só redireciona se já terminou de carregar TODAS as permissões e o usuário logado
    // de fato NÃO tiver a permissão necessária.
    if (!loading) {
      if (!user) {
        navigate("/admin/login");
      } else if (!isAdmin && !isFinanceiro) {
        navigate("/admin/login");
      }
    }
  }, [loading, user, isAdmin, isFinanceiro, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading || !user) return null;
  if (!isAdmin && !isFinanceiro) return null;

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col font-sans selection:bg-primary/20">
      {/* Header Premium com Glassmorphism */}
      <header className="bg-background/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50 shadow-[0_1px_3px_0_rgb(0,0,0,0.02)]">
        <div className="w-full px-4 md:px-8 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="hover:bg-accent/60 rounded-full transition-colors hidden sm:flex"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-2 rounded-xl border border-primary/10 shadow-sm">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80 leading-tight">
                  Painel Financeiro
                </h1>
                <p className="text-xs font-medium text-muted-foreground -mt-0.5">
                  Gestão Estratégica do Clube
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="gap-2 rounded-full border-border/60 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Sair</span>
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
          {/* Sidebar Elegante */}
          <aside className="w-full md:w-80 bg-background/50 backdrop-blur-md border-b md:border-b-0 md:border-r border-border/40 flex-shrink-0 flex flex-col overflow-hidden relative z-10 shadow-[1px_0_5px_0_rgb(0,0,0,0.01)]">
            <div className="flex-1 overflow-x-auto md:overflow-y-auto no-scrollbar scroll-smooth">
              <TabsList className="flex md:flex-col h-auto bg-transparent p-3 md:p-5 gap-2 md:gap-4 justify-start w-full min-w-max md:min-w-0">
                {adminGroups.map((group) => (
                  <div key={group.title} className="w-full mb-1 md:mb-5 last:mb-0">
                    <div className="px-3 mb-3 hidden md:block">
                      <h3 className="text-[11px] font-bold text-muted-foreground/80 uppercase tracking-widest">
                        {group.title}
                      </h3>
                    </div>
                    <div className="flex md:flex-col gap-1.5">
                      {group.tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = currentTab === tab.id;
                        return (
                          <TabsTrigger
                            key={tab.id}
                            value={tab.id}
                            className={cn(
                              "w-auto md:w-full justify-start gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-xl transition-all duration-300 relative overflow-hidden group border border-transparent outline-none ring-0",
                              "data-[state=active]:bg-background data-[state=active]:border-border/60 data-[state=active]:shadow-sm",
                              isActive
                                ? "text-foreground"
                                : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                            )}
                          >
                            {/* Indicador de Tab Ativa Lateral */}
                            {isActive && (
                              <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 h-1/2 w-1 bg-primary rounded-r-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                            )}

                            <div
                              className={cn(
                                "p-1.5 rounded-lg transition-colors duration-300 shrink-0",
                                isActive
                                  ? "bg-primary/10 text-primary"
                                  : "bg-transparent text-muted-foreground group-hover:bg-accent/60 group-hover:text-foreground"
                              )}
                            >
                              <Icon className="w-[18px] h-[18px]" />
                            </div>

                            <span
                              className={cn(
                                "text-sm font-medium transition-colors",
                                isActive
                                  ? "text-foreground"
                                  : "text-muted-foreground group-hover:text-foreground"
                              )}
                            >
                              {tab.label}
                            </span>
                          </TabsTrigger>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </TabsList>
            </div>
          </aside>

          {/* Área de Conteúdo Principal */}
          <main className="flex-1 overflow-auto p-4 md:p-8 lg:px-10 pb-20 scroll-smooth">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-border/40">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    {activeTabDetails?.label}
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Gerencie configurações e dados associados a esta seção.
                  </p>
                </div>
              </div>

              <div className="min-h-[600px] relative">
                {allTabs.map((tab) => {
                  const Component = tab.component;
                  return (
                    <TabsContent
                      key={tab.id}
                      value={tab.id}
                      className={cn(
                        "m-0 mt-2 outline-none border-none",
                        // Micro-interação: Animação de entrada suave e moderna
                        "data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:slide-in-from-bottom-6 data-[state=active]:duration-500 data-[state=active]:zoom-in-[0.98]"
                      )}
                    >
                      {/* Envolto de segurança para todos os componentes herderam um fundo limpo */}
                      <div className="bg-background rounded-2xl border border-border/50 shadow-sm">
                        <Component />
                      </div>
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
