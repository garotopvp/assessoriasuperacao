import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { LoginSchema, RegisterSchema } from "@/lib/schemas";
import { Logger } from "@/lib/logger";
import { captureError } from "@/lib/sentry";
import { supabase } from "@/integrations/supabase/client";

const logger = new Logger("Login");

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showVerifyMessage, setShowVerifyMessage] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [dicaSenha, setDicaSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const { signIn, signUp, signInWithGoogle, resendConfirmationEmail } = useAuthContext();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        // Validar dados de login
        const validation = LoginSchema.safeParse({ email, password });
        if (!validation.success) {
          const errors = validation.error.errors.map((e) => e.message).join(", ");
          toast.error(errors);
          logger.warn("Validação de login falhou", { errors });
          setIsLoading(false);
          return;
        }

        logger.info("Tentativa de login", { email });
        const { error } = await signIn(email, password);
        if (error) {
          const errMsg = (error as any).message || "Erro ao fazer login";
          logger.error("Erro no login", { error: errMsg, email });

          if (errMsg.includes("Invalid login credentials") || errMsg.includes("Invalid login")) {
            // Tentar buscar dica de senha
            let hintMessage = "";
            try {
              const { data: hint } = await supabase.rpc("get_password_hint", { user_email: email });
              if (hint) {
                hintMessage = ` Dica: ${hint}`;
              }
            } catch (e) {
              console.error("Erro ao buscar dica", e);
            }

            toast.error(`Email ou senha incorretos.${hintMessage}`, {
              action: {
                label: "Recuperar Senha",
                onClick: () => navigate("/recuperar-senha"),
              },
              duration: 8000,
            });
          } else if (errMsg.includes("Email not confirmed")) {
            toast.error("Seu email ainda não foi confirmado.", {
              action: {
                label: "Reenviar Email",
                onClick: async () => {
                  const { error: resendError } = await resendConfirmationEmail(email);
                  if (resendError) {
                    toast.error("Erro ao reenviar email. Tente novamente mais tarde.");
                  } else {
                    toast.success("Email de confirmação enviado com sucesso!");
                  }
                },
              },
              duration: 8000,
            });
          } else {
            toast.error(errMsg);
          }

          captureError(new Error(`Login failed: ${errMsg}`), { email });
        } else {
          logger.info("Login bem-sucedido", { email });
          toast.success("Login realizado com sucesso!");
          navigate("/");
        }
      } else {
        // Validar dados de registro
        const validation = RegisterSchema.safeParse({
          email,
          password,
          name: name || undefined,
          dicaSenha: dicaSenha || undefined,
        });
        if (!validation.success) {
          const errors = validation.error.errors.map((e) => e.message).join(", ");
          toast.error(errors);
          logger.warn("Validação de registro falhou", { errors });
          setIsLoading(false);
          return;
        }

        logger.info("Tentativa de registro", { email });
        const { data, error } = await (signUp(email, password, {
          full_name: name,
          dica_senha: dicaSenha,
        }) as any);

        if (error) {
          const errMsg = (error as any).message || "Erro ao criar conta";
          logger.error("Erro no registro", { error: errMsg });
          captureError(new Error(`Registration failed: ${errMsg}`), { email });
          toast.error(errMsg);
        } else {
          logger.info("Registro bem-sucedido", { email });

          // Enviar email de boas-vindas via Edge Function
          supabase.functions.invoke("send-subscription-email", {
            body: {
              type: "welcome",
              email: email,
              customerName: name || email.split("@")[0],
            },
          });

          if (data?.session) {
            toast.success("Conta criada e login realizado!");
            navigate("/perfil");
          } else {
            setShowVerifyMessage(true);
            logger.info("Aguardando confirmação de e-mail", { email });
          }
        }
      }
    } catch (err: any) {
      const errMsg = err?.message || "Ocorreu um erro";
      logger.error("Erro não tratado no login/registro", { error: errMsg, email, isLogin });
      captureError(err, { email, isLogin });
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        const errMsg = (error as any).message || "Erro ao fazer login com Google";
        toast.error(errMsg);
      }
      // Redirect happens automatically via OAuth
    } catch (err: any) {
      toast.error(err?.message || "Ocorreu um erro");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      const { error } = await resendConfirmationEmail(email);
      if (error) {
        toast.error("Erro ao reenviar email. Tente novamente em instantes.");
      } else {
        toast.success("Email de confirmação reenviado!");
      }
    } catch (err) {
      toast.error("Ocorreu um erro ao reenviar.");
    } finally {
      setIsResending(false);
    }
  };

  if (showVerifyMessage) {
    return (
      <Layout>
        <div className="min-h-[70vh] flex items-center justify-center py-16">
          <div className="w-full max-w-md mx-auto px-6 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
              <Mail className="w-10 h-10 text-primary animate-pulse" />
            </div>

            <h1 className="text-3xl font-black mb-4 uppercase tracking-tight">
              Verifique seu e-mail
            </h1>

            <p className="text-muted-foreground mb-8 text-lg">
              Enviamos um link de confirmação para{" "}
              <span className="font-bold text-foreground">{email}</span>. Por favor, clique no link
              para ativar sua conta.
            </p>

            <div className="bg-muted/50 p-6 rounded-2xl mb-8 text-left space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2 text-primary" />
                Próximos passos:
              </h3>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• Verifique sua caixa de entrada e spam</li>
                <li>• Clique no botão de confirmação no e-mail</li>
                <li>• Após confirmar, você poderá fazer login</li>
              </ul>
            </div>

            <div className="space-y-4">
              <Button
                onClick={handleResendEmail}
                variant="outline"
                className="w-full h-12"
                disabled={isResending}
              >
                {isResending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  "Reenviar E-mail de Confirmação"
                )}
              </Button>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setShowVerifyMessage(false);
                  setIsLogin(true);
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para o Login
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center py-16">
        <div className="w-full max-w-md mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black mb-2">{isLogin ? "ENTRAR" : "CRIAR CONTA"}</h1>
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Acesse sua conta Superação Assessoria" : "Junte-se à comunidade de atletas"}
            </p>
          </div>

          {/* Google Sign In Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full mb-6"
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

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  required
                />
              </div>
            )}

            {!isLogin && (
              <div>
                <Label htmlFor="dicaSenha">Dica de Senha (Opcional)</Label>
                <Input
                  id="dicaSenha"
                  type="text"
                  value={dicaSenha}
                  onChange={(e) => setDicaSenha(e.target.value)}
                  placeholder="Ex: Nome do meu cachorro"
                  maxLength={100}
                />
              </div>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isLogin ? "Entrando..." : "Criando conta..."}
                </>
              ) : isLogin ? (
                "ENTRAR"
              ) : (
                "CRIAR CONTA"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-3">
            {isLogin && (
              <Link to="/recuperar-senha" className="block text-sm text-primary hover:underline">
                Esqueci minha senha
              </Link>
            )}
            <button
              type="button"
              onClick={() => setIsLogin((v) => !v)}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              {isLogin ? "Não tem conta? Cadastre-se" : "Já tem conta? Faça login"}
            </button>
          </div>

          <div className="mt-8 text-center">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              ← Voltar para Home
            </Link>
          </div>

          {/* Botão de Teste Sentry */}
          {import.meta.env.DEV && (
            <div className="mt-4 text-center">
              <Button
                variant="destructive"
                onClick={() => {
                  try {
                    // @ts-ignore
                    JSON.parse("{'invalid_json':}");
                  } catch (error) {
                    captureError(error, { context: "Sentry Test Button" });
                    toast.info("Erro de teste do Sentry enviado.");
                  }
                }}
              >
                Testar Erro Sentry
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Login;
