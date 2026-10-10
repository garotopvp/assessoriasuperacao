import { Clock, Users, Trophy, Target } from "lucide-react";

export function HistoriaSection() {
  // === CONFIGURAÇÃO DE MÍDIA ====================
  // Para exibir código de Vídeo, coloque o link dele aqui (exemplo: "/meu-video.mp4"). 
  // Se quiser exibir a foto normal, é só deixar vazio: ""
  const videoUrl = "/videos/video_pagina.mp4"; 
  const fotoUrl = "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2070&auto=format&fit=crop";
  // ==============================================

  const stats = [
    {
      icon: Clock,
      value: "20+",
      label: "Anos de Experiência"
    },
    {
      icon: Users,
      value: "100+",
      label: "Atletas Treinados"
    },
    {
      icon: Trophy,
      value: "100+",
      label: "Pódios Conquistados"
    },
    {
      icon: Target,
      value: "100%",
      label: "Foco no Aluno"
    }
  ];

  return (
    <section className="py-16 bg-white relative overflow-hidden" id="historia">
      <div className="container px-4 md:px-8 mx-auto z-10 relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Team Media */}
          <div className={`relative order-2 lg:order-1 ${videoUrl ? 'flex justify-center lg:justify-end' : ''}`}>
            <div className={`overflow-hidden rounded-2xl shadow-xl flex items-center justify-center ${!videoUrl ? 'aspect-[4/3] w-full bg-neutral-100 border border-neutral-200' : 'w-full max-w-[550px] lg:max-w-[680px]'}`}>
              {videoUrl ? (
                <video
                  src={videoUrl}
                  className="w-full h-auto max-h-[90vh] object-cover scale-[1.02]"
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls={false}
                />
              ) : (
                <img
                  src={fotoUrl}
                  alt="Treinamento Superação"
                  className="w-full h-full object-cover transition-all duration-700 hover:scale-105 hover:shadow-2xl"
                />
              )}
            </div>
            {/* Optional decorative element */}
            <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-primary/10 rounded-full blur-3xl -z-10" />
          </div>

          {/* Story & Stats */}
          <div className="space-y-8 order-1 lg:order-2">
            <div className="space-y-4">
              <span className="text-primary font-heading tracking-[0.2em] text-sm uppercase">
                REFERÊNCIA NO ESPORTE
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-heading uppercase text-black leading-tight tracking-tight">
                Eleita 7x Uma Das Melhores <br/>
                <span className="text-neutral-500">Da Baixada Santista</span>
              </h2>
              <p className="text-neutral-700 leading-relaxed text-lg pt-4 border-l-2 border-primary pl-4">
                Com mais de <strong className="text-black font-bold">20 anos de mercado</strong>, a Superação não apenas acompanha a evolução do esporte: nós a lideramos. Comprovadamente reconhecida <strong className="text-primary font-bold">mais de 7 vezes como uma das melhores assessorias</strong> da região, nossa trajetória é forjada no pódio e no resultado inquestionável dos nossos atletas.
              </p>
              <p className="text-neutral-700 leading-relaxed text-lg">
                Sob a visão de alto rendimento do <strong className="text-black font-bold">Prof. Paulo Vitor Cardoso</strong> (CREF-25576-G/SP) — Fisiologista, Master Coach e especialista em PNL, Hipnose e Constelação Familiar —, nosso método foi desenvolvido para quebrar qualquer barreira física ou mental que atrase a sua evolução.
              </p>
              <p className="text-neutral-700 leading-relaxed text-lg pb-4">
                Nós garantimos a sua <strong className="text-primary font-bold">transformação definitiva</strong>. Do abandono do sedentarismo até a glória extrema de cruzar a linha de chegada de um Ironman, você estará nas mãos de quem realmente domina o mapa até o topo.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-8 pt-6 border-t border-neutral-200">
              {stats.map((stat, index) => {
                return (
                  <div key={index} className="flex flex-col items-start border-l-4 border-primary pl-4 py-2 hover:border-black transition-colors">
                    <h4 className="text-6xl font-heading font-black text-black tracking-tighter leading-none mb-2">
                      {stat.value}
                    </h4>
                    <p className="text-xs font-bold tracking-[0.2em] text-neutral-600 uppercase">
                      {stat.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}