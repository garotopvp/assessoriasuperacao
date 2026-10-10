import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

export function TeamCTASection() {
  return (
    <section className="py-24 bg-muted">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4">CONHEÇA NOSSA EQUIPE</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Descubra quem são os profissionais por trás do Superação Assessoria. Nossa história, nossos
            treinadores e a paixão que nos move.
          </p>
          <Button asChild size="lg" variant="outline" className="text-base px-8">
            <Link to="/sobre">VER EQUIPE TÉCNICA</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
