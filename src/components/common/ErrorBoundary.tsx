import { logger } from "@/lib/logger";
import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const isLazyLoadError =
      error.message?.includes("Failed to fetch") ||
      error.message?.includes("dynamically imported module");

    if (isLazyLoadError) {
      logger.error("Erro ao carregar módulo (lazy loading):", error.message);
      if (!import.meta.env.DEV) {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } else {
      logger.error("Uncaught error:", error, errorInfo);
    }
  }

  public render() {
    if (this.state.hasError) {
      const isLazyLoadError =
        this.state.error?.message?.includes("Failed to fetch") ||
        this.state.error?.message?.includes("dynamically imported module");

      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-background">
          <div className="bg-card border border-border p-8 rounded-lg shadow-lg max-w-md w-full">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>

            <h1 className="text-2xl font-black mb-2">
              {isLazyLoadError ? "Atualizando..." : "Ops! Algo deu errado."}
            </h1>
            <p className="text-muted-foreground mb-6">
              {isLazyLoadError
                ? "Detectamos uma atualização. Recarregando automaticamente..."
                : "Desculpe, encontramos um erro inesperado ao carregar esta página."}
            </p>

            {import.meta.env.DEV && this.state.error && (
              <div className="bg-muted p-4 rounded text-xs text-left overflow-auto mb-6 max-h-40">
                {this.state.error.message}
              </div>
            )}

            <Button onClick={() => window.location.reload()} className="w-full gap-2">
              <RefreshCw className="w-4 h-4" />
              Recarregar Página
            </Button>

            <Button
              variant="link"
              onClick={() => (window.location.href = "/")}
              className="mt-2 text-muted-foreground"
            >
              Voltar ao Início
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
