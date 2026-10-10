import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SITE_CONFIG } from "@/config/site";

export function CTASection() {
  return (
    <section className="py-24 bg-secondary text-secondary-foreground">
      <div className="container text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4">
          PRONTO PARA TRANSFORMAR?
        </h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
          Faça uma <strong>Avaliação Antropométrica Grátis</strong> e agende uma aula experimental com a nossa equipe especializada.
        </p>
        <Button asChild size="lg" className="text-base px-10">
          <a href={`https://wa.me/${SITE_CONFIG.contacts.whatsapp}`} target="_blank" rel="noopener noreferrer">
            AGENDAR AULA BÔNUS
          </a>
        </Button>
      </div>
    </section>
  );
}
