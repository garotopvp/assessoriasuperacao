import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useHeroImage } from "@/hooks/useHeroImage";
import { toast } from "sonner";
import { StickyCTA } from "@/components/layout/StickyCTA";
import { SEO } from "@/components/common/SEO";
import { useAuthContext } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { usePlans } from "@/hooks/usePlans";

const beneficios = [
  {
    number: "01",
    title: "PLANILHA PERSONALIZADA",
    description:
      "Treinos estruturados com base no seu perfil, objetivos e disponibilidade. Ajustes mensais conforme sua evolução.",
  },
  {
    number: "02",
    title: "ANÁLISE BIOMECÂNICA",
    description:
      "Avaliação completa da sua técnica de corrida. Identificação de padrões de movimento e prevenção de lesões.",
  },
  {
    number: "03",
    title: "ACOMPANHAMENTO CONTÍNUO",
    description:
      "App SisRUNNER para registro de treinos. Feedback semanal e ajustes em tempo real via WhatsApp.",
  },
];

const horariosTreinos = [
  { dia: "Terça-feira", horarios: ["6:00", "19:30"] },
  { dia: "Quinta-feira", horarios: ["6:00", "19:30"] },
  { dia: "Sábado", horarios: ["Treinos em grupo"] },
];

const timeline = [
  {
    number: "01",
    title: "INSCRIÇÃO",
    description:
      "Preencha o formulário detalhado sobre seu histórico, objetivos e disponibilidade.",
  },
  {
    number: "02",
    title: "AVALIAÇÃO",
    description:
      "Análise completa do seu perfil. Teste de performance (presencial ou remoto) e avaliação biomecânica.",
  },
  {
    number: "03",
    title: "PLANILHA",
    description:
      "Receba sua planilha personalizada em até 48h. Integração com o app SisRUNNER para acompanhamento.",
  },
  {
    number: "04",
    title: "OTIMIZAÇÃO",
    description:
      "Feedback contínuo e ajustes conforme sua evolução. Análise semanal de performance.",
  },
];

const faqs = [
  {
    question: "Posso mudar de plano depois?",
    answer:
      "Sim! Você pode fazer upgrade ou downgrade a qualquer momento. Ajustamos o valor proporcional.",
  },
  {
    question: "Como funciona o teste de performance?",
    answer:
      "Para Santos e região, fazemos presencialmente. Para outras localidades, enviamos um protocolo remoto com análise via vídeo.",
  },
  {
    question: "E se eu me lesionar?",
    answer:
      "Pausamos seu plano sem custo adicional. Quando voltar, retomamos de onde parou com ajustes para reabilitação.",
  },
  {
    question: "Qual a diferença entre os planos?",
    answer:
      "Todos incluem planilha personalizada. A partir do Trimestral, você ganha análise biomecânica, ajustes ilimitados e benefícios extras como consultoria nutricional e descontos.",
  },
  {
    question: "Consigo cancelar quando quiser?",
    answer:
      "Sim. Todos os planos podem ser cancelados a qualquer momento. Não há multa ou taxa de cancelamento.",
  },
];

const Consultoria = () => {
  const { heroImage, loading: loadingHero } = useHeroImage("consultoria");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const { user } = useAuthContext();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { plans, loading: loadingPlans } = usePlans();

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

  const handleScrollToPlans = () => {
    const plansSection = document.getElementById("planos");
    if (plansSection) {
      plansSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <SEO
        title="Assessoria e Treinamento - Superação Assessoria"
        description="Assessoria especializada em corrida com planilhas personalizadas, análise biomecânica e acompanhamento contínuo. Treine com os melhores profissionais."
        keywords="assessoria corrida, treinamento personalizado, planilha corrida, coaching running"
      />
      <Layout>
        {/* Hero */}
        <section className="relative py-32 bg-secondary">
          <div
            className={`absolute inset-0 bg-cover bg-dynamic transition-opacity duration-300 ${loadingHero ? "opacity-0" : "opacity-100"}`}
            style={
              {
                "--bg-image": `url('${heroImage.url}')`,
                "--bg-position": heroImage.posicao,
              } as React.CSSProperties
            }
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="container relative z-10 text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight mb-4 text-shadow">
              ASSESSORIA DE
              <br />
              PERFORMANCE
            </h1>
            <p className="text-lg sm:text-xl text-white/80">
              Baseada em dados. Personalizada. Contínua.
            </p>
          </div>
        </section>

        {/* Benefícios */}
        <section className="py-24">
          <div className="container">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-center mb-12">
              O QUE VOCÊ RECEBE
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {beneficios.map((b) => (
                <article
                  key={b.number}
                  className="bg-muted border border-border p-6 hover:border-primary transition-colors"
                >
                  <div className="text-2xl font-black text-primary mb-4">{b.number}</div>
                  <h3 className="text-sm font-bold uppercase tracking-wide mb-3">{b.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Horários dos Treinos */}
        <section className="py-16 bg-muted">
          <div className="container">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-center mb-8">
              HORÁRIOS DOS TREINOS
            </h2>
            <div className="max-w-2xl mx-auto grid md:grid-cols-3 gap-4">
              {horariosTreinos.map((item) => (
                <div
                  key={item.dia}
                  className="bg-background border border-border p-6 text-center hover:border-primary transition-colors"
                >
                  <h3 className="text-lg font-bold mb-3">{item.dia}</h3>
                  <div className="space-y-1">
                    {item.horarios.map((horario, i) => (
                      <p key={i} className="text-primary font-semibold">
                        {horario}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Planos */}
        <section id="planos" className="py-24 bg-muted">
          <div className="container">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-center mb-12">
              ESCOLHA SEU PLANO
            </h2>
            {loadingPlans ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {plans
                  .filter((p) => !p.hidden)
                  .map((plan) => (
                    <article
                      key={plan.id}
                      className={cn(
                        "relative bg-background border p-6 flex flex-col transition-all duration-300 hover:-translate-y-1",
                        plan.destaque
                          ? "border-primary shadow-lg"
                          : "border-border hover:border-primary"
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
            )}
          </div>
        </section>

        {/* Timeline */}
        <section className="py-24">
          <div className="container">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-center mb-12">
              COMO FUNCIONA
            </h2>
            <div className="max-w-3xl mx-auto space-y-8">
              {timeline.map((item, index) => (
                <div key={item.number} className="flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-black">
                      {item.number}
                    </div>
                    {index < timeline.length - 1 && <div className="w-0.5 h-full bg-border mt-2" />}
                  </div>
                  <div className="pb-8">
                    <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-24 bg-muted">
          <div className="container">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-center mb-12">
              PERGUNTAS FREQUENTES
            </h2>
            <div className="max-w-3xl mx-auto space-y-4">
              {faqs.map((faq, index) => (
                <details key={index} className="group bg-background border border-border p-4">
                  <summary className="font-semibold cursor-pointer list-none flex items-center justify-between">
                    {faq.question}
                    <span className="text-primary group-open:rotate-180 transition-transform">
                      ▼
                    </span>
                  </summary>
                  <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 bg-secondary text-secondary-foreground">
          <div className="container text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4">
              PRONTO PARA EVOLUIR?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Junte-se a 60+ alunos ativos que já transformaram sua performance.
            </p>
            <Button size="lg" className="text-base px-10" onClick={handleScrollToPlans}>
              COMEÇAR AGORA
            </Button>
          </div>
        </section>

        <StickyCTA onClick={handleScrollToPlans} />
      </Layout>
    </>
  );
};

export default Consultoria;
