import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TrainingLocationSection() {
  const address = "Av. Gen. Monteiro de Barros, 832 - Jardim Astúrias, Guarujá - SP";
  const embedUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3644.572599560716!2d-46.2675291!3d-24.0108652!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94d1fe6a919dccdb%3A0xb097145122ffc050!2sAv.%20Gen.%20Monteiro%20de%20Barros%2C%20832%20-%20Vila%20Luis%20Antonio%2C%20Guaruj%C3%A1%20-%20SP%2C%2011420-010!5e0!3m2!1spt-BR!2sbr!4v1773415326383!5m2!1spt-BR!2sbr";

  return (
    <section className="py-24 lg:py-32 bg-neutral-950 relative overflow-hidden" id="local">
      <div className="container px-4 md:px-8 mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* LADO ESQUERDO: CONTEÚDO */}
          <div className="space-y-8 animate-in fade-in slide-in-from-left duration-700">
            <div className="space-y-4">
              <span className="text-primary font-heading tracking-[0.2em] text-sm uppercase font-bold">
                ONDE TREINAMOS
              </span>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-heading text-white uppercase leading-tight tracking-tight">
                Nosso ponto de <br /><span className="text-primary">Superação</span>
              </h2>
              <p className="text-neutral-400 text-lg leading-relaxed pt-2 max-w-lg">
                Treine com a melhor vista e infraestrutura de Guarujá. Nossas aulas acontecem na orla da Praia das Astúrias, o cenário perfeito para sua evolução.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl space-y-4 transform transition-all duration-500 hover:border-primary/30">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                  <MapPin className="text-primary w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg">Localização</h4>
                  <p className="text-neutral-400">{address}</p>
                </div>
              </div>
              
              <Button asChild className="w-full bg-primary hover:bg-primary/90 text-white font-heading uppercase tracking-widest h-14 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]">
                <a 
                  href="https://maps.app.goo.gl/bWv6QRp3iZ3ZB6Dq7" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  <Navigation className="w-5 h-5" /> Abrir no Google Maps
                </a>
              </Button>
            </div>

            <div className="relative rounded-3xl overflow-hidden aspect-video border border-white/10 shadow-2xl group">
              <img 
                src="/images/local-treino.png" 
                alt="Treino na Praia" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent group-hover:via-black/10 transition-colors" />
              <div className="absolute bottom-6 left-6">
                <p className="text-white/70 font-heading uppercase tracking-[0.2em] text-[10px] md:text-xs mb-1">Ambiente de Treino</p>
                <p className="text-white text-lg md:text-xl font-bold font-heading uppercase tracking-tight">Praia das Astúrias, Guarujá</p>
              </div>
            </div>
          </div>

          {/* LADO DIREITO: MAPA */}
          <div className="relative h-[400px] lg:h-[700px] w-full rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-right duration-1000">
            <iframe
              src={embedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="grayscale brightness-90 contrast-110 transition-all duration-700 hover:grayscale-0"
              title="Localização do treino"
            />
            {/* Overlay para dar acabamento */}
            <div className="absolute inset-0 pointer-events-none border-[1px] border-white/10 rounded-3xl" />
          </div>

        </div>
      </div>
      
      {/* Background Decorativo */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-brand-blue-deep/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />
    </section>
  );
}
