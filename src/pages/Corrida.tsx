import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, ChevronRight, Timer, MapPin, Trophy } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function Corrida() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="relative h-[70vh] min-h-[500px] flex items-end overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/corrida_rua_v2.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
        <div className="container px-4 md:px-8 mx-auto relative z-10 pb-16">
          <Link to="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar ao início
          </Link>
          <span className="block text-primary font-heading tracking-[0.3em] text-sm uppercase mb-3">Modalidade</span>
          <h1 className="text-5xl md:text-7xl font-heading uppercase text-white leading-none tracking-tighter mb-4">
            Corrida de Rua<br /><span className="text-primary">e Montanha</span>
          </h1>
          <p className="text-neutral-300 text-xl max-w-2xl">
            Do primeiro 5km ao seu primeiro Ironman — com método, ciência e a mentoria de quem chegou lá.
          </p>
        </div>
      </section>

      {/* O que é */}
      <section className="py-20 bg-white">
        <div className="container px-4 md:px-8 mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <span className="text-primary font-heading tracking-[0.2em] text-sm uppercase">O que é</span>
              <h2 className="text-4xl md:text-5xl font-heading uppercase text-black leading-tight">
                Corrida com <span className="text-primary">Propósito</span>
              </h2>
              <p className="text-neutral-600 text-lg leading-relaxed">
                A Corrida de Rua é muito mais do que apenas sair andando rápido. É uma ciência que envolve <strong>fisiologia, periodização, nutrição e mentalidade</strong>. Na Superação, ensinamos cada aluno a entender o próprio corpo e extrair o máximo de desempenho de forma segura e progressiva.
              </p>
              <p className="text-neutral-600 text-lg leading-relaxed">
                Trabalhamos com corredores de todos os níveis: do iniciante que nunca correu 1km até o atleta experiente que quer quebrar tempo em maratonas ou se aventurar pelas trilhas de montanha.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Timer, title: "Do 5K à Maratona", desc: "Progrida no seu ritmo, com planilhas adaptadas ao seu nível atual." },
                { icon: MapPin, title: "Corrida de Montanha", desc: "Técnica de subida, descida e trilhas para os que buscam novas aventuras." },
                { icon: Trophy, title: "Alta Performance", desc: "Para quem quer time de chegada, pódios e recordes pessoais." },
                { icon: CheckCircle, title: "Longevidade", desc: "Corra sem lesões com um método baseado na sua individualidade biológica." },
              ].map((item, idx) => (
                <div key={idx} className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100 hover:border-primary/30 transition-colors">
                  <item.icon className="w-8 h-8 text-primary mb-4" />
                  <h4 className="font-heading text-black font-bold uppercase text-sm mb-2">{item.title}</h4>
                  <p className="text-neutral-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="py-20 bg-neutral-950 text-white">
        <div className="container px-4 md:px-8 mx-auto">
          <div className="text-center mb-16">
            <span className="text-primary font-heading tracking-[0.2em] text-sm uppercase">Metodologia</span>
            <h2 className="text-4xl md:text-5xl font-heading uppercase mt-3">Como Fazemos <span className="text-primary">Isso</span></h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Avaliação Inicial", desc: "Analisamos seu histórico, objetivos, limitações físicas e disponibilidade de tempo. Sem avaliação, não há planilha eficaz." },
              { step: "02", title: "Planilha Individualizada", desc: "Criamos uma planilha 100% personalizada com treinos intervalados, longões, e regenerativos na medida certa do seu organismo." },
              { step: "03", title: "Acompanhamento Semanal", desc: "Monitoramos seu progresso, ajustamos o plano e respondemos suas dúvidas para garantir que você evolua sem parar." },
            ].map((item, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-primary/50 transition-colors group">
                <span className="text-6xl font-heading text-primary/30 font-black leading-none group-hover:text-primary/60 transition-colors">{item.step}</span>
                <h3 className="text-xl font-heading uppercase text-white mt-4 mb-3">{item.title}</h3>
                <p className="text-neutral-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="container px-4 md:px-8 mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-heading uppercase text-white mb-6">Pronto para <span className="text-black">Correr?</span></h2>
          <p className="text-white/80 text-xl mb-10 max-w-xl mx-auto">
            Entre em contato agora e dê o primeiro passo para a sua transformação.
          </p>
          <Link
            to="/#contato"
            className="inline-flex items-center gap-3 bg-black text-white font-heading uppercase tracking-widest px-10 py-5 rounded-sm hover:bg-white hover:text-black transition-all shadow-2xl"
          >
            Começar Agora <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
