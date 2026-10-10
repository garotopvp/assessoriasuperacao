import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { z } from "zod";

const EmailSchema = z.object({
  email: z.string().email("Email inválido"),
});

const RecuperarSenha = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = EmailSchema.safeParse({ email });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });

      if (error) {
        toast.error("Erro ao enviar email: " + error.message);
      } else {
        setEmailEnviado(true);
        toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.");
      }
    } catch (err: unknown) {
      toast.error("Ocorreu um erro inesperado.");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailEnviado) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center py-16">
          <div className="w-full max-w-md mx-auto px-4 text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-2xl font-black mb-2">EMAIL ENVIADO</h1>
              <p className="text-sm text-muted-foreground">
                Enviamos um link de recuperação para <strong>{email}</strong>
              </p>
            </div>

            <div className="bg-muted/50 p-6 rounded-lg mb-6">
              <p className="text-sm text-left space-y-2">
                <strong>Próximos passos:</strong>
                <br />
                1. Verifique sua caixa de entrada (e spam)
                <br />
                2. Clique no link que enviamos
                <br />
                3. Defina sua nova senha
              </p>
            </div>

            <Link to="/login">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para Login
              </Button>
            </Link>
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
            <h1 className="text-2xl font-black mb-2">RECUPERAR SENHA</h1>
            <p className="text-sm text-muted-foreground">
              Digite seu email e enviaremos um link para redefinir sua senha
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                "ENVIAR LINK DE RECUPERAÇÃO"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <Link
              to="/login"
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar para Login
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RecuperarSenha;
