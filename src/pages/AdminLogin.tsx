import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client"; // Adicionamos a importação direta
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy, Eye, EyeOff, Lock, Mail, LogOut, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminLogin() {
  const navigate = useNavigate();
  const {
    signIn,
    loading,
    isAdmin,
    isMarketing,
    isComercial,
    isOperacional,
    isFinanceiro,
    user,
    signOut,
  } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);

  // Redireciona automaticamente quando user e auth flags estiverem prontos
  useEffect(() => {
    if (!loading && user) {
      if (isAdmin) {
        navigate("/admin");
      } else if (isMarketing) {
        navigate("/marketing");
      } else if (isComercial) {
        navigate("/comercial");
      } else if (isOperacional) {
        navigate("/operacional");
      } else if (isFinanceiro) {
        navigate("/financeiro");
      }
    }
  }, [loading, user, isAdmin, isMarketing, isComercial, isOperacional, isFinanceiro, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isSignUp) {
        // CORREÇÃO AQUI: Usamos o supabase direto para criar a conta.
        // Isso evita que o código antigo tente inserir o perfil manualmente,
        // deixando o Trigger do banco fazer o trabalho sem dar erro de duplicidade.
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
        });

        if (error) {
          toast.error(error.message || "Erro ao criar conta");
          setIsSubmitting(false); // Importante parar o loading em caso de erro
          return;
        }

        const uid = data?.user?.id ?? null;
        setCreatedUserId(uid);
        toast.success("Conta criada! Agora vou precisar ativar seu acesso admin.");
        setIsSignUp(false);
      } else {
        const { error } = await signIn(email.trim(), password);

        if (error) {
          toast.error("Email ou senha incorretos");
          setIsSubmitting(false);
          return;
        }

        // Wait a bit for the auth state to update and check admin status
        // The useEffect will handle the redirect if successful
      }
    } catch (err) {
      toast.error("Erro ao processar");
      setIsSubmitting(false);
    } finally {
      // O finally aqui pode conflitar se o componente desmontar no redirect,
      // mas mantivemos a estrutura segura setando false nos erros acima.
      if (isSignUp) setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Logout realizado");
    } catch (error) {
      toast.error("Erro ao sair");
    }
  };

  // Se estiver carregando, mostra um loader simples ou nada
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se o usuário está logado, mas não é NENHUM tipo de admin (e carregamento terminou)
  if (user && !isAdmin && !isMarketing && !isComercial && !isOperacional && !isFinanceiro) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-lg text-center space-y-6">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Acesso Restrito</h1>
              <p className="text-muted-foreground">
                Você está logado como{" "}
                <span className="font-medium text-foreground">{user.email}</span>, mas esta conta
                não possui privilégios de administrador.
              </p>
              <div className="text-xs text-muted-foreground bg-muted p-2 rounded mt-2 select-all">
                ID: {user.id}
              </div>
            </div>
            <Alert variant="destructive" className="text-left">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Atenção</AlertTitle>
              <AlertDescription>
                Se você acredita que isso é um erro, entre em contato com o suporte ou tente acessar
                com outra conta.
              </AlertDescription>
            </Alert>
            <div className="flex flex-col gap-3">
              <Button onClick={handleSignOut}>Sair</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Formulário de login/cadastro (quando não está logado)
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {isSignUp ? "Criar Conta Admin" : "Acesso Administrativo"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isSignUp
                ? "Crie uma nova conta de administrador"
                : "Entre com suas credenciais de administrador"}
            </p>
          </div>

          {createdUserId && (
            <Alert className="mb-6">
              <Copy className="h-4 w-4" />
              <AlertTitle>Conta Criada com Sucesso!</AlertTitle>
              <AlertDescription className="space-y-2">
                <p className="text-sm">
                  Agora você precisa executar o SQL para tornar esta conta admin:
                </p>
                <div className="bg-muted p-3 rounded text-xs font-mono select-all break-all">
                  UPDATE profiles SET role = 'admin' WHERE id = '{createdUserId}';
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Copie e execute este comando no Supabase SQL Editor
                </p>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@exemplo.com"
                    className="pl-10"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    disabled={isSubmitting}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processando...</span>
                </div>
              ) : (
                <span>{isSignUp ? "Criar Conta" : "Entrar"}</span>
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setCreatedUserId(null);
                }}
                className="text-sm text-primary hover:underline"
                disabled={isSubmitting}
              >
                {isSignUp ? "Já tem uma conta? Faça login" : "Precisa criar uma conta admin?"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
