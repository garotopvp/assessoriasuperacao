import diegoPazImage from "@/assets/team/diego-paz.png";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { SITE_CONFIG } from "@/config/site";

interface TeamMember {
  name: string;
  role: string;
  description: string;
  image: string;
}

const teamMembers: TeamMember[] = [
  {
    name: "Caique Andrade",
    role: "Fundador & Head Coach",
    description:
      "Triatleta e treinador certificado com mais de 6 anos de experiência em assessoria de corrida. Especialista em periodização e performance.",
    image: "https://i.postimg.cc/5NL2p91f/Captura-de-tela-2026-01-22-161537.png",
  },
  {
    name: "Fernanda Tavares",
    role: "Treinadora dos Iniciantes",
    description:
      "Especialista em introduzir novos corredores ao esporte com segurança e motivação. Foco em técnica e evolução gradual.",
    image: "https://i.postimg.cc/9fvkx2cz/Captura-de-tela-2026-01-22-161945.png",
  },
  {
    name: "Diego Paz",
    role: "Treinador de Performance",
    description:
      "Professor focado em performance com +35 meias-maratonas e 2 maratonas completadas. Especialista em preparação para provas.",
    image: diegoPazImage,
  },
];

const teamGalleryImages = [
  "https://i.postimg.cc/Qx7ntCZZ/Captura-de-tela-2026-01-22-171439.png",
  "https://i.postimg.cc/rF4Yms2d/Captura-de-tela-2026-01-22-171449.png",
  "https://i.postimg.cc/6pNbGKB5/Captura-de-tela-2026-01-22-171455.png",
  "https://i.postimg.cc/nhtSQxnH/Captura-de-tela-2026-01-22-171507.png",
  "https://i.postimg.cc/Mp83jwz6/Captura-de-tela-2026-01-22-171517.png",
  "https://i.postimg.cc/13Z7NSy4/Captura-de-tela-2026-01-22-171524.png",
  "https://i.postimg.cc/fRhq0sM3/Captura-de-tela-2026-01-22-171532.png",
  "https://i.postimg.cc/vZd26yGg/Captura-de-tela-2026-01-22-171547.png",
];

export function SobreSection() {
  return (
    <section className="py-24 bg-background" id="sobre">
      <div className="container">
        {/* Team Header */}
        <div className="text-center mb-12">
          <span className="text-primary text-sm font-bold uppercase tracking-widest mb-4 block">
            Nossa Equipe
          </span>
          <h3 className="text-2xl sm:text-3xl font-black mb-4">EQUIPE TÉCNICA</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Profissionais qualificados e apaixonados por corrida, dedicados a extrair o melhor de
            cada atleta.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {teamMembers.map((member) => (
            <article
              key={member.name}
              className="group bg-muted rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <span className="text-primary text-xs font-bold uppercase tracking-wider">
                  {member.role}
                </span>
                <h4 className="text-xl font-bold mt-1 mb-2">{member.name}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {member.description}
                </p>
              </div>
            </article>
          ))}
        </div>

        {/* Team Gallery Carousel */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl sm:text-3xl font-black mb-4">GALERIA DA EQUIPE</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Momentos especiais do nosso time em treinos e competições.
            </p>
          </div>
          <div className="px-12">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              plugins={[
                Autoplay({
                  delay: 3000,
                  stopOnInteraction: false,
                  stopOnMouseEnter: true,
                }),
              ]}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {teamGalleryImages.map((image, index) => (
                  <CarouselItem key={index} className="pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                    <div className="h-64 md:h-72 lg:h-80 overflow-hidden rounded-xl bg-muted">
                      <img
                        src={image}
                        alt={`Equipe ${SITE_CONFIG.name} - Foto ${index + 1}`}
                        className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-0" />
              <CarouselNext className="right-0" />
            </Carousel>
          </div>
        </div>
      </div>
    </section>
  );
}
