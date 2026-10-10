import { OptimizedImage } from "@/components/common/OptimizedImage";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Shield, ShieldCheck, Key, Copy, Check } from "lucide-react";
import { Logger } from "@/lib/logger";
import { captureError } from "@/lib/sentry";
import QRCode from "qrcode";

const logger = new Logger("TwoFactorAuth");

interface TwoFactorSetupProps {
  userId?: string;
}

export function TwoFactorSetup({ userId }: TwoFactorSetupProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"initial" | "setup" | "verify">("initial");
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [factorId, setFactorId] = useState<string>("");

  // Verificar se 2FA já está habilitado
  useEffect(() => {
    checkMFAStatus();
  }, [userId]);

  const checkMFAStatus = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Verificar fatores de autenticação
      const { data: factors } = await supabase.auth.mfa.listFactors();

      if (factors && factors.totp && factors.totp.length > 0) {
        const verifiedFactor = factors.totp.find((f) => f.status === "verified");
        setIsEnabled(!!verifiedFactor);
        logger.info("Status 2FA verificado", { enabled: !!verifiedFactor });
      }
    } catch (error: unknown) {
      logger.error("Erro ao verificar status 2FA", { error: error.message });
      captureError(error);
    }
  };

  const handleEnroll = async () => {
    setIsLoading(true);
    try {
      logger.info("Iniciando enrollment 2FA");

      // Iniciar enrollment
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Superação Assessoria",
      });

      if (error) throw error;

      if (!data) {
        throw new Error("Dados de enrollment não retornados");
      }

      logger.info("Enrollment iniciado com sucesso", { factorId: data.id });

      setFactorId(data.id);
      setSecret(data.totp.secret);

      // Gerar QR Code
      const otpauthUrl = data.totp.uri;
      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
      setQrCode(qrCodeDataUrl);

      setStep("setup");
      toast.success("Configuração iniciada! Escaneie o QR Code com seu app.");
    } catch (error: unknown) {
      logger.error("Erro no enrollment", { error: error.message });
      captureError(error);
      toast.error(error.message || "Erro ao iniciar configuração");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Digite um código válido de 6 dígitos");
      return;
    }

    setIsLoading(true);
    try {
      logger.info("Verificando código 2FA");

      const { data, error } = await supabase.auth.mfa.challenge({
        factorId: factorId,
      });

      if (error) throw error;

      const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
        factorId: factorId,
        challengeId: data.id,
        code: verificationCode,
      });

      if (verifyError) throw verifyError;

      logger.info("2FA ativado com sucesso");
      toast.success("Autenticação de dois fatores ativada com sucesso!");
      setIsEnabled(true);
      setStep("initial");
      setVerificationCode("");
    } catch (error: unknown) {
      logger.error("Erro na verificação 2FA", { error: error.message });
      captureError(error);
      toast.error(error.message || "Código inválido. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!confirm("Tem certeza que deseja desativar a autenticação de dois fatores?")) {
      return;
    }

    setIsLoading(true);
    try {
      logger.info("Desativando 2FA");

      const { data: factors } = await supabase.auth.mfa.listFactors();

      if (factors?.totp && factors.totp.length > 0) {
        const factor = factors.totp[0];
        const { error } = await supabase.auth.mfa.unenroll({
          factorId: factor.id,
        });

        if (error) throw error;

        logger.info("2FA desativado com sucesso");
        toast.success("Autenticação de dois fatores desativada");
        setIsEnabled(false);
        setStep("initial");
      }
    } catch (error: unknown) {
      logger.error("Erro ao desativar 2FA", { error: error.message });
      captureError(error);
      toast.error(error.message || "Erro ao desativar 2FA");
    } finally {
      setIsLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    toast.success("Chave copiada!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Tela inicial
  if (step === "initial") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            {isEnabled ? (
              <ShieldCheck className="w-5 h-5 text-green-600" />
            ) : (
              <Shield className="w-5 h-5 text-muted-foreground" />
            )}
            <CardTitle>Autenticação de Dois Fatores (2FA)</CardTitle>
          </div>
          <CardDescription>
            {isEnabled
              ? "Sua conta está protegida com autenticação de dois fatores"
              : "Adicione uma camada extra de segurança à sua conta"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEnabled ? (
            <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertDescription>
                A autenticação de dois fatores está <strong>ativada</strong>. Você precisará do
                código do seu aplicativo autenticador para fazer login.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Com 2FA ativado, você precisará de um código temporário do seu aplicativo
                autenticador (como Google Authenticator ou Authy) toda vez que fizer login.
              </p>
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Recomendado:</strong> Instale um aplicativo autenticador antes de
                  continuar:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Google Authenticator</li>
                    <li>Microsoft Authenticator</li>
                    <li>Authy</li>
                    <li>1Password</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {isEnabled ? (
            <Button variant="destructive" onClick={handleDisable} disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Desativar 2FA
            </Button>
          ) : (
            <Button onClick={handleEnroll} disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Ativar 2FA
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }

  // Tela de configuração (escanear QR Code)
  if (step === "setup") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configurar Autenticação de Dois Fatores</CardTitle>
          <CardDescription>Escaneie o QR Code com seu aplicativo autenticador</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              {qrCode && (
                <OptimizedImage
                  src={qrCode}
                  alt="QR Code para 2FA"
                  className="w-64 h-64 border-2 border-border rounded-lg"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Ou digite a chave manualmente:</Label>
              <div className="flex gap-2">
                <Input value={secret} readOnly className="font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={copySecret}>
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <Alert>
              <Key className="h-4 w-4" />
              <AlertDescription>
                <strong>Importante:</strong> Guarde esta chave em um local seguro. Você precisará
                dela se perder acesso ao seu aplicativo autenticador.
              </AlertDescription>
            </Alert>
          </div>

          <Button onClick={() => setStep("verify")} className="w-full">
            Continuar para Verificação
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Tela de verificação
  return (
    <Card>
      <CardHeader>
        <CardTitle>Verificar Código</CardTitle>
        <CardDescription>
          Digite o código de 6 dígitos do seu aplicativo autenticador
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="code">Código de Verificação</Label>
          <Input
            id="code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="000000"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
            className="text-center text-2xl tracking-widest font-mono"
          />
        </div>

        <Button
          onClick={handleVerify}
          disabled={isLoading || verificationCode.length !== 6}
          className="w-full"
        >
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Verificar e Ativar 2FA
        </Button>

        <Button variant="ghost" onClick={() => setStep("setup")} className="w-full">
          Voltar
        </Button>
      </CardContent>
    </Card>
  );
}
