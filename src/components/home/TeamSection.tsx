import diegoPazImage from "@/assets/team/diego-paz.png";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const teamMembers = [
  {
    name: "Paulo Vitor Cardoso",
    role: "Professor Responsável & Fisiologista",
    description:
      "Licenciatura e Bacharelado, Fisiologista (CREF-25576-G/SP). Coach formado pela Abracoaching com formação em PNL, Hipnose e Constelação Familiar.",
    image: "/logo.png", // Or maybe another placeholder image
  }
];

export function TeamSection() {
  return (
    <section className="py-24 bg-background">
      <div className="container">
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

        <div className="grid md:grid-cols-1 max-w-sm mx-auto gap-8">
          {teamMembers.map((member) => (
            <article
              key={member.name}
              className="group bg-muted rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div className="aspect-[4/5] overflow-hidden bg-black/5 flex items-center justify-center">
                 <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 text-center">
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
      </div>
    </section>
  );
}
