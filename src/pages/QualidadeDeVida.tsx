import { Link } from "react-router-dom";
import { ArrowLeft, ChevronRight, Heart, Activity, Smile, Sun } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function QualidadeDeVida() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="relative h-[70vh] min-h-[500px] flex items-end overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/qualidade_vida.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
        <div className="container px-4 md:px-8 mx-auto relative z-10 pb-16">
          <Link to="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar ao início
          </Link>
          <span className="block text-pink-400 font-heading tracking-[0.3em] text-sm uppercase mb-3">Modalidade</span>
          <h1 className="text-5xl md:text-7xl font-heading uppercase text-white leading-none tracking-tighter mb-4">
            Qualidade<br /><span className="text-pink-400">de Vida</span>
          </h1>
          <p className="text-neutral-300 text-xl max-w-2xl">
            Saúde e bem-estar como prioridade. Movimentar o corpo para viver melhor, com mais energia e disposição.
          </p>
        </div>
      </section>

      {/* O que é */}
      <section className="py-20 bg-white">
        <div className="container px-4 md:px-8 mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <span className="text-pink-500 font-heading tracking-[0.2em] text-sm uppercase">O que é</span>
              <h2 className="text-4xl md:text-5xl font-heading uppercase text-black leading-tight">
                Movimento que <span className="text-pink-500">Transforma</span>
              </h2>
              <p className="text-neutral-600 text-lg leading-relaxed">
                Qualidade de Vida vai muito além da estética. É sobre ter <strong>energia para viver, dormir bem, controlar o estresse</strong> e manter o corpo funcionando de forma eficiente pelo maior tempo possível.
              </p>
              <p className="text-neutral-600 text-lg leading-relaxed">
                Na Superação, trabalhamos com quem quer sair do sedentarismo, emagrecer com saúde, fortalecer o corpo sem lesões ou simplesmente se sentir melhor a cada dia. Aqui, o objetivo mais importante é o seu.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Heart, title: "Saúde Cardiovascular", desc: "Melhore sua capacidade cardiorrespiratória e reduza riscos de doenças crônicas." },
                { icon: Activity, title: "Emagrecimento Saudável", desc: "Perda de gordura de forma sustentável, sem dietas radicais ou treinos impossíveis." },
                { icon: Smile, title: "Bem-Estar Mental", desc: "O exercício é o melhor antidepressivo natural. Cuide da mente enquanto fortalece o corpo." },
                { icon: Sun, title: "Energia para o Dia", desc: "Acorde disposto, tenha foco no trabalho e termine o dia com energia sobrando." },
              ].map((item, idx) => (
                <div key={idx} className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100 hover:border-pink-400/50 transition-colors">
                  <item.icon className="w-8 h-8 text-pink-500 mb-4" />
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
            <span className="text-pink-400 font-heading tracking-[0.2em] text-sm uppercase">Metodologia</span>
            <h2 className="text-4xl md:text-5xl font-heading uppercase mt-3">Como Fazemos <span className="text-pink-400">Isso</span></h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Entendendo Você", desc: "Uma boa conversa sobre sua rotina, hábitos, limitações e objetivos. Só assim criamos algo que funciona de verdade para a sua vida." },
              { step: "02", title: "Plano na Medida Certa", desc: "Treinos progressivos, adaptados ao seu tempo e nível, que podem ser feitos na academia, ao ar livre ou em casa." },
              { step: "03", title: "Suporte Contínuo", desc: "Ajuste de cargas, motivação e acompanhamento constante. Você nunca estará sozinho nessa jornada." },
            ].map((item, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-pink-400/50 transition-colors group">
                <span className="text-6xl font-heading text-pink-400/30 font-black leading-none group-hover:text-pink-400/60 transition-colors">{item.step}</span>
                <h3 className="text-xl font-heading uppercase text-white mt-4 mb-3">{item.title}</h3>
                <p className="text-neutral-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-pink-600 to-rose-500">
        <div className="container px-4 md:px-8 mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-heading uppercase text-white mb-6">Comece sua <span className="text-black">Transformação</span></h2>
          <p className="text-white/90 text-xl mb-10 max-w-xl mx-auto">
            Não espere mais. O melhor momento para começar foi ontem — o segundo melhor é agora.
          </p>
          <Link
            to="/#contato"
            className="inline-flex items-center gap-3 bg-black text-white font-heading uppercase tracking-widest px-10 py-5 rounded-sm hover:bg-white hover:text-pink-600 transition-all shadow-2xl"
          >
            Quero Começar <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
