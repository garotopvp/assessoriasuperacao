import { lazy, ComponentType } from "react";

interface ImportFunction {
  (): Promise<{ default: ComponentType<any> }>;
}

export function lazyWithRetry(componentImport: ImportFunction) {
  return lazy(async () => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000;

    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        return await componentImport();
      } catch (error) {
        const isLastAttempt = i === MAX_RETRIES - 1;
        const isChunkError =
          error instanceof Error &&
          (error.message.includes("Failed to fetch") ||
            error.message.includes("dynamically imported module"));

        if (isChunkError && !isLastAttempt) {
          console.warn(
            `[lazyWithRetry] Tentativa ${i + 1}/${MAX_RETRIES} falhou. Tentando novamente...`
          );
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
          continue;
        }

        throw error;
      }
    }

    throw new Error("[lazyWithRetry] Falhou após múltiplas tentativas");
  });
}
