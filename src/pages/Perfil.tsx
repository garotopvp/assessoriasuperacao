import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { useAuthContext } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import {
  User,
  MapPin,
  Save,
  LogOut,
  Loader2,
  Package,
  CreditCard,
  Download,
  Trash2,
  FileText,
  Printer,
  Shield,
} from "lucide-react";
import { OrderHistory } from "@/components/perfil/OrderHistory";
import { useSubscription } from "@/hooks/useSubscription";
import { Badge } from "@/components/ui/badge";
import { TERMS_CONTENT, COMPANY_INFO } from "@/data/terms";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TwoFactorSetup } from "@/components/auth/TwoFactorSetup";
import { SEO } from "@/components/common/SEO";
import { MuralAvisos } from "@/components/perfil/MuralAvisos";

export default function Perfil() {
  const { user, signOut, signInWithGoogle } = useAuthContext();
  const { profile, loading, updateProfile } = useProfile();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [formData, setFormData] = useState({
    nome_completo: "",
    telefone: "",
    cpf: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
  });

  const { subscription, loading: subLoading } = useSubscription();

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast.error((error as Error).message || "Erro ao fazer login com Google");
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || "Ocorreu um erro");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handlePrintTerms = () => {
    const printWindow = window.open("", "", "width=800,height=600");
    if (printWindow) {
      printWindow.document.write(`
            <html>
                <head>
                    <title>Termo de Adesão - ${COMPANY_INFO.nomeFantasia}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
                        h1 { font-size: 18px; text-align: center; margin-bottom: 20px; }
                        p { margin-bottom: 10px; font-size: 12px; }
                        .footer { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 10px; text-align: center; color: #666; }
                    </style>
                </head>
                <body>
                    <h1>TERMO DE RESPONSABILIDADE E ADESÃO</h1>
                    <p><strong>1. DO OBJETO</strong><br>O presente termo tem como objeto a prestação de serviços de assessoria esportiva e orientação de corrida pela empresa <strong>${COMPANY_INFO.razaoSocial}</strong>, inscrita no CNPJ sob o nº <strong>${COMPANY_INFO.cnpj}</strong>, nome fantasia <strong>${COMPANY_INFO.nomeFantasia}</strong>.</p>
                    <p><strong>2. DA SAÚDE E APTIDÃO FÍSICA</strong><br>Declaro, para os devidos fins, que estou apto(a) a praticar atividades físicas e que não possuo contraindicações médicas. Reconheço que é de minha inteira responsabilidade realizar exames médicos periódicos (check-up) antes de iniciar os treinos. Isento o SUPERAÇÃO ASSESSORIA ESPORTIVA e seus treinadores de qualquer responsabilidade sobre problemas de saúde pré-existentes ou mal súbitos que possam ocorrer durante a prática das atividades.</p>
                    <p><strong>3. DOS RISCOS DA ATIVIDADE</strong><br>Estou ciente de que a prática de corrida envolve riscos inerentes à atividade, tais como torções, quedas e lesões musculares. Assumo total responsabilidade por minha integridade física durante os treinos presenciais ou realizados à distância, comprometendo-me a seguir as orientações dos treinadores.</p>
                    <p><strong>4. DO USO DE IMAGEM</strong><br>Autorizo, a título gratuito, o uso da minha imagem em fotos e vídeos captados durante treinos e eventos do SUPERAÇÃO ASSESSORIA ESPORTIVA, para fins de divulgação nas redes sociais e materiais promocionais da assessoria.</p>
                    <p><strong>5. DA ASSINATURA E CANCELAMENTO</strong><br>Estou ciente de que os planos possuem renovação de acordo com a periodicidade contratada. O cancelamento deve ser solicitado com antecedência mínima de 30 dias. Não haverá reembolso de valores referentes a períodos não utilizados por desistência do aluno.</p>
                    <p><strong>6. DISPOSIÇÕES GERAIS</strong><br>Ao aceitar este termo, confirmo a veracidade de todas as informações prestadas no cadastro e concordo com as regras estabelecidas pela SUPERAÇÃO ASSESSORIA ESPORTIVA.</p>
                    <div class="footer">
                        <p>Aceite digital registrado em: ${profile?.terms_accepted_at ? new Date(profile.terms_accepted_at).toLocaleString() : "N/A"}</p>
                        <p>Usuário: ${profile?.nome_completo || user?.email}</p>
                        <p>CPF: ${profile?.cpf || "N/A"}</p>
                    </div>
                    <script>
                        window.onload = function() { window.print(); window.close(); }
                    </script>
                </body>
            </html>
        `);
      printWindow.document.close();
    }
  };

  useEffect(() => {
    // Fallback to auth metadata if profile is not fully populated yet
    // or if the trigger missed copying some fields.
    const meta = user?.user_metadata || {};

    setFormData({
      nome_completo: profile?.nome_completo || meta.full_name || "",
      telefone: profile?.telefone || meta.phone || "",
      cpf: profile?.cpf || meta.cpf || "",
      endereco: profile?.endereco || "",
      cidade: profile?.cidade || "",
      estado: profile?.estado || "",
      cep: profile?.cep || "",
    });
  }, [profile, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const result = await updateProfile(formData);

    if (result.success) {
      toast.success("Perfil atualizado com sucesso!");
    } else {
      toast.error(result.error || "Erro ao atualizar perfil");
    }

    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Show login options if not authenticated
  if (!user) {
    return (
      <Layout>
        <section className="py-16 bg-muted min-h-screen">
          <div className="container max-w-md">
            <div className="bg-background border border-border p-8 text-center">
              <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h1 className="text-2xl font-black mb-2">ACESSE SUA CONTA</h1>
              <p className="text-sm text-muted-foreground mb-6">
                Faça login para acessar seu perfil e gerenciar suas informações
              </p>

              <div className="space-y-4">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                >
                  {isGoogleLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  )}
                  Continuar com Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">ou</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  size="lg"
                  onClick={() => navigate("/login")}
                >
                  Entrar com Email
                </Button>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <>
      <SEO
        title="Meu Perfil - Superação Assessoria"
        description="Gerencie suas informações pessoais, assinatura, pedidos e configurações de privacidade."
      />
      <Layout>
        <section className="py-16 bg-muted min-h-screen">
          <div className="container max-w-2xl">
            <div className="bg-background border border-border p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-2xl font-black mb-1">MEU PERFIL</h1>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </div>

              {/* Mural de Avisos */}
              <MuralAvisos squadId={profile?.squad_id} />

              {/* Dashboard Status */}
              {!subLoading && subscription && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-primary" />
                      Status da Assinatura
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {subscription.subscribed
                        ? `Plano ${subscription.plan_name} Ativo`
                        : "Nenhuma assinatura ativa"}
                    </p>

                    {/* Aviso de Inadimplência */}
                    {subscription.status === "past_due" && subscription.subscription_end && (
                      <div className="mt-2 bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-md text-sm font-medium flex items-start gap-2">
                        <div className="mt-0.5">⚠️</div>
                        <div>
                          <p>Pagamento pendente!</p>
                          <p className="text-xs opacity-90 mt-1">
                            Regularize até{" "}
                            {new Date(
                              new Date(subscription.subscription_end).getTime() +
                                5 * 24 * 60 * 60 * 1000
                            ).toLocaleDateString()}{" "}
                            para evitar o cancelamento.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {subscription.status === "past_due" ? (
                      <Badge variant="destructive">PENDENTE</Badge>
                    ) : subscription.subscribed ? (
                      <Badge className="bg-green-600">ATIVO</Badge>
                    ) : (
                      <Badge variant="secondary">INATIVO</Badge>
                    )}
                    <Button
                      asChild
                      size="sm"
                      variant={subscription.status === "past_due" ? "destructive" : "default"}
                    >
                      <Link to={subscription.subscribed ? "/minha-assinatura" : "/assessoria"}>
                        {subscription.status === "past_due"
                          ? "Regularizar"
                          : subscription.subscribed
                            ? "Gerenciar"
                            : "Assinar Agora"}
                      </Link>
                    </Button>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="space-y-4">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-muted w-24 mb-2" />
                      <div className="h-10 bg-muted w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Documentos Section - Inserted before Dados Pessoais */}
                  <div className="mb-8">
                    <h2 className="text-sm font-bold uppercase tracking-wide mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Documentos
                    </h2>
                    <div className="grid gap-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full justify-between">
                            <span className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              Termo de Adesão e Responsabilidade
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {profile?.terms_accepted_at
                                ? `Aceito em: ${new Date(profile.terms_accepted_at).toLocaleDateString()}`
                                : "Não registrado"}
                            </span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Termo de Adesão</DialogTitle>
                            <DialogDescription>
                              Cópia do termo aceito digitalmente.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="border p-4 rounded-md bg-muted/20 text-sm">
                            <ScrollArea className="h-[50vh]">{TERMS_CONTENT}</ScrollArea>
                          </div>
                          <div className="flex justify-end gap-2 mt-4">
                            <Button onClick={handlePrintTerms} className="gap-2">
                              <Printer className="w-4 h-4" />
                              Imprimir / Salvar PDF
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Dados Pessoais */}
                    <div>
                      <h2 className="text-sm font-bold uppercase tracking-wide mb-4 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Dados Pessoais
                      </h2>
                      <div className="grid gap-4">
                        <div>
                          <Label htmlFor="nome_completo">Nome Completo</Label>
                          <Input
                            id="nome_completo"
                            name="nome_completo"
                            value={formData.nome_completo}
                            onChange={handleChange}
                            placeholder="Seu nome completo"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="telefone">Telefone</Label>
                            <Input
                              id="telefone"
                              name="telefone"
                              value={formData.telefone}
                              onChange={handleChange}
                              placeholder="(11) 99999-9999"
                            />
                          </div>
                          <div>
                            <Label htmlFor="cpf">CPF</Label>
                            <Input
                              id="cpf"
                              name="cpf"
                              value={formData.cpf}
                              onChange={handleChange}
                              placeholder="000.000.000-00"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Endereço */}
                    <div>
                      <h2 className="text-sm font-bold uppercase tracking-wide mb-4 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Endereço de Entrega
                      </h2>
                      <div className="grid gap-4">
                        <div>
                          <Label htmlFor="endereco">Endereço</Label>
                          <Input
                            id="endereco"
                            name="endereco"
                            value={formData.endereco}
                            onChange={handleChange}
                            placeholder="Rua, número, complemento"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="col-span-2">
                            <Label htmlFor="cidade">Cidade</Label>
                            <Input
                              id="cidade"
                              name="cidade"
                              value={formData.cidade}
                              onChange={handleChange}
                              placeholder="Santos"
                            />
                          </div>
                          <div>
                            <Label htmlFor="estado">Estado</Label>
                            <Input
                              id="estado"
                              name="estado"
                              value={formData.estado}
                              onChange={handleChange}
                              placeholder="SP"
                              maxLength={2}
                            />
                          </div>
                        </div>
                        <div className="w-1/3">
                          <Label htmlFor="cep">CEP</Label>
                          <Input
                            id="cep"
                            name="cep"
                            value={formData.cep}
                            onChange={handleChange}
                            placeholder="00000-000"
                          />
                        </div>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={saving}>
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                  </form>
                </>
              )}

              {/* Subscription Section */}
              <div className="mt-8 pt-8 border-t border-border">
                <h2 className="text-sm font-bold uppercase tracking-wide mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Minha Assinatura
                </h2>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/minha-assinatura">Gerenciar Assinatura de Assessoria</Link>
                </Button>
              </div>

              {/* Two-Factor Authentication Section */}
              <div className="mt-8 pt-8 border-t border-border">
                <TwoFactorSetup userId={user?.id} />
              </div>

              {/* Order History Section */}
              <div className="mt-8 pt-8 border-t border-border">
                <h2 className="text-sm font-bold uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Meus Pedidos
                </h2>
                <OrderHistory />
                <div className="mt-4">
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/meus-pedidos">Ver Histórico Completo</Link>
                  </Button>
                </div>
              </div>

              {/* LGPD Section - Privacy & Data */}
              <div className="mt-8 pt-8 border-t border-border">
                <h2 className="text-sm font-bold uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Privacidade e Dados
                </h2>
                <div className="space-y-2">
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link to="/exportar-dados" className="flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Exportar Meus Dados
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start text-destructive hover:text-destructive"
                  >
                    <Link to="/excluir-conta" className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      Excluir Minha Conta
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    </>
  );
}
