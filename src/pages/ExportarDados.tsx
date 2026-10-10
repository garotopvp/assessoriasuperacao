import { logger } from "@/lib/logger";
import { useEffect } from "react";
import { SEO } from "@/components/common/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, Shield, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ExportarDados() {
  useEffect(() => {
    document.title = "Exportar Meus Dados - Superação Assessoria";
  }, []);

  const handleExportData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Você precisa estar logado para exportar seus dados");
        return;
      }

      toast.loading("Preparando seus dados...");

      // Busca todos os dados do usuário
      const [profile, subscriptions, orders] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("subscriptions").select("*").eq("user_id", user.id),
        supabase.from("orders").select("*").eq("user_id", user.id),
      ]);

      const userData = {
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
        },
        profile: profile.data,
        subscriptions: subscriptions.data,
        orders: orders.data,
        exported_at: new Date().toISOString(),
      };

      // Cria arquivo JSON
      const blob = new Blob([JSON.stringify(userData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bora-correr-club-dados-${user.id}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success("Dados exportados com sucesso!");
    } catch (error) {
      logger.error("Error exporting data:", error);
      toast.dismiss();
      toast.error("Erro ao exportar dados");
    }
  };

  return (
    <>
      <SEO
        title="Exportar Meus Dados"
        description="Exporte todos os seus dados pessoais do Superação Assessoria conforme a LGPD"
      />

      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Exportar Meus Dados</h1>
          <p className="text-muted-foreground">
            Conforme a Lei Geral de Proteção de Dados (LGPD), você tem o direito de solicitar uma
            cópia de todos os seus dados pessoais.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Seus Dados Pessoais</CardTitle>
            </div>
            <CardDescription>
              O arquivo exportado incluirá todas as informações que temos sobre você
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">O que será exportado:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-0.5" />
                  <span>Dados cadastrais (nome, email, CPF, telefone, endereço)</span>
                </li>
                <li className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-0.5" />
                  <span>Histórico de assinaturas e pagamentos</span>
                </li>
                <li className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-0.5" />
                  <span>Histórico de pedidos e compras</span>
                </li>
                <li className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-0.5" />
                  <span>Preferências e configurações da conta</span>
                </li>
              </ul>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Formato do arquivo
                </p>
                <p className="text-blue-800 dark:text-blue-200">
                  Os dados serão exportados em formato JSON, que pode ser aberto com qualquer editor
                  de texto ou visualizador JSON.
                </p>
              </div>
            </div>

            <Button onClick={handleExportData} className="w-full" size="lg">
              <Download className="h-4 w-4 mr-2" />
              Baixar Meus Dados
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Precisa de ajuda?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Se tiver dificuldades para exportar seus dados ou quiser solicitar alterações, entre
              em contato com nosso suporte:
            </p>
            <div className="space-y-2 text-sm">
              <p>📧 Email: contato@superacaoassessoria.com</p>
              <p>💬 WhatsApp: (11) 99999-9999</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
