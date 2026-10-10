import { MessageCircle } from "lucide-react";
import { SITE_CONFIG } from "@/config/site";

export function WhatsAppButton() {
  const phoneNumber = SITE_CONFIG.contacts.whatsapp;
  const message = encodeURIComponent(`Olá! Gostaria de tirar uma dúvida sobre o ${SITE_CONFIG.name}.`);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] hover:bg-[#20BD5A] rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110"
      aria-label="Contato via WhatsApp"
    >
      <div className="absolute right-16 top-1/2 -translate-y-1/2 mr-2 px-4 py-2 bg-white text-black text-sm font-bold rounded-xl shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none before:content-[''] before:absolute before:top-1/2 before:-translate-y-1/2 before:-right-1 border border-neutral-200">
        Fale com um treinador
      </div>
      <MessageCircle className="w-7 h-7 text-white fill-white relative z-10" />
    </a>
  );
}
