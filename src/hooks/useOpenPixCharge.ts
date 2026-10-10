import { logger } from "@/lib/logger";
import { useOpenPix } from "@openpix/react";
import { useState } from "react";

interface ChargeData {
  brCode: string;
  qrCodeImage?: string;
  correlationID: string;
  value: number;
}

interface CreateChargeParams {
  value: number; // valor em centavos
  correlationID: string;
  comment: string;
  customer?: {
    name: string;
    email: string;
    taxID: string; // CPF
  };
}

export const useOpenPixCharge = () => {
  const [charge, setCharge] = useState<ChargeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPay = (paidCharge: any) => {
    logger.info("[OpenPix] Pagamento confirmado!", paidCharge);
    setIsPaid(true);
  };

  const { chargeCreate } = useOpenPix({
    appID: import.meta.env.VITE_OPENPIX_APP_ID || "",
    onPay,
  });

  const createCharge = async (params: CreateChargeParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        correlationID: params.correlationID,
        value: params.value,
        comment: params.comment,
        customer: params.customer,
      };

      logger.info("[OpenPix] Criando cobrança...", payload);

      const result = await chargeCreate(payload);

      if (result.error) {
        logger.error("[OpenPix] Erro ao criar cobrança:", result.error);
        setError(result.error);
        return { error: result.error };
      }

      if (result.charge) {
        logger.info("[OpenPix] Cobrança criada com sucesso:", result.charge);
        setCharge({
          brCode: result.charge.brCode,
          qrCodeImage: result.charge.qrCodeImage,
          correlationID: result.charge.correlationID,
          value: result.charge.value,
        });
        return { charge: result.charge };
      }

      return { error: "Erro desconhecido ao criar cobrança" };
    } catch (err: unknown) {
      logger.error("[OpenPix] Exceção ao criar cobrança:", err);
      const errorMessage = err.message || "Erro ao criar cobrança";
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setCharge(null);
    setIsPaid(false);
    setError(null);
    setIsLoading(false);
  };

  return {
    charge,
    isLoading,
    isPaid,
    error,
    createCharge,
    setExternalCharge: (data: ChargeData) => setCharge(data),
    setPaid: (paid: boolean) => setIsPaid(paid),
    reset,
  };
};
