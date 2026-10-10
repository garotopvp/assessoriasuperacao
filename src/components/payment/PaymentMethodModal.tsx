import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, QrCode } from "lucide-react";

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMethod: (method: "abacate_card" | "pix_abacate") => void;
  loading: boolean;
}

export function PaymentMethodModal({
  isOpen,
  onClose,
  onSelectMethod,
  loading,
}: PaymentMethodModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escolha a forma de pagamento</DialogTitle>
          <DialogDescription>Selecione como deseja pagar sua assinatura.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button
            variant="outline"
            className="h-auto p-4 flex items-center justify-start gap-4 hover:border-primary hover:bg-primary/5 hover:text-foreground transition-all group"
            onClick={() => onSelectMethod("abacate_card")}
            disabled={loading}
          >
            <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
              <CreditCard className="w-6 h-6 text-black" />
            </div>
            <div className="text-left">
              <span className="block font-bold">Cartão de Crédito</span>
              <span className="text-xs text-muted-foreground group-hover:text-muted-foreground/80">
                Pagamento via Abacate Pay
              </span>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto p-4 flex items-center justify-start gap-4 hover:border-primary hover:bg-primary/5 hover:text-foreground transition-all group"
            onClick={() => onSelectMethod("pix_abacate")}
            disabled={loading}
          >
            <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
              <QrCode className="w-6 h-6 text-black" />
            </div>
            <div className="text-left">
              <span className="block font-bold">PIX</span>
              <span className="text-xs text-muted-foreground group-hover:text-muted-foreground/80">
                Aprovação imediata (Abacate Pay)
              </span>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
