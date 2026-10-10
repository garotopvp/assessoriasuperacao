/**
 * Configuração do Sentry para monitoramento de erros
 * Docs: https://docs.sentry.io/platforms/javascript/guides/react/
 */

import { logger } from "@/lib/logger";
import * as Sentry from "@sentry/react";

// URL do seu projeto Sentry (obtenha em https://sentry.io)
// IMPORTANTE: Configure isso no dashboard do Sentry e adicione aqui
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

export const initSentry = () => {
  // Só inicializar em produção ou se DSN estiver configurado
  if (!SENTRY_DSN) {
    logger.warn("⚠️ Sentry DSN não configurado. Monitoramento desabilitado.");
    logger.warn("Configure VITE_SENTRY_DSN no arquivo .env.local");
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,

    // Ambiente (production, staging, development)
    environment: import.meta.env.MODE,

    // Habilitar apenas em produção
    enabled: import.meta.env.PROD,

    // Performance Monitoring
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true, // Ocultar texto sensível
        blockAllMedia: true, // Bloquear mídia
      }),
    ],

    // Sample rate para performance monitoring (10% = 0.1)
    tracesSampleRate: 0.1,

    // Sample rate para session replay (10% = 0.1)
    // Aumenta para 100% em caso de erro
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Filtrar erros conhecidos/não importantes
    beforeSend(event, hint) {
      // Ignorar erros de extensões do navegador
      if (
        event.exception?.values?.[0]?.stacktrace?.frames?.some(
          (frame) =>
            frame.filename?.includes("chrome-extension://") ||
            frame.filename?.includes("moz-extension://")
        )
      ) {
        return null;
      }

      // Ignorar erros de rede comuns
      const error = hint.originalException;
      if (error instanceof Error) {
        if (error.message.includes("Network Error") || error.message.includes("Failed to fetch")) {
          // Registrar, mas com severidade baixa
          event.level = "warning";
        }
      }

      return event;
    },

    // Filtrar breadcrumbs (logs de navegação)
    beforeBreadcrumb(breadcrumb) {
      // Não registrar cliques em elementos sensíveis
      if (breadcrumb.category === "ui.click") {
        const target = breadcrumb.message;
        if (target?.includes("password") || target?.includes("cpf")) {
          return null;
        }
      }
      return breadcrumb;
    },
  });

  logger.info("✅ Sentry inicializado com sucesso");
};

/**
 * Capturar erro manualmente
 */
export const captureError = (error: Error, context?: Record<string, any>) => {
  if (!SENTRY_DSN) return;

  Sentry.captureException(error, {
    extra: context,
  });
};

/**
 * Capturar mensagem manualmente
 */
export const captureMessage = (message: string, level: Sentry.SeverityLevel = "info") => {
  if (!SENTRY_DSN) return;

  Sentry.captureMessage(message, level);
};

/**
 * Definir contexto do usuário
 */
export const setUserContext = (user: { id: string; email?: string; name?: string }) => {
  if (!SENTRY_DSN) return;

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
  });
};

/**
 * Limpar contexto do usuário (logout)
 */
export const clearUserContext = () => {
  if (!SENTRY_DSN) return;

  Sentry.setUser(null);
};

/**
 * Adicionar tag customizada
 */
export const addTag = (key: string, value: string) => {
  if (!SENTRY_DSN) return;

  Sentry.setTag(key, value);
};

/**
 * Adicionar contexto extra
 */
export const addContext = (name: string, context: Record<string, any>) => {
  if (!SENTRY_DSN) return;

  Sentry.setContext(name, context);
};
