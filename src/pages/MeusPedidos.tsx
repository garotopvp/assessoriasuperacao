import { useEffect } from "react";
import { SEO } from "@/components/common/SEO";
import { PaymentHistory } from "@/components/payment/PaymentHistory";

export default function MeusPedidos() {
  useEffect(() => {
    document.title = "Meus Pedidos - Superação Assessoria";
  }, []);

  return (
    <>
      <SEO
        title="Meus Pedidos"
        description="Visualize o histórico completo de seus pedidos e pagamentos"
      />

      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Meus Pedidos</h1>
          <p className="text-muted-foreground">
            Acompanhe todos os seus pedidos e baixe comprovantes
          </p>
        </div>

        <PaymentHistory />
      </div>
    </>
  );
}
