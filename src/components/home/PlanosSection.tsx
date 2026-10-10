import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlans } from "@/hooks/usePlans"; // Use hook instead of static import
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";

export function PlanosSection() {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const { plans, loading } = usePlans(); // Fetch plans

  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      toast.error("Para assinar um plano, você precisa fazer login ou criar uma conta.");
      navigate("/login");
      return;
    }

    // Buscar detalhes do plano
    const selectedPlan = plans.find((p) => p.id === planId);
    if (!selectedPlan) {
      toast.error("Plano não encontrado");
      return;
    }

    // Redirecionar para página de escolha de pagamento (PIX ou Cartão)
    const params = new URLSearchParams({
      planId: selectedPlan.id,
      amount: selectedPlan.preco.toString(),
      description: `${selectedPlan.nome} - Superação Assessoria`,
    });

    navigate(`/escolher-pagamento?${params.toString()}`);
  };

  if (loading) {
    return (
      <section className="py-24 bg-muted flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </section>
    );
  }

  return (
    <section className="py-24 bg-muted">
      <div className="container">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-center mb-12">
          PLANOS DE CONSULTORIA
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans
            .filter((plan) => !plan.hidden)
            .map((plan) => (
              <article
                key={plan.id}
                className={cn(
                  "relative bg-background border p-6 flex flex-col transition-all duration-300 hover:-translate-y-1",
                  plan.destaque ? "border-primary shadow-lg" : "border-border hover:border-primary"
                )}
              >
                {plan.destaque && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 text-xs font-bold uppercase">
                    MAIS POPULAR
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-black mb-2">{plan.nome}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black">R$ {plan.precoMensal}</span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{plan.descricao}</p>
                </div>

                <ul className="space-y-3 mb-6 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.destaque ? "default" : "outline"}
                  className="w-full"
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loadingAction !== null}
                >
                  {loadingAction === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    plan.cta
                  )}
                </Button>
              </article>
            ))}
        </div>
      </div>
    </section>
  );
}
