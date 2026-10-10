import { useState } from "react";
import { Link } from "react-router-dom";
import { Bike, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const RunnerIcon = ({ className }: React.SVGProps<SVGSVGElement>) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className} 
  >
    <path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z"/>
  </svg>
);

const programas = [
  {
    title: "Corrida de Rua e Montanha",
    description: "Planilhas individualizadas para todos os níveis. Do 5km à Maratona, respeitando sua individualidade biológica.",
    icon: RunnerIcon,
    image: "/images/corrida_rua_v2.jpg",
    link: "/corrida",
    styles: {
      hoverBorder: "hover:border-primary group-hover:shadow-[0_0_30px_rgba(191,27,27,0.15)]",
      iconArea: "bg-primary/10 border-primary/20 text-primary group-hover:bg-primary",
      btnClass: "bg-transparent text-primary hover:bg-primary border-primary",
    }
  },
  {
    title: "Ciclismo e Triathlon",
    description: "Treinamento especializado para ciclistas e triatletas que buscam performance e técnica apurada.",
    icon: Bike,
    image: "/images/ciclismo_triathlon.jpg",
    link: "/ciclismo",
    styles: {
      hoverBorder: "hover:border-brand-blue-deep group-hover:shadow-[0_0_30px_rgba(0,42,176,0.15)]",
      iconArea: "bg-brand-blue-deep/10 border-brand-blue-deep/20 text-brand-blue-deep group-hover:bg-brand-blue-deep",
      btnClass: "bg-transparent text-brand-blue-deep hover:bg-brand-blue-deep border-brand-blue-deep",
    }
  },
  {
    title: "Qualidade de Vida",
    description: "Condicionamento físico focado em saúde, emagrecimento e bem-estar, com acompanhamento próximo.",
    icon: Heart,
    image: "/images/qualidade_vida.jpg",
    link: "/qualidade-de-vida",
    styles: {
      hoverBorder: "hover:border-brand-pink group-hover:shadow-[0_0_30px_rgba(240,89,154,0.15)]",
      iconArea: "bg-brand-pink/10 border-brand-pink/20 text-brand-pink group-hover:bg-brand-pink",
      btnClass: "bg-transparent text-brand-pink hover:bg-brand-pink border-brand-pink",
    }
  }
];

export function SistemaSection() {
  return (
    <section className="py-24 lg:py-32 bg-neutral-50 relative border-t border-neutral-200" id="servicos">
      <div className="container px-4 md:px-8 mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <span className="text-primary font-heading tracking-[0.2em] text-sm uppercase">
            NOSSOS PROGRAMAS
          </span>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-heading text-white uppercase leading-none tracking-tight">
            Treine Como <span className="text-primary">Um Profissional</span>
          </h2>
          <p className="text-neutral-800 text-lg leading-relaxed pt-2">
            Metodologia exclusiva desenvolvida para maximizar seus resultados, seja você iniciante ou atleta de elite.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {programas.map((programa, idx) => {
            const Icon = programa.icon;
            
            // Cores específicas para cada modalidade baseadas na marca
            const hoverGlow = idx === 0 ? "group-hover:shadow-[0_0_40px_rgba(191,27,27,0.3)] group-hover:border-primary/50" :
                              idx === 1 ? "group-hover:shadow-[0_0_40px_rgba(0,42,176,0.3)] group-hover:border-brand-blue-deep/50" :
                                          "group-hover:shadow-[0_0_40px_rgba(240,89,154,0.3)] group-hover:border-brand-pink/50";
                                          
            const iconColor = idx === 0 ? "text-primary" :
                              idx === 1 ? "text-brand-blue-deep" :
                                          "text-brand-pink";

            return (
              <div key={idx} className={`group relative rounded-3xl overflow-hidden shadow-2xl transition-all duration-700 hover:-translate-y-4 flex items-end p-6 lg:p-10 h-[300px] sm:h-[400px] lg:h-[600px] border border-transparent ${hoverGlow}`}>
                
                {/* Imagem de Fundo (Ajustada para não ficar tão escura inicialmente) */}
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110" style={{ backgroundImage: `url('${programa.image}')` }} />
                
                {/* Degradê Inferior para garantir leitura do texto */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-700" />
                
                {/* Sobreposição escura suave que some no hover */}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors duration-700" />
                
                {/* Conteúdo */}
                <div className="relative z-10 flex flex-col items-start text-left w-full md:translate-y-8 md:group-hover:translate-y-0 transition-transform duration-700 ease-out">
                  
                  {/* Ícone com cor da modalidade — oculto no mobile para economizar espaço */}
                  <div className={`hidden md:flex w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md items-center justify-center mb-6 border border-white/20 group-hover:scale-110 transition-transform duration-700 ${iconColor}`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  
                  {/* Título */}
                  <h3 className="text-2xl lg:text-4xl font-heading uppercase text-white tracking-tight leading-[1.1] mb-3 drop-shadow-md pr-4">
                    {programa.title}
                  </h3>
                  
                  {/* Descrição — sempre visível no mobile, fade no desktop */}
                  <div className="grid grid-rows-[1fr] md:grid-rows-[0fr] md:group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-700 ease-out">
                    <div className="overflow-hidden">
                      <p className="text-neutral-300 text-sm md:text-base leading-relaxed mb-6 md:mb-8 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-500 delay-200">
                        {programa.description}
                      </p>
                    </div>
                  </div>

                  {/* Botão Inferior Minimalista com Seta */}
                  <Link 
                    to={programa.link} 
                    className="inline-flex items-center gap-3 text-xs md:text-sm font-bold uppercase tracking-widest text-white hover:text-white group-hover:gap-5 transition-all duration-500"
                  >
                    <span className="border-b border-transparent group-hover:border-white pb-1 transition-colors duration-500">
                      Explorar Modalidade
                    </span>
                    <div className="w-8 h-[1px] bg-white relative">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 rotate-45 w-2 h-[1px] bg-white origin-right" />
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 -rotate-45 w-2 h-[1px] bg-white origin-right" />
                    </div>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
