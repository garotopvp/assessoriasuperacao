import { logger } from "@/lib/logger";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { plans } from "@/data/plans";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface ImportedUser {
  id: string;
  name: string;
  email: string;
  status: "pending" | "processing" | "success" | "error";
  log?: string;
}

export function BulkImportInvite() {
  const [csvContent, setCsvContent] = useState("");
  const [importedUsers, setImportedUsers] = useState<ImportedUser[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>("plano_teste");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvContent(text);
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/);
    const users: ImportedUser[] = [];

    lines.forEach((line, index) => {
      if (!line.trim()) return;
      // Tenta separar por vírgula ou ponto e vírgula
      const parts = line.split(/[,;]/);
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const email = parts[1].trim();
        if (email.includes("@")) {
          users.push({
            id: `row-${index}`,
            name,
            email,
            status: "pending",
          });
        }
      }
    });

    if (users.length === 0) {
      toast.error("Nenhum usuário válido encontrado no CSV. Use o formato: Nome, Email");
    } else {
      toast.success(`${users.length} usuários carregados.`);
    }
    setImportedUsers(users);
  };

  const processImport = async () => {
    if (importedUsers.length === 0) return;
    setIsProcessing(true);
    setProgress(0);

    const plan = plans.find((p) => p.id === selectedPlan);
    const amount = plan ? plan.preco : 10; // Default fallback
    const planName = plan ? `Plano ${plan.nome}` : "Assinatura";

    let completed = 0;

    for (let i = 0; i < importedUsers.length; i++) {
      const user = importedUsers[i];
      if (user.status === "success") {
        completed++;
        continue;
      }

      setImportedUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: "processing" } : u))
      );

      try {
        // 1. Criar Assinatura
        logger.info(`Processando ${user.email}...`);

        const { data: subData, error: subError } = await supabase.functions.invoke(
          "create-subscription",
          {
            body: {
              studentName: user.name,
              studentEmail: user.email,
              planId: selectedPlan,
              planName,
              amount: amount,
            },
          }
        );

        if (subError) throw new Error(subError.message || "Erro ao criar assinatura");
        if (!subData?.paymentLink) throw new Error("Link de pagamento não gerado");

        const paymentLink = subData.paymentLink;

        // 2. Enviar Email
        const { error: emailError } = await supabase.functions.invoke("send-subscription-email", {
          body: {
            type: "payment_invite",
            email: user.email,
            customerName: user.name,
            planName: plan?.nome || planName,
            amount: amount,
            paymentLink: paymentLink,
          },
        });

        if (emailError) throw new Error("Assinatura criada, mas erro ao enviar email");

        setImportedUsers((prev) =>
          prev.map((u) =>
            u.id === user.id ? { ...u, status: "success", log: "Convite enviado!" } : u
          )
        );
      } catch (error: unknown) {
        logger.error(`Erro para ${user.email}:`, error);
        setImportedUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, status: "error", log: error.message } : u))
        );
      }

      completed++;
      setProgress(Math.round((completed / importedUsers.length) * 100));

      // Delay de segurança para evitar bloqueio do Resend (máx 2 req/seg)
      // Esperando 1.2 segundos para garantir
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }

    setIsProcessing(false);
    toast.success("Processamento finalizado!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black">IMPORTAÇÃO EM MASSA & CONVITES</h2>
        <p className="text-sm text-muted-foreground">
          Importe uma lista de alunos, gere links de pagamento e envie convites por email
          automaticamente.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>1. Configuração</CardTitle>
            <CardDescription>Carregue o arquivo e escolha o plano</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Arquivo CSV / Lista (Nome, Email)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  disabled={isProcessing}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Formato esperado: Nome Completo, email@exemplo.com
              </p>
            </div>

            <div className="space-y-2">
              <Label>Plano para os Convites</Label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan} disabled={isProcessing}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.nome} - R$ {plan.precoMensal}/mês
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={processImport}
              disabled={importedUsers.length === 0 || isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" /> Gerar Links e Enviar Convites
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status do Processamento</CardTitle>
            <CardDescription>
              {importedUsers.length > 0
                ? `${importedUsers.length} usuários na lista`
                : "Aguardando importação..."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {importedUsers.length > 0 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progresso</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>

                <div className="rounded-md border h-[250px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importedUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell className="text-right">
                            {user.status === "pending" && <Badge variant="outline">Pendente</Badge>}
                            {user.status === "processing" && (
                              <Badge variant="secondary">
                                <Loader2 className="h-3 w-3 animate-spin" />
                              </Badge>
                            )}
                            {user.status === "success" && (
                              <div className="flex justify-end">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              </div>
                            )}
                            {user.status === "error" && (
                              <div className="flex justify-end" title={user.log}>
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
