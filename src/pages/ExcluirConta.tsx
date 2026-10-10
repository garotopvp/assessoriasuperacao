import { logger } from "@/lib/logger";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/common/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Trash2, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ExcluirConta() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [confirmations, setConfirmations] = useState({
    understand: false,
    noRefund: false,
    permanent: false,
  });
  const [showDialog, setShowDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    document.title = "Excluir Conta - Superação Assessoria";
  }, []);

  const allConfirmed =
    confirmations.understand &&
    confirmations.noRefund &&
    confirmations.permanent &&
    confirmText === "EXCLUIR MINHA CONTA";

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || user.email !== email) {
        toast.error("O email informado não corresponde à conta atual");
        setIsDeleting(false);
        return;
      }

      // Chama Edge Function para excluir conta
      const { error } = await supabase.functions.invoke("delete-account", {
        body: { userId: user.id },
      });

      if (error) throw error;

      // Faz logout
      await supabase.auth.signOut();

      toast.success("Conta excluída com sucesso. Sentiremos sua falta!");
      navigate("/");
    } catch (error) {
      logger.error("Error deleting account:", error);
      toast.error("Erro ao excluir conta. Entre em contato com o suporte.");
    } finally {
      setIsDeleting(false);
      setShowDialog(false);
    }
  };

  return (
    <>
      <SEO
        title="Excluir Conta"
        description="Exclua permanentemente sua conta do Superação Assessoria"
      />

      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-destructive">Excluir Conta</h1>
          <p className="text-muted-foreground">Esta ação é permanente e não pode ser desfeita</p>
        </div>

        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">Atenção!</CardTitle>
            </div>
            <CardDescription>A exclusão da sua conta é permanente e irreversível</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 p-4 bg-destructive/10 rounded-lg">
              <h3 className="font-semibold">O que acontecerá:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-destructive">•</span>
                  <span>Todos os seus dados pessoais serão permanentemente excluídos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">•</span>
                  <span>Você perderá acesso a todo conteúdo exclusivo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">•</span>
                  <span>Suas assinaturas ativas serão canceladas imediatamente</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">•</span>
                  <span>Não será possível recuperar seu histórico de compras</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">•</span>
                  <span>Não haverá reembolso de valores já pagos</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Confirme seu email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="understand"
                    checked={confirmations.understand}
                    onCheckedChange={(checked) =>
                      setConfirmations({ ...confirmations, understand: checked as boolean })
                    }
                  />
                  <label
                    htmlFor="understand"
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Eu entendo que esta ação é permanente e não pode ser desfeita
                  </label>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="noRefund"
                    checked={confirmations.noRefund}
                    onCheckedChange={(checked) =>
                      setConfirmations({ ...confirmations, noRefund: checked as boolean })
                    }
                  />
                  <label
                    htmlFor="noRefund"
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Eu entendo que não haverá reembolso de pagamentos já realizados
                  </label>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="permanent"
                    checked={confirmations.permanent}
                    onCheckedChange={(checked) =>
                      setConfirmations({ ...confirmations, permanent: checked as boolean })
                    }
                  />
                  <label
                    htmlFor="permanent"
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Eu entendo que todos os meus dados serão permanentemente excluídos
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm">
                  Digite <strong>"EXCLUIR MINHA CONTA"</strong> para confirmar
                </Label>
                <Input
                  id="confirm"
                  type="text"
                  placeholder="EXCLUIR MINHA CONTA"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" className="flex-1" onClick={() => navigate("/perfil")}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={!allConfirmed}
                onClick={() => setShowDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Minha Conta
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Alternativas</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Antes de excluir sua conta, considere estas alternativas:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary">→</span>
                <span>
                  <strong>Cancelar assinatura:</strong> Mantenha sua conta mas cancele os pagamentos
                  recorrentes
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">→</span>
                <span>
                  <strong>Desativar temporariamente:</strong> Entre em contato para pausar sua conta
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">→</span>
                <span>
                  <strong>Exportar dados:</strong> Baixe uma cópia dos seus dados antes de excluir
                </span>
              </li>
            </ul>
            <div className="pt-4 space-y-2">
              <p className="text-sm font-semibold">Precisa de ajuda?</p>
              <p className="text-sm text-muted-foreground">
                📧 Email: contato@superacaoassessoria.com
                <br />
                💬 WhatsApp: (11) 99999-9999
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta é sua última chance de voltar atrás. Uma vez confirmado, não há como recuperar
              sua conta ou seus dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não, manter minha conta</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Sim, excluir permanentemente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
