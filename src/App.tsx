import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { prefetchHeroImages } from "@/hooks/useHeroImage";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { LoadingPage } from "@/components/layout/LoadingPage";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

// Lazy load all pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Consultoria = lazy(() => import("./pages/Consultoria"));
const Conhecimento = lazy(() => import("./pages/Conhecimento"));
const Artigo = lazy(() => import("./pages/Artigo"));
const Roupas = lazy(() => import("./pages/Roupas"));
const Produto = lazy(() => import("./pages/Produto"));
const Login = lazy(() => import("./pages/Login"));
const CadastroAluno = lazy(() => import("./pages/CadastroAluno"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminMarketing = lazy(() => import("./pages/AdminMarketing"));
const AdminComercial = lazy(() => import("./pages/AdminComercial"));
const AdminOperacional = lazy(() => import("./pages/AdminOperacional"));
const AdminFinanceiro = lazy(() => import("./pages/AdminFinanceiro"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const Professor = lazy(() => import("./pages/Professor"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Perfil = lazy(() => import("./pages/Perfil"));
const Sucesso = lazy(() => import("./pages/Sucesso"));
const Sobre = lazy(() => import("./pages/Sobre"));
const MinhaAssinatura = lazy(() => import("./pages/MinhaAssinatura"));
const PagamentoDireto = lazy(() => import("./pages/PagamentoDireto"));
const PagamentoOpenPix = lazy(() => import("./pages/PagamentoOpenPix"));
const EscolherPagamento = lazy(() => import("./pages/EscolherPagamentoNova"));
const EscolherPagamentoAluno = lazy(() => import("./pages/EscolherPagamentoAluno"));
const EscolherPagamentoProduto = lazy(() => import("./pages/EscolherPagamentoProdutoNova"));
const Blocked = lazy(() => import("./pages/Blocked"));
const ShopSucesso = lazy(() => import("./pages/ShopSucesso"));
const DebugSubscriptions = lazy(() => import("./pages/DebugSubscriptions"));
const RecuperarSenha = lazy(() => import("./pages/RecuperarSenha"));
const RedefinirSenha = lazy(() => import("./pages/RedefinirSenha"));
const PoliticaPrivacidade = lazy(() => import("./pages/PoliticaPrivacidade"));
const TermosUso = lazy(() => import("./pages/TermosUso"));
const ExportarDados = lazy(() => import("./pages/ExportarDados"));
const ExcluirConta = lazy(() => import("./pages/ExcluirConta"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const MeusPedidos = lazy(() => import("./pages/MeusPedidos"));
const Clube = lazy(() => import("./pages/Clube"));
const Eventos = lazy(() => import("./pages/Eventos"));
const FeedbackSemanal = lazy(() => import("./pages/FeedbackSemanal"));
const Corrida = lazy(() => import("./pages/Corrida"));
const Ciclismo = lazy(() => import("./pages/Ciclismo"));
const QualidadeDeVida = lazy(() => import("./pages/QualidadeDeVida"));
const PesquisaSatisfacao = lazy(() => import("./pages/PesquisaSatisfacao"));
const PedidoRegata = lazy(() => import("./pages/PedidoRegata"));
const NovaRegata = lazy(() => import("./pages/NovaRegata"));
import { SubscriptionGuard } from "@/components/auth/SubscriptionGuard";
import { AuthGuard } from "@/components/auth/AuthGuard";

const queryClient = new QueryClient();

// Pré-carrega hero images em background após o app iniciar
const HERO_PAGES = ["home", "consultoria", "roupas", "conhecimento"];

function App() {
  // Pré-carrega todas as hero images em background após mount
  useEffect(() => {
    // Delay para não competir com o carregamento inicial
    const timer = setTimeout(() => {
      prefetchHeroImages(HERO_PAGES);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <WhatsAppButton />
              <ErrorBoundary>
                <Suspense fallback={<LoadingPage />}>
                  <Routes>
                    {/* Public or Special Routes */}
                    <Route path="/" element={<Index />} />
                    <Route path="/debug-subs" element={<DebugSubscriptions />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/cadastro-aluno" element={<CadastroAluno />} />
                    <Route path="/recuperar-senha" element={<RecuperarSenha />} />
                    <Route path="/redefinir-senha" element={<RedefinirSenha />} />
                    <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
                    <Route path="/termos-uso" element={<TermosUso />} />
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/marketing" element={<AdminMarketing />} />
                    <Route path="/comercial" element={<AdminComercial />} />
                    <Route path="/operacional" element={<AdminOperacional />} />
                    <Route path="/financeiro" element={<AdminFinanceiro />} />
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/professor" element={<Professor />} />

                    {/* Auth Protected Routes (Available even if blocked) */}
                    <Route element={<AuthGuard />}>
                      <Route path="/minha-assinatura" element={<MinhaAssinatura />} />
                      <Route path="/meus-pedidos" element={<MeusPedidos />} />
                      <Route path="/pagamento-direto" element={<PagamentoDireto />} />
                      <Route path="/pagamento-openpix" element={<PagamentoOpenPix />} />
                      <Route path="/escolher-pagamento" element={<EscolherPagamento />} />
                      <Route path="/pagamento-aluno" element={<EscolherPagamentoAluno />} />
                      <Route
                        path="/escolher-pagamento-produto"
                        element={<EscolherPagamentoProduto />}
                      />
                      <Route path="/exportar-dados" element={<ExportarDados />} />
                      <Route path="/excluir-conta" element={<ExcluirConta />} />
                    </Route>

                    {/* Public Content Routes */}
                    <Route path="/assessoria" element={<Consultoria />} />
                    <Route path="/conhecimento" element={<Conhecimento />} />
                    <Route path="/conhecimento/:id" element={<Artigo />} />
                    <Route path="/roupas" element={<Roupas />} />
                    <Route path="/pedido-regata" element={<PedidoRegata />} />
                    <Route path="/regata" element={<PedidoRegata />} />
                    <Route path="/nova-regata" element={<NovaRegata />} />
                    <Route path="/produto/:id" element={<Produto />} />
                    <Route path="/sobre" element={<Sobre />} />
                    <Route path="/corrida" element={<Corrida />} />
                    <Route path="/ciclismo" element={<Ciclismo />} />
                    <Route path="/qualidade-de-vida" element={<QualidadeDeVida />} />
                    <Route path="/pesquisa-satisfacao" element={<PesquisaSatisfacao />} />
                    <Route path="/shop-sucesso" element={<ShopSucesso />} />

                    {/* Protected Content Routes */}
                    <Route element={<SubscriptionGuard />}>
                      <Route path="/perfil" element={<Perfil />} />
                      <Route path="/feedback" element={<FeedbackSemanal />} />
                      <Route path="/sucesso" element={<Sucesso />} />
                      <Route path="/clube" element={<Clube />} />
                      <Route path="/eventos" element={<Eventos />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </BrowserRouter>
            <SpeedInsights />
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
