import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";

export default function Blocked() {
  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-destructive/20 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold text-destructive">
              Acesso Temporariamente Bloqueado
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Identificamos uma pendência na sua assinatura.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-4 rounded-lg text-sm text-center text-muted-foreground">
              Para restabelecer seu acesso completo a todos os treinos e conteúdos, por favor
              regularize seu pagamento.
            </div>

            <div className="space-y-3">
              <Button asChild className="w-full" size="lg">
                <Link to="/minha-assinatura">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Regularizar Assinatura
                </Link>
              </Button>

              <p className="text-xs text-center text-muted-foreground px-4">
                Clique acima para acessar sua fatura pendente.
              </p>

              <Button variant="outline" className="w-full" asChild>
                <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
                  Falar com Suporte
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
