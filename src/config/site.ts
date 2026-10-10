// Forcing site update
/**
 * Central configuration for the site.
 * Use this file to customize the branding, contact info, and other site-wide settings.
 * This helps in white-labeling the application for different clients.
 */

export const SITE_CONFIG = {
  name: "Superação Assessoria Esportiva Guarujá",
  shortName: "Superação",
  description: "Treinamento Personalizado, Treinamento em Grupo focando na Qualidade de Vida, Condicionamento Físico e Performance.",
  
  // Contact Information
  contacts: {
    whatsapp: "5513974098493", // Formato: código país + DDD + número (sem espaços ou traços)
    email: "prof.paulovitor@hotmail.com",
    instagram: "@superacaoassessoria",
    address: "Av. Gen. Monteiro de Barros, 832 - Jardim Astúrias, Guarujá - SP",
  },

  // Visual Assets
  branding: {
    logo: "/logo.png",
    favicon: "/favicon.ico",
    primaryColor: "#F97316", // Orange
    secondaryColor: "#0A0A0A", // Obsidian
  },

  // Social/SEO
  seo: {
    titleTemplate: "%s | Superação Assessoria",
    defaultTitle: "Superação Assessoria Esportiva Guarujá",
    twitterHandle: "@superacaoassessoria",
    siteUrl: "https://www.superacaoassessoriaesportivaguaruja.com",
  },

  // Features Flag (Optional - to enable/disable specific modules)
  features: {
    shop: true,
    knowledgeBase: true,
    events: true,
    consulting: true,
  }
};

export type SiteConfig = typeof SITE_CONFIG;
