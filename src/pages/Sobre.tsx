import { Link } from "react-router-dom";
import { BookOpen, Award, Users, ChevronRight, Instagram } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const valores = [
  { emoji: "🏅", title: "Performance", desc: "Cada treino é desenhado para extrair o máximo do seu potencial.", color: "from-red-600 to-red-800" },
  { emoji: "❤️", title: "Humanidade", desc: "Enxergamos o ser humano por completo, não apenas o atleta.", color: "from-pink-500 to-rose-700" },
  { emoji: "🔬", title: "Ciência", desc: "Metodologia baseada em fisiologia e evidências, não achismo.", color: "from-blue-600 to-blue-900" },
  { emoji: "🌊", title: "Comunidade", desc: "Guarujá e litoral como palco de conquistas coletivas.", color: "from-cyan-500 to-blue-700" },
];

export default function Sobre() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero da Página */}
      <section className="pt-32 pb-20 bg-neutral-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-cover bg-center" style={{ backgroundImage: "url('/images/corrida_rua_v2.jpg')" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/80 to-neutral-950" />
        <div className="container px-4 md:px-8 mx-auto relative z-10 text-center">
          <span className="text-primary font-heading tracking-[0.3em] text-sm uppercase mb-4 block">Quem somos</span>
          <h1 className="text-5xl md:text-7xl font-heading uppercase text-white leading-none tracking-tighter">
            A <span className="text-primary">Superação</span>
          </h1>
          <p className="text-neutral-400 text-xl mt-6 max-w-2xl mx-auto font-light">
            Uma assessoria esportiva fundada na paixão pelo esporte e na crença de que toda pessoa pode superar seus próprios limites.
          </p>
        </div>
      </section>

      {/* Seção do Professor */}
      <section className="py-24 bg-white">
        <div className="container px-4 md:px-8 mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Foto */}
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl aspect-[4/5]">
                <img
                  src="/images/professor_paulo_vitor.jpg"
                  alt="Prof. Paulo Vitor Cardoso"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              {/* Badge flutuante */}
              <div className="absolute -bottom-6 -right-4 md:-right-8 bg-primary text-white rounded-2xl shadow-2xl p-6 text-center">
                <span className="block text-4xl font-heading font-black">20+</span>
                <span className="block text-xs uppercase tracking-wider opacity-90 mt-1">Anos de experiência</span>
              </div>
            </div>

            {/* Texto */}
            <div className="space-y-7 pt-8 lg:pt-0">
              <div>
                <span className="text-primary font-heading tracking-[0.2em] text-sm uppercase">Fundador &amp; Head Coach</span>
                <h2 className="text-4xl md:text-5xl font-heading uppercase text-black leading-tight mt-2">
                  Prof. Paulo Vitor<br /><span className="text-primary">Cardoso</span>
                </h2>
              </div>

              <p className="text-neutral-600 text-lg leading-relaxed">
                Fisiologista do Esporte, Master Coach e especialista em PNL, Hipnose e Constelação Familiar. Com mais de 20 anos acompanhando atletas do litoral e de todo o Brasil, Paulo Vitor construiu uma metodologia única que respeita a <strong>individualidade biológica</strong> de cada aluno.
              </p>

              <p className="text-neutral-600 text-lg leading-relaxed">
                Co-autor do livro <em>"Emagrecimento Além do Shape"</em> e reconhecido como uma das assessorias referência da Baixada Santista, Paulo Vitor acredita que o esporte vai muito além da performance — é uma ferramenta de transformação de vida.
              </p>

              {/* Credenciais */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {[
                  { icon: BookOpen, title: "Co-Autor", desc: "Emagrecimento Além do Shape" },
                  { icon: Award, title: "Fisiologista", desc: "CREF 255178-G/SP" },
                  { icon: Users, title: "100+ Atletas", desc: "Treinados com método próprio" },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                    <item.icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-heading font-bold text-black text-sm uppercase">{item.title}</p>
                      <p className="text-neutral-500 text-xs mt-0.5 leading-snug">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  to="/#contato"
                  className="inline-flex items-center gap-2 bg-primary text-white font-heading uppercase tracking-widest px-8 py-4 rounded-sm hover:bg-primary/90 transition-all shadow-lg"
                >
                  Treinar com o Prof. Paulo <ChevronRight className="w-4 h-4" />
                </Link>
                <a
                  href="https://www.instagram.com/superacaoassessoriagja/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border-2 border-neutral-200 text-neutral-700 font-heading uppercase tracking-widest px-6 py-4 rounded-sm hover:border-primary hover:text-primary transition-all"
                >
                  <Instagram className="w-4 h-4" /> Instagram
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* História da Assessoria */}
      <section className="py-24 bg-neutral-950 text-white">
        <div className="container px-4 md:px-8 mx-auto">
          <div className="text-center mb-16">
            <span className="text-primary font-heading tracking-[0.2em] text-sm uppercase">Nossa trajetória</span>
            <h2 className="text-4xl md:text-5xl font-heading uppercase mt-3">A <span className="text-primary">História</span> da Superação</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { ano: "2004", titulo: "O Começo", desc: "Paulo Vitor inicia sua jornada como profissional de Educação Física em Guarujá, acreditando que o esporte pode mudar vidas." },
              { ano: "2012", titulo: "Nasce a Superação", desc: "A assessoria esportiva é fundada com foco em corrida de rua, agregando os primeiros atletas que hoje são referência na região." },
              { ano: "Hoje", titulo: "Referência no Litoral", desc: "Eleita 7x uma das melhores assessorias da região, com atletas em IRONMAN, Maratona do Rio, São Silvestre e muito mais." },
            ].map((item, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-primary/40 transition-colors">
                <span className="text-5xl font-heading text-primary/40 font-black">{item.ano}</span>
                <h3 className="text-xl font-heading uppercase text-white mt-3 mb-3">{item.titulo}</h3>
                <p className="text-neutral-400 leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nossos Valores — Modelo 8: Cards grandes 2x2 com gradiente */}
      <section className="py-24 bg-white">
        <div className="container px-4 md:px-8 mx-auto">
          <div className="text-center mb-12">
            <span className="text-primary font-heading tracking-[0.2em] text-sm uppercase">O que nos move</span>
            <h2 className="text-4xl md:text-5xl font-heading uppercase mt-3 text-black">Nossos <span className="text-primary">Valores</span></h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {valores.map((item, idx) => (
              <div key={idx} className={`relative overflow-hidden rounded-2xl p-10 bg-gradient-to-br ${item.color} text-white group hover:scale-[1.02] transition-transform duration-300 cursor-default`}>
                <span className="absolute -right-4 -bottom-4 text-[8rem] opacity-10 leading-none group-hover:opacity-20 transition-opacity select-none">{item.emoji}</span>
                <h4 className="font-heading uppercase tracking-widest text-2xl mb-4 relative z-10">{item.title}</h4>
                <p className="text-white/80 text-base leading-relaxed relative z-10 max-w-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="container px-4 md:px-8 mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-heading uppercase text-white mb-6">Faça Parte da <span className="text-black">Superação</span></h2>
          <p className="text-white/80 text-xl mb-10 max-w-xl mx-auto">
            Venha conhecer nossa metodologia e dar o primeiro passo rumo à sua transformação.
          </p>
          <Link
            to="/#contato"
            className="inline-flex items-center gap-3 bg-black text-white font-heading uppercase tracking-widest px-10 py-5 rounded-sm hover:bg-white hover:text-black transition-all shadow-2xl"
          >
            Entrar em Contato <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
