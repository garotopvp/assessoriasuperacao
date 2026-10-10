import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Cookie } from "lucide-react";
import { Link } from "react-router-dom";

const COOKIE_CONSENT_KEY = "boracorrer_cookie_consent";

export const CookieConsent = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Mostrar o banner após 2 segundos
      const timer = setTimeout(() => {
        setShow(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setShow(false);
  };

  const handleReject = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "rejected");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-6xl mx-auto bg-background border-2 border-border rounded-lg shadow-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <Cookie className="w-8 h-8 text-primary" />
          </div>

          <div className="flex-1">
            <h3 className="font-bold text-lg mb-2">🍪 Nós usamos cookies</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Utilizamos cookies e tecnologias semelhantes para melhorar sua experiência,
              personalizar conteúdo, analisar nosso tráfego e fornecer recursos de redes sociais. Ao
              continuar navegando, você concorda com nossa{" "}
              <Link to="/politica-privacidade" className="text-primary hover:underline">
                Política de Privacidade
              </Link>{" "}
              e{" "}
              <Link to="/termos-uso" className="text-primary hover:underline">
                Termos de Uso
              </Link>
              .
            </p>

            <div className="flex flex-wrap gap-3">
              <Button onClick={handleAccept} size="sm">
                Aceitar Todos
              </Button>
              <Button onClick={handleReject} variant="outline" size="sm">
                Apenas Essenciais
              </Button>
              <Link to="/politica-privacidade">
                <Button variant="ghost" size="sm">
                  Saiba Mais
                </Button>
              </Link>
            </div>
          </div>

          <button
            onClick={handleReject}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
