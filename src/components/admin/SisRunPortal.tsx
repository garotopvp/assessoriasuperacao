import { useState } from "react";
import { ExternalLink, RefreshCw, Maximize2, Minimize2, AlertTriangle, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

const SISRUN_URL = "https://appsisrun.com.br/sisrun/login.xhtml";
const PINK = "#FF007F";
const PINK_DARK = "#cc005f";

export function SisRunPortal() {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [key, setKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleRefresh = () => {
    setIframeLoaded(false);
    setIframeError(false);
    setKey((k) => k + 1);
  };

  const handleIframeLoad = () => setIframeLoaded(true);
  const handleIframeError = () => { setIframeError(true); setIframeLoaded(true); };
  const openInNewTab = () => window.open(SISRUN_URL, "_blank", "noopener,noreferrer");

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-white",
        isFullscreen && "fixed inset-0 z-50"
      )}
    >
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between gap-3 px-4 py-2 shrink-0 bg-white border-b border-slate-200">
        {/* Left: icon + URL */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `linear-gradient(135deg, ${PINK}, ${PINK_DARK})`, boxShadow: `0 4px 10px rgba(255,0,127,0.3)` }}
          >
            <Monitor className="h-4 w-4 text-white" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="h-1.5 w-1.5 rounded-full shrink-0"
              style={{
                background: iframeLoaded && !iframeError ? "#22c55e" : "#f59e0b",
                boxShadow: iframeLoaded && !iframeError ? "0 0 6px #22c55e" : "0 0 6px #f59e0b",
              }}
            />
            <span className="font-mono text-xs truncate hidden sm:block text-slate-400">
              {SISRUN_URL}
            </span>
            <span className="text-xs font-semibold text-slate-700 sm:hidden">Portal SisRUN</span>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1 shrink-0">
          <IconBtn onClick={handleRefresh} title="Recarregar">
            <RefreshCw className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn onClick={() => setIsFullscreen((v) => !v)} title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}>
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </IconBtn>
          <button
            onClick={openInNewTab}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all"
            style={{ background: `linear-gradient(135deg, ${PINK}, ${PINK_DARK})`, boxShadow: `0 4px 10px rgba(255,0,127,0.25)` }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = `0 4px 18px rgba(255,0,127,0.45)`)}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = `0 4px 10px rgba(255,0,127,0.25)`)}
          >
            <ExternalLink className="h-3 w-3" />
            <span className="hidden sm:inline">Nova Aba</span>
          </button>
        </div>
      </div>

      {/* ── iframe area ── */}
      <div className="relative flex-1 overflow-hidden bg-slate-100">
        {/* Loading */}
        {!iframeLoaded && !iframeError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 gap-4 bg-slate-50">
            <div
              className="h-10 w-10 rounded-full border-4 animate-spin"
              style={{ borderColor: "rgba(255,0,127,0.15)", borderTopColor: PINK }}
            />
            <p className="text-sm animate-pulse text-slate-400">
              Carregando SisRUN...
            </p>
          </div>
        )}

        {/* Error / blocked */}
        {iframeError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 gap-6 p-8 bg-slate-50">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center bg-amber-50 border border-amber-100">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
            <div className="text-center max-w-md">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Site Bloqueou o Acesso Incorporado</h3>
              <p className="text-sm text-slate-500 mb-1">
                O SisRUN não permite ser exibido dentro de outros sites.
              </p>
              <p className="text-xs text-slate-400">
                Use o botão abaixo para acessar em nova aba.
              </p>
            </div>
            <button
              onClick={openInNewTab}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: `linear-gradient(135deg, ${PINK}, ${PINK_DARK})`, boxShadow: `0 4px 20px rgba(255,0,127,0.35)` }}
            >
              <ExternalLink className="h-4 w-4" />
              Abrir SisRUN em Nova Aba
            </button>
          </div>
        )}

        <iframe
          key={key}
          src={SISRUN_URL}
          title="SisRUN Portal"
          className="w-full h-full border-0"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          allow="fullscreen"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
      </div>
    </div>
  );
}

// Small reusable icon button
function IconBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="h-7 w-7 flex items-center justify-center rounded-lg transition-all text-slate-400 hover:text-slate-700 hover:bg-slate-100"
    >
      {children}
    </button>
  );
}
