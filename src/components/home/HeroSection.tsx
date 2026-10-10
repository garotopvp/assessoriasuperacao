import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronDown, ArrowRight, Paintbrush } from "lucide-react";
import { useHeroImage } from "@/hooks/useHeroImage";

export function HeroSection() {
  const { heroImage } = useHeroImage("home");
  const [designOption, setDesignOption] = useState<number>(11);

  const scrollToContent = () => {
    window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
  };

  return (
    <section className="relative h-screen overflow-hidden bg-black">
      


      {/* --- OPÇÃO 1: CLEAN SPLIT --- */}
      {designOption === 1 && (
        <div className="absolute inset-0 bg-white flex items-center animate-in fade-in duration-500">
          <div className="absolute inset-0 flex">
            <div className="w-full lg:w-1/2 bg-white relative z-10" />
            <div className="hidden lg:block w-1/2 relative bg-neutral-100">
              {heroImage?.url && (
                <>
                  <img src={heroImage.url} alt="Hero" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: heroImage.posicao || "center" }} />
                  <div className="absolute inset-0 bg-gradient-to-r from-white via-white/40 to-transparent" />
                </>
              )}
            </div>
            <div className="lg:hidden absolute inset-0 opacity-[0.08]">
              {heroImage?.url && <img src={heroImage.url} alt="Hero" className="w-full h-full object-cover" />}
            </div>
          </div>
          
          <div className="container relative z-20 px-4 md:px-8 mx-auto">
            <div className="max-w-xl lg:pr-8">
              <p className="text-brand-blue-deep font-heading tracking-[0.2em] text-sm uppercase mb-4 font-bold">
                ASSESSORIA ESPORTIVA GUARUJÁ
              </p>
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-heading text-black leading-[0.95] mb-6 uppercase tracking-tight">
                TRANSFORME SEU <br />
                <span className="text-primary">POTENCIAL</span>
              </h1>
              <p className="text-lg md:text-xl text-neutral-600 font-light mb-10 border-l-4 border-brand-blue-light pl-5 leading-relaxed">
                Profissionais especializados, metodologia comprovada e uma comunidade apaixonada por esporte.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="text-base px-8 h-14 bg-primary hover:bg-primary/90 text-white font-heading tracking-wider uppercase rounded-sm flex items-center gap-2 shadow-lg">
                  <Link to="/#servicos">Conhecer a Metodologia <ArrowRight className="w-5 h-5" /></Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-base px-8 h-14 bg-white border-2 border-brand-blue-deep text-brand-blue-deep hover:bg-brand-blue-deep hover:text-white rounded-sm font-heading tracking-wider uppercase">
                  <Link to="/#contato">Agendar Aula</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- OPÇÃO 2: AZUL DA MARCA --- */}
      {designOption === 2 && (
        <div className="absolute inset-0 bg-brand-blue-deep flex items-center animate-in fade-in duration-500">
          {heroImage?.url && (
            <>
              <div className="absolute inset-0 w-full h-full object-cover z-0 opacity-40 mix-blend-overlay" style={{backgroundImage: `url('${heroImage.url}')`, backgroundPosition: heroImage.posicao || "center", backgroundSize: "cover"}} />
              <div className="absolute inset-0 bg-gradient-to-r from-brand-blue-deep via-brand-blue-deep/90 to-transparent z-0 w-full md:w-3/4" />
            </>
          )}
          <div className="container relative z-20 px-4 md:px-8 mx-auto">
            <div className="max-w-2xl">
              <p className="text-brand-blue-light font-heading tracking-[0.2em] text-sm uppercase mb-4 font-bold">
                ASSESSORIA ESPORTIVA GUARUJÁ
              </p>
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-heading text-white leading-[0.95] mb-6 uppercase tracking-tight">
                TRANSFORME SEU <br />
                <span className="text-brand-pink">POTENCIAL</span>
              </h1>
              <p className="text-lg md:text-xl text-white/80 font-light max-w-xl mb-10 border-l-4 border-brand-pink pl-5 leading-relaxed">
                Junte-se à Superação e descubra a sua melhor versão.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="text-base px-8 h-14 bg-brand-pink hover:bg-brand-pink/90 text-white font-heading tracking-wider uppercase rounded-sm flex items-center gap-2">
                  <Link to="/#servicos">Conhecer a Metodologia <ArrowRight className="w-5 h-5" /></Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-base px-8 h-14 bg-transparent border-2 border-white text-white hover:bg-white hover:text-brand-blue-deep rounded-sm font-heading tracking-wider uppercase">
                  <Link to="/#contato">Fale Conosco</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- OPÇÃO 3: DARK ELITE --- */}
      {designOption === 3 && (
        <div className="absolute inset-0 bg-neutral-950 flex items-center animate-in fade-in duration-500">
          <div className="absolute inset-0 w-full h-full object-cover z-0 opacity-40 grayscale" style={{backgroundImage: "url('/images/style3-bg.webp')", backgroundPosition: "center top", backgroundSize: "cover"}} />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent z-0" />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent z-0 w-full md:w-3/4" />
          <div className="container relative z-20 px-4 md:px-8 mx-auto">
            <div className="max-w-2xl">
              <p className="text-primary font-heading tracking-[0.2em] text-sm uppercase mb-4 font-bold">ASSESSORIA ESPORTIVA</p>
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-heading text-white leading-[0.95] mb-6 uppercase tracking-tight">
                TRANSFORME SEU <br />
                <span className="text-primary drop-shadow-[0_0_15px_rgba(191,27,27,0.3)]">POTENCIAL</span>
              </h1>
              <p className="text-lg md:text-xl text-neutral-300 font-light max-w-xl mb-10 border-l-4 border-primary pl-5 leading-relaxed">
                Metodologia comprovada e uma comunidade apaixonada por esporte.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="text-base px-8 h-14 bg-primary hover:bg-primary/90 text-white font-heading tracking-wider uppercase rounded-sm flex items-center gap-2">
                  <Link to="/#servicos">Explorar <ArrowRight className="w-5 h-5" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- OPÇÃO 4: MINIMALISTA CENTRADO --- */}
      {designOption === 4 && (
        <div className="absolute inset-0 bg-white flex flex-col justify-center items-center text-center animate-in fade-in duration-500 px-4">
          <p className="text-neutral-400 font-heading tracking-[0.3em] text-xs uppercase mb-6 font-bold">Superação Assessoria</p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading text-black leading-tight max-w-4xl mb-6 tracking-tight uppercase">
            Menos distrações.<br/><span className="text-primary">Mais performance.</span>
          </h1>
          <p className="text-lg md:text-xl text-neutral-500 max-w-2xl mb-12 font-light">
            Foco total em resultados orgânicos. Sem excessos. Apenas você, o treinador e a meta.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" className="rounded-full px-12 h-14 bg-black text-white hover:bg-neutral-800 font-heading tracking-wider uppercase text-base">
              <Link to="/#servicos">Conhecer a Metodologia</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-12 h-14 bg-transparent border-neutral-300 text-black hover:bg-neutral-100 font-heading tracking-wider uppercase text-base">
              <Link to="/#contato">Agendar Teste</Link>
            </Button>
          </div>
        </div>
      )}

      {/* --- OPÇÃO 5: GRADIENT POP --- */}
      {designOption === 5 && (
        <div className="absolute inset-0 bg-gradient-to-br from-brand-pink via-primary to-brand-blue-deep flex items-center justify-center animate-in fade-in duration-500">
          {heroImage?.url && <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-center bg-cover" style={{ backgroundImage: `url('${heroImage.url}')` }} />}
          <div className="container relative z-20 px-4 mx-auto text-center">
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-heading text-white uppercase tracking-tighter mb-6 drop-shadow-2xl">
              DESPERTE SUA <br/>ENERGIA
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto mb-12 font-medium">O máximo da sua capacidade com a melhor vibração.</p>
            <Button asChild size="lg" className="bg-white text-primary hover:bg-neutral-100 rounded-full h-16 px-12 border-none shadow-[0_0_30px_rgba(255,255,255,0.3)] font-heading tracking-widest uppercase text-lg">
              <Link to="/#contato">Fale com a gente</Link>
            </Button>
          </div>
        </div>
      )}

      {/* --- OPÇÃO 6: GLASSMORPHISM CARD --- */}
      {designOption === 6 && (
        <div className="absolute inset-0 flex items-center justify-center animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${heroImage?.url}')` }} />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          
          <div className="relative z-20 bg-white/10 backdrop-blur-md border border-white/20 p-8 md:p-16 rounded-3xl max-w-3xl text-center shadow-2xl mx-4 mt-20 sm:mt-0">
             <h1 className="text-5xl md:text-8xl font-heading text-white uppercase mb-6 drop-shadow-md tracking-tight">Alcance <br/> o Topo</h1>
             <p className="text-white text-lg md:text-xl mb-10 max-w-xl mx-auto font-light">Treinamento de elite em um ambiente exclusivo e focado na sua saúde mental e física.</p>
             <Button asChild size="lg" className="bg-primary hover:bg-primary/80 text-white rounded-xl h-14 px-10 border-none font-heading uppercase tracking-wider text-base">
                <Link to="/#servicos">Ver Programas</Link>
             </Button>
          </div>
        </div>
      )}

      {/* --- OPÇÃO 7: BOLD TYPOGRAPHY --- */}
      {designOption === 7 && (
        <div className="absolute inset-0 bg-neutral-950 flex items-center animate-in fade-in duration-500 overflow-hidden">
          <div className="absolute md:-right-[10%] top-0 w-full md:w-3/4 h-full mix-blend-screen opacity-50 md:opacity-80 bg-cover bg-center grayscale" style={{ backgroundImage: `url('${heroImage?.url}')` }} />
          <div className="container relative z-20 px-4 mx-auto text-left pointer-events-none">
            <h1 className="text-[15vw] md:text-[12vw] leading-[0.85] font-heading font-black text-white uppercase tracking-tighter opacity-90 drop-shadow-2xl">
              AQUI É<br/><span className="text-primary">VENCER</span>
            </h1>
            <div className="mt-12 flex gap-4 pointer-events-auto pl-2">
              <Button asChild size="lg" className="bg-white text-black hover:bg-neutral-200 h-16 px-10 rounded-sm font-heading font-bold text-xl uppercase">
                <Link to="/#servicos">Explorar Programas</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- OPÇÃO 8: EDITORIAL SOLID --- */}
      {designOption === 8 && (
        <div className="absolute inset-0 flex flex-col md:flex-row animate-in fade-in duration-500 bg-white">
          <div className="w-full md:w-1/2 h-1/2 md:h-full relative overflow-hidden">
            <img src={heroImage?.url} alt="Hero" className="absolute inset-0 w-full h-full object-cover scale-105" />
          </div>
          <div className="w-full md:w-1/2 h-1/2 md:h-full bg-primary flex flex-col justify-center p-8 md:p-16 lg:p-24 relative overflow-hidden text-left mt-20 sm:mt-0">
             <div className="absolute -right-10 -bottom-10 text-[25vw] font-heading font-black text-black/10 leading-none select-none">RUN</div>
             <p className="text-black/60 font-heading tracking-widest text-sm uppercase mb-4 relative z-10">Equipe Superação</p>
             <h1 className="text-5xl md:text-7xl font-heading text-white uppercase mb-6 relative z-10 leading-none">O Seu Novo Limite</h1>
             <p className="text-white/90 text-lg md:text-xl mb-10 relative z-10 max-w-md">Assuma o controle da sua jornada com a Assessoria de mais autoridade da região.</p>
             <Button asChild variant="outline" size="lg" className="self-start border-2 border-white text-primary hover:bg-white hover:text-primary bg-white/10 w-auto rounded-none h-14 font-heading uppercase tracking-widest">
               <Link to="/#contato">Junte-se ao time</Link>
             </Button>
          </div>
        </div>
      )}

      {/* --- OPÇÃO 9: DIAGONAL SLASH --- */}
      {designOption === 9 && (
        <div className="absolute inset-0 bg-obsidian flex items-center animate-in fade-in duration-500 overflow-hidden">
          <div className="absolute inset-0 w-[150%] h-[150%] -top-[25%] -left-[25%] bg-cover bg-center origin-center rotate-[15deg] opacity-50 grayscale" style={{ backgroundImage: `url('${heroImage?.url}')` }} />
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black via-black/90 to-transparent" />
          <div className="container relative z-20 px-8 mx-auto -rotate-2">
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-heading text-white italic uppercase tracking-tighter mb-4 shadow-black drop-shadow-2xl">
              SEM <span className="text-primary border-b-8 border-primary">DESCULPAS</span>
            </h1>
            <p className="text-xl text-neutral-400 mb-8 max-w-lg italic font-semibold">Transforme o suor em resultados reais.</p>
            <Button asChild size="lg" className="bg-primary hover:bg-primary/80 border-none text-white transform -skew-x-12 px-12 h-16 rounded-none">
               <Link to="/#servicos" className="transform skew-x-12 font-heading tracking-widest uppercase text-xl text-white font-black">Começar o Treino</Link>
            </Button>
          </div>
        </div>
      )}

      {/* --- OPÇÃO 10: NEON CYBER --- */}
      {designOption === 10 && (
        <div className="absolute inset-0 bg-black flex items-center justify-center animate-in fade-in duration-500 overflow-hidden">
           {heroImage?.url && (
             <div className="absolute inset-0 opacity-20 bg-cover bg-center grayscale mix-blend-luminosity" style={{ backgroundImage: `url('${heroImage?.url}')` }} />
           )}
           <div className="text-center relative z-20 px-4 mt-20 sm:mt-0">
              <h1 className="text-[3rem] sm:text-7xl md:text-9xl font-heading uppercase tracking-widest text-transparent break-words" style={{ WebkitTextStroke: '1px white' }}>
                SUPERAÇÃO
              </h1>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-heading text-primary uppercase mt-[-10px] md:mt-[-20px] mb-12 drop-shadow-[0_0_20px_rgba(191,27,27,0.8)]">
                ASSESSORIA ESPORTIVA
              </h2>
              <Button asChild variant="outline" className="border-primary bg-primary/10 text-primary hover:bg-primary hover:text-white shadow-[0_0_30px_rgba(191,27,27,0.4)] px-12 py-8 text-xl font-heading tracking-widest rounded-sm backdrop-blur-md uppercase">
                <Link to="/#contato">INICIAR PROJETO</Link>
              </Button>
           </div>
        </div>
      )}

      {/* --- OPÇÃO 11: TYPOGRAPHY OUTLINE (LETRAS VAZADAS) --- */}
      {designOption === 11 && (
        <div className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center animate-in fade-in duration-500 overflow-hidden text-center z-10">
          <div className="absolute inset-0 opacity-40 bg-cover bg-center" style={{ backgroundImage: `url('${heroImage?.url}')` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-neutral-950/80 z-0" />
          
          <div className="relative z-20 px-4 w-full mt-24 sm:mt-0 flex flex-col items-center">
            {/* Background absolute massive text */}
            <h1 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[18vw] font-heading font-black text-transparent opacity-80 uppercase tracking-tighter whitespace-nowrap select-none pointer-events-none" style={{ WebkitTextStroke: '2px rgba(255,255,255,0.15)' }}>
              SUPERAÇÃO
            </h1>
            <h2 className="absolute top-[-15vh] sm:-top-[10vh] text-6xl md:text-8xl lg:text-9xl font-heading text-white uppercase tracking-tighter leading-[0.9] drop-shadow-2xl z-20 w-full text-center">
              ALCANCE <br/><span className="text-primary">O TOPO</span>
            </h2>

            <Button asChild size="lg" className="bg-primary hover:bg-white hover:text-primary text-white font-heading font-black tracking-widest uppercase rounded-sm h-16 px-12 text-lg shadow-[0_10px_30px_rgba(191,27,27,0.4)] transition-all mt-[65vh] relative z-20">
              <Link to="/#servicos">Treinar Agora</Link>
            </Button>
          </div>
        </div>
      )}

      {/* --- OPÇÃO 12: TYPOGRAPHY SPLIT (REVISTA BOLD) --- */}
      {designOption === 12 && (
        <div className="absolute inset-0 bg-neutral-100 flex animate-in fade-in duration-500 z-10">
          <div className="w-1/3 md:w-1/4 lg:w-[15%] h-full bg-primary flex items-end justify-center py-20 relative z-20 shrink-0">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap">
                <span className="text-[10vh] font-heading font-black text-black/20 uppercase tracking-tighter select-none">PERFORMANCE</span>
             </div>
             <p className="font-heading text-white uppercase tracking-[0.3em] text-xs -rotate-90 origin-bottom transform translate-y-16 select-none font-bold">
               A.E. GUARUJÁ 2026
             </p>
          </div>
          <div className="flex-1 h-full relative overflow-hidden bg-white">
            <div className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-multiply" style={{ backgroundImage: `url('${heroImage?.url}')`, backgroundPosition: 'center', backgroundSize: 'cover' }} />
            <div className="absolute inset-0 bg-gradient-to-l from-white/90 via-white/50 to-transparent" />
            
            <div className="absolute top-1/2 -translate-y-1/2 left-8 md:left-16 xl:left-24 z-30 max-w-3xl pr-4 mt-16 sm:mt-0">
              <h1 className="text-6xl sm:text-7xl md:text-[8vw] lg:text-[7vw] font-heading text-black font-black uppercase tracking-tighter leading-[0.85] mb-6">
                ROMPE <br/>TEUS <br/><span className="text-primary">LIMITES</span>
              </h1>
              <Button asChild size="lg" className="bg-black text-white hover:bg-neutral-800 rounded-none h-14 px-10 font-heading tracking-widest uppercase text-lg mt-8 border border-black shadow-none">
                <Link to="/#servicos">Ver Metodologia ➝</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- OPÇÃO 13: TYPOGRAPHY OVERLAP (TEXTO MÁXIMO) --- */}
      {designOption === 13 && (
        <div className="absolute inset-0 bg-black flex flex-col justify-end animate-in fade-in duration-500 overflow-hidden px-4 md:px-12 py-12 md:py-24 z-10">
          <div className="absolute inset-0 opacity-60 bg-cover bg-center" style={{ backgroundImage: `url('${heroImage?.url}')` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          
          <div className="relative z-20 w-full flex flex-col justify-end h-full">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:items-end">
              <div className="md:col-span-8">
                <h1 className="text-[18vw] md:text-[14vw] font-heading font-black text-white uppercase tracking-tighter leading-[0.75] mb-2 md:mb-0" style={{ textShadow: '0 20px 50px rgba(0,0,0,0.5)'}}>
                  VÁ <br/>ALÉM
                </h1>
              </div>
              <div className="md:col-span-4 flex flex-col justify-end pb-2 md:pb-6">
                 <p className="text-xl md:text-2xl text-primary font-bold mb-4 font-heading tracking-widest uppercase">
                   O Próximo Nível.
                 </p>
                 <p className="text-neutral-300 font-light text-lg mb-8 max-w-md bg-black/40 p-4 rounded-sm backdrop-blur-sm border-l-4 border-primary">
                   Assessoria especializada em triatlo, corrida e condicionamento físico no litoral.
                 </p>
                 <Button asChild size="lg" className="bg-white text-black hover:bg-neutral-200 h-16 w-full md:w-auto font-heading font-bold text-xl uppercase tracking-widest">
                    <Link to="/#contato">Fazer Parte</Link>
                 </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scroll Indicator (Shared) */}
      <button
        onClick={scrollToContent}
        className={`absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 transition-colors animate-bounce-subtle z-20 ${(designOption === 1 || designOption === 4 || designOption === 8) ? 'text-black/50 hover:text-black' : 'text-white/50 hover:text-white'}`}
        aria-label="Rolar para baixo"
      >
        <ChevronDown className="w-6 h-6 sm:w-8 sm:h-8" />
      </button>
    </section>
  );
}
