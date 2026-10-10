import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { WeeklyFeedbacksManager } from "@/components/admin/WeeklyFeedbacksManager";
import { SquadDashboard } from "@/components/admin/SquadDashboard";
import { SisRunPortal } from "@/components/admin/SisRunPortal";
import { MuralAvisosManager } from "@/components/admin/MuralAvisosManager";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity,
  LogOut,
  ArrowLeft,
  Menu,
  ChevronRight,
  Zap,
  Monitor,
  X,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const professorGroups = [
  {
    title: "Central",
    tabs: [{ id: "dashboard", label: "Visão Geral", icon: Zap, component: SquadDashboard }],
  },
  {
    title: "Treinos",
    tabs: [
      {
        id: "feedbacks_semanais",
        label: "Feedback dos Alunos",
        icon: Activity,
        component: WeeklyFeedbacksManager,
      },
      {
        id: "mural",
        label: "Mural de Avisos",
        icon: Megaphone,
        component: MuralAvisosManager,
      },
    ],
  },
  {
    title: "Ferramentas",
    tabs: [
      {
        id: "sisrun",
        label: "Portal SisRUN",
        icon: Monitor,
        component: SisRunPortal,
      },
    ],
  },
];

const allTabs = professorGroups.flatMap((g) => g.tabs);

// Vermelho da marca Superação
const BRAND_RED = "#ED1C24";
const BRAND_RED_DARK = "#BF161C";

export default function Professor() {
  const navigate = useNavigate();
  const { user, loading, isTeacher, isAdmin, signOut } = useAuthContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, [searchParams]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setSidebarOpen(true);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const tabParam = searchParams.get("tab");
  const isValidTab = allTabs.some((t) => t.id === tabParam);
  const currentTab = tabParam && isValidTab ? tabParam : "dashboard";
  const activeTabDetails = allTabs.find((t) => t.id === currentTab);

  useEffect(() => {
    if (!loading && (!user || (!isTeacher && !isAdmin))) {
      toast.error("Acesso restrito a professores.");
      navigate("/login");
    }
  }, [loading, user, isTeacher, isAdmin, navigate]);

  if (loading || !user) return null;

  const handleTabChange = (id: string) => setSearchParams({ tab: id });
  const handleSignOut = async () => { await signOut(); navigate("/"); };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden bg-black/40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={cn(
          "flex flex-col fixed md:relative h-full z-40 transition-all duration-300 bg-white border-r border-slate-200",
          sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0 md:w-[68px]"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 shrink-0 border-b border-slate-100">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: `linear-gradient(135deg, ${BRAND_RED}, ${BRAND_RED_DARK})`,
              boxShadow: `0 4px 14px rgba(237,28,36,0.35)`,
            }}
          >
            <Activity className="h-5 w-5 text-white" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 leading-none truncate">Painel Professor</p>
              <p className="text-[10px] font-bold mt-0.5 truncate" style={{ color: BRAND_RED }}>
                SUPERAÇÃO ASSESSORIA
              </p>
            </div>
          )}
          {sidebarOpen && (
            <button
              className="md:hidden text-slate-400 hover:text-slate-600 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1 py-4">
          <div className="space-y-5 px-3">
            {professorGroups.map((group) => (
              <div key={group.title}>
                {sidebarOpen && (
                  <p className="text-[9px] font-bold uppercase tracking-[0.15em] px-2 mb-2 text-slate-400">
                    {group.title}
                  </p>
                )}
                <div className="space-y-0.5">
                  {group.tabs.map((tab) => {
                    const isActive = currentTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={cn(
                          "w-full flex items-center gap-3 rounded-lg text-sm font-medium transition-all relative group",
                          sidebarOpen ? "px-3 py-2.5" : "justify-center px-0 py-2.5",
                          isActive
                            ? "text-white"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                        )}
                        style={
                          isActive
                            ? {
                                background: `linear-gradient(135deg, ${BRAND_RED}, ${BRAND_RED_DARK})`,
                                boxShadow: `0 4px 12px rgba(237,28,36,0.25)`,
                              }
                            : {}
                        }
                      >
                        <tab.icon className="h-4 w-4 shrink-0" />
                        {sidebarOpen && (
                          <>
                            <span className="flex-1 text-left">{tab.label}</span>
                            {isActive && <ChevronRight className="h-3.5 w-3.5 opacity-70" />}
                          </>
                        )}
                        {/* Tooltip collapsed */}
                        {!sidebarOpen && (
                          <div className="absolute left-full ml-2 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 bg-slate-900 text-white shadow-lg">
                            {tab.label}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="shrink-0 p-3 space-y-1 border-t border-slate-100">
          {/* User info */}
          {sidebarOpen && (
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg mb-2 bg-slate-50">
              <div
                className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${BRAND_RED}, ${BRAND_RED_DARK})` }}
              >
                {user?.email?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{user?.email?.split("@")[0]}</p>
                <p className="text-[10px] font-semibold" style={{ color: BRAND_RED }}>
                  {isTeacher ? "Professor" : "Admin"}
                </p>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className={cn(
              "w-full text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100",
              sidebarOpen ? "justify-start gap-2" : "justify-center px-0"
            )}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            {sidebarOpen && "Voltar ao Site"}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className={cn(
              "w-full text-xs text-red-400 hover:text-red-600 hover:bg-red-50",
              sidebarOpen ? "justify-start gap-2" : "justify-center px-0"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {sidebarOpen && "Encerrar Sessão"}
          </Button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 flex items-center gap-3 px-4 md:px-5 shrink-0 bg-white border-b border-slate-200">
          {/* Toggle sidebar */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-slate-800"
            onClick={() => setSidebarOpen((v) => !v)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Professor</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <span className="font-semibold text-slate-800">{activeTabDetails?.label}</span>
          </div>

          {/* Online indicator */}
          <div className="ml-auto flex items-center gap-1.5">
            <div
              className="h-2 w-2 rounded-full animate-pulse"
              style={{ background: "#22c55e", boxShadow: "0 0 6px #22c55e" }}
            />
            <span className="text-xs text-slate-400 hidden sm:block">Online</span>
          </div>
        </header>

        {/* Content */}
        {currentTab === "sisrun" ? (
          <div className="flex-1 overflow-hidden flex flex-col animate-in fade-in duration-300">
            <SisRunPortal />
          </div>
        ) : (
          <ScrollArea className="flex-1 bg-slate-50">
            <div className="p-4 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
              {activeTabDetails && <activeTabDetails.component />}
            </div>
          </ScrollArea>
        )}
      </main>
    </div>
  );
}
