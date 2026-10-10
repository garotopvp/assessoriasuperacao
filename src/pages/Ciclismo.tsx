import { Link } from "react-router-dom";
import { ArrowLeft, ChevronRight, Bike, Timer, Waves, Trophy } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function Ciclismo() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="relative h-[70vh] min-h-[500px] flex items-end overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/ciclismo_triathlon.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
        <div className="container px-4 md:px-8 mx-auto relative z-10 pb-16">
          <Link to="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar ao início
          </Link>
          <span className="block text-blue-400 font-heading tracking-[0.3em] text-sm uppercase mb-3">Modalidade</span>
          <h1 className="text-5xl md:text-7xl font-heading uppercase text-white leading-none tracking-tighter mb-4">
            Ciclismo e<br /><span className="text-blue-400">Triathlon</span>
          </h1>
          <p className="text-neutral-300 text-xl max-w-2xl">
            Natação, pedal e corrida unidos em um único método de alta performance. Chegue ao finish line mais forte.
          </p>
        </div>
      </section>

      {/* O que é */}
      <section className="py-20 bg-white">
        <div className="container px-4 md:px-8 mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <span className="text-blue-600 font-heading tracking-[0.2em] text-sm uppercase">O que é</span>
              <h2 className="text-4xl md:text-5xl font-heading uppercase text-black leading-tight">
                A Exigência do <span className="text-blue-600">Triplo Esporte</span>
              </h2>
              <p className="text-neutral-600 text-lg leading-relaxed">
                O Triathlon é considerado uma das provas mais completas e exigentes do esporte mundial. Combinar <strong>natação, ciclismo e corrida</strong> requer um treinamento extremamente bem planejado para que o atleta desenvolva as três modalidades sem se lesionar ou entrar em overtraining.
              </p>
              <p className="text-neutral-600 text-lg leading-relaxed">
                Na Superação, atendemos desde o ciclista que quer melhorar sua performance no pedal até o triatleta que sonha cruzar a linha de chegada de um <strong>IRONMAN 70.3 ou Full</strong>.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Bike, title: "Ciclismo de Estrada", desc: "Técnica, potência, posicionamento e planejamento de pedaladas longas." },
                { icon: Waves, title: "Natação", desc: "Técnica de nado eficiente para poupar energia na primeira parte do Tri." },
                { icon: Timer, title: "Transição T1/T2", desc: "Otimização das transições entre modalidades para ganhar segundos preciosos." },
                { icon: Trophy, title: "IRONMAN Ready", desc: "Preparação específica para completar ou melhorar seu tempo em provas Ironman." },
              ].map((item, idx) => (
                <div key={idx} className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100 hover:border-blue-400/50 transition-colors">
                  <item.icon className="w-8 h-8 text-blue-600 mb-4" />
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
            <span className="text-blue-400 font-heading tracking-[0.2em] text-sm uppercase">Metodologia</span>
            <h2 className="text-4xl md:text-5xl font-heading uppercase mt-3">Como Fazemos <span className="text-blue-400">Isso</span></h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Diagnóstico Tri-Esportivo", desc: "Avaliamos seu nível em cada modalidade separadamente, identificando pontos fortes e gargalos que limitam seu desempenho." },
              { step: "02", title: "Periodização Integrada", desc: "Criamos um plano que distribui os treinos das 3 modalidades de forma inteligente, respeitando a recuperação e a progressão de carga." },
              { step: "03", title: "Simulados e Provas", desc: "Preparamos o atleta para a prova específica, com simulados, estratégia de ritmo e preparação mental para o grande dia." },
            ].map((item, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-blue-400/50 transition-colors group">
                <span className="text-6xl font-heading text-blue-400/30 font-black leading-none group-hover:text-blue-400/60 transition-colors">{item.step}</span>
                <h3 className="text-xl font-heading uppercase text-white mt-4 mb-3">{item.title}</h3>
                <p className="text-neutral-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-blue-900">
        <div className="container px-4 md:px-8 mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-heading uppercase text-white mb-6">Pronto para o <span className="text-blue-300">Tri?</span></h2>
          <p className="text-white/80 text-xl mb-10 max-w-xl mx-auto">
            Entre em contato agora e dê o primeiro passo para cruzar sua próxima linha de chegada.
          </p>
          <Link
            to="/#contato"
            className="inline-flex items-center gap-3 bg-white text-blue-900 font-heading uppercase tracking-widest px-10 py-5 rounded-sm hover:bg-blue-400 hover:text-white transition-all shadow-2xl"
          >
            Começar Agora <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
