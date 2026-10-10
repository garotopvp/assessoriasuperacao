import { OptimizedImage } from "@/components/common/OptimizedImage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Copy, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface OpenPixModalProps {
  open: boolean;
  onClose: () => void;
  brCode?: string;
  qrCodeImage?: string;
  value: number;
  isPaid?: boolean;
  isLoading?: boolean;
  orderId?: string | null;
  onManualCheck?: () => Promise<void>;
  pollingCount?: number;
  maxPollingAttempts?: number;
}

export function OpenPixModal({
  open,
  onClose,
  brCode,
  qrCodeImage,
  value,
  isPaid = false,
  isLoading = false,
  orderId,
  onManualCheck,
  pollingCount = 0,
  maxPollingAttempts = 60,
}: OpenPixModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!brCode) return;

    try {
      await navigator.clipboard.writeText(brCode);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Erro ao copiar código");
    }
  };

  const formatValue = (cents: number) => {
    return (cents / 100).toFixed(2).replace(".", ",");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isPaid ? "✅ Pagamento Confirmado!" : "Pagar com PIX"}</DialogTitle>
          <DialogDescription>
            {isPaid
              ? "Seu pagamento foi processado com sucesso!"
              : `Escaneie o QR Code ou copie o código PIX`}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
          </div>
        ) : isPaid ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
            <div className="text-center">
              <p className="text-lg font-semibold">Pagamento Recebido!</p>
              <p className="text-sm text-muted-foreground mt-2">
                Seu acesso foi liberado automaticamente.
              </p>
            </div>
            <Button onClick={onClose} className="mt-4">
              Fechar
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Valor */}
            <div className="text-center py-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Valor a pagar</p>
              <p className="text-3xl font-bold">R$ {formatValue(value)}</p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center bg-white p-6 rounded-lg border-2 border-primary/10">
              {qrCodeImage ? (
                <OptimizedImage src={qrCodeImage} alt="QR Code PIX" className="w-64 h-64" />
              ) : brCode ? (
                <QRCodeSVG
                  value={brCode}
                  size={256}
                  level="M"
                  includeMargin={false}
                  className="rounded"
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center bg-muted rounded">
                  <p className="text-sm text-muted-foreground">Carregando QR Code...</p>
                </div>
              )}
            </div>

            {/* Instruções */}
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="font-bold text-primary">1.</span>
                <p>
                  Abra o app do seu banco e escolha pagar com <strong>PIX</strong>
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-primary">2.</span>
                <p>
                  Escaneie o <strong>QR Code</strong> ou copie o código abaixo
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-primary">3.</span>
                <p>
                  Confirme o pagamento. A confirmação é <strong>instantânea</strong>!
                </p>
              </div>
            </div>

            {/* Código PIX Copiável */}
            {brCode && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground text-center">Ou copie o código PIX:</p>
                <div className="flex gap-2">
                  <div className="flex-1 bg-muted p-3 rounded text-xs font-mono break-all">
                    {brCode.substring(0, 50)}...
                  </div>
                  <Button onClick={handleCopy} variant="outline" size="icon" className="shrink-0">
                    {copied ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Aviso */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <p className="text-xs text-center">
                ⚡ O pagamento é confirmado automaticamente assim que processado pelo banco.
                {/* Botão de Verificação Manual */}
                {orderId && onManualCheck && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>
                        Verificação {pollingCount}/{maxPollingAttempts}
                      </span>
                    </div>
                    <Button onClick={onManualCheck} variant="outline" className="w-full" size="sm">
                      ✓ Já paguei, verificar agora
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Se já realizou o pagamento, clique acima para verificar manualmente
                    </p>
                  </div>
                )}
                <br />
                Não feche esta janela até confirmar o pagamento.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
