import { Link } from "react-router-dom";
import { SITE_CONFIG } from "@/config/site";
import { Instagram, Facebook, MapPin, Phone, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-black border-t border-neutral-900 text-white">
      <div className="container px-4 md:px-8 py-16 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 justify-between">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 max-w-sm">
            <h4 className="text-3xl font-heading tracking-widest uppercase mb-6 text-white drop-shadow-md">SUPERAÇÃO.</h4>
            <p className="text-sm text-neutral-400 leading-relaxed mb-6">
              Assessoria Esportiva especializada em corrida, ciclismo e triathlon. Mais de 20 anos transformando vidas através do esporte no Guarujá.
            </p>
            <div className="flex gap-4">
              <a
                href={`https://www.instagram.com/${SITE_CONFIG.contacts.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Siga-nos no Instagram"
                aria-label="Instagram"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-primary transition-colors hover:-translate-y-1 duration-300"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                title="Curta nossa página no Facebook"
                aria-label="Facebook"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-primary transition-colors hover:-translate-y-1 duration-300"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links Rápidos */}
          <div>
            <h5 className="text-xl font-heading mb-6 text-white uppercase tracking-widest">Links Rápidos</h5>
            <ul className="space-y-4">
              <li>
                <Link to="/" className="text-sm text-neutral-400 hover:text-white transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <Link to="/pedido-regata" className="text-sm text-orange-400 hover:text-orange-300 font-bold transition-colors flex items-center gap-1.5">
                  Nova Regata Oficial 🔥
                </Link>
              </li>
              <li>
                <Link to="/roupas" className="text-sm text-neutral-400 hover:text-white transition-colors">
                  Loja & Equipamentos
                </Link>
              </li>
              <li>
                <a href="/#historia" className="text-sm text-neutral-400 hover:text-white transition-colors">
                  Sobre Nós
                </a>
              </li>
              <li>
                <a href="/#servicos" className="text-sm text-neutral-400 hover:text-white transition-colors">
                  Planos e Serviços
                </a>
              </li>
            </ul>
          </div>

          {/* Entre em Contato */}
          <div>
            <h5 className="text-xl font-heading mb-6 text-white uppercase tracking-widest">Entre em Contato</h5>
            <ul className="space-y-4 text-sm text-neutral-400">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0" />
                <span>{SITE_CONFIG.contacts.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <a href={`https://wa.me/${SITE_CONFIG.contacts.whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  {SITE_CONFIG.contacts.whatsapp}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <a href={`mailto:${SITE_CONFIG.contacts.email}`} className="hover:text-white transition-colors">
                  {SITE_CONFIG.contacts.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-neutral-500">
            © {new Date().getFullYear()} {SITE_CONFIG.name}. Todos os direitos reservados.
          </p>
          <div className="flex gap-6 text-xs text-neutral-500">
            <Link to="/termos" className="hover:text-white transition-colors">Termos de Uso</Link>
            <Link to="/privacidade" className="hover:text-white transition-colors">Privacidade</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
