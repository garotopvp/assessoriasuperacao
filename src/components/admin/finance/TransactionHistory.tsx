import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatDate, formatName } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Laptop,
  ShoppingBag,
  CreditCard,
  XCircle,
  Search,
  Calendar,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Activity,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Plus, Trash, Pencil, Menu, ArrowRight, Wallet, AlignLeft, Tag, Download } from "lucide-react";
import { toast } from "sonner";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TransactionItem = {
  id: string;
  date: Date;
  customerName: string;
  customerEmail: string;
  amount: number;
  status: string;
  category: string;
  paymentMethod: string;
  description: string;
  type: "order" | "subscription";
  bankAccount?: string;
  receipt_url?: string;
  sourceDB?: string;
};

// Retorna quantos meses dura o ciclo de cada plano
const getPlanPeriodMonths = (planName: string): number => {
  const name = (planName || "").toLowerCase();
  if (name.includes("trimestral")) return 3;
  if (name.includes("semestral")) return 6;
  if (name.includes("anual")) return 12;
  return 1;
};

export function TransactionHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "order" | "subscription">("all");
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedDay, setSelectedDay] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState("all");
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [selectedDateFilter, setSelectedDateFilter] = useState("realized");
  const [importAccount, setImportAccount] = useState("rinaldopedroso");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState<any>(null);
  const queryClient = useQueryClient();
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [formData, setFormData] = useState({
    description: "",
    amount: "0",
    received_at: format(new Date(), "yyyy-MM-dd"),
    category: "Assinatura",
    type: "variable",
    status: "received",
    customer_name: "",
    customer_email: "",
    subscription_id: "",
    plan_name: "",
    bank_account: "rinaldopedroso",
    receipt_url: "",
  });

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["finance-transactions"],
    queryFn: async () => {
      // 1. Buscar Pedidos (Loja, Bonés, Vendas Avulsas)
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(
          "id, created_at, customer_name, customer_email, total, status, items, payment_method, payment_provider"
        )
        .order("created_at", { ascending: false })
        .limit(1000);

      if (ordersError) console.error("Error fetching orders:", ordersError);

      // 2. Buscar Assinaturas (Recorrência)
      const { data: subsData, error: subsError } = await supabase
        .from("recurring_subscriptions")
        .select(
          "id, started_at, next_billing_date, student_name, student_email, amount, status, plan_name"
        )
        .order("started_at", { ascending: false })
        .limit(1000);

      if (subsError) console.error("Error fetching subscriptions:", subsError);

      // 3. Buscar Receitas Manuais/Importadas
      const { data: revData, error: revError } = await supabase
        .from("financial_revenue")
        .select("*")
        .order("received_at", { ascending: false });

      if (revError) console.error("Error fetching financial revenue:", revError);

      const combined: TransactionItem[] = [];

      // Mapear Pedidos
      if (ordersData) {
        ordersData.forEach((ord: any) => {
          let itemsDesc = "";
          if (ord.items && Array.isArray(ord.items)) {
            itemsDesc = ord.items
              .map((i: any) => `${i.quantity}x ${i.name || i.product_name}`)
              .join(", ");
          }

          let payMethod = ord.payment_method || ord.payment_provider || "Desconhecido";
          if (payMethod.toLowerCase() === "card") payMethod = "Cartão de Crédito";
          if (payMethod.toLowerCase() === "pix") payMethod = "PIX";

          combined.push({
            id: ord.id,
            date: new Date(ord.created_at),
            customerName: ord.customer_name || "Não informado",
            customerEmail: ord.customer_email || "Não informado",
            amount: Number(ord.total) || 0,
            status: ord.status,
            category: "Produto/Avulso",
            paymentMethod: payMethod,
            description: itemsDesc || "Itens da Loja",
            type: "order",
          });
        });
      }

      // Mapear Assinaturas (Somente Previsão)
      if (subsData) {
        subsData.forEach((sub: any) => {
          // Adicionamos apenas como "Previsto" (próxima cobrança)
          // Ignoramos valor 0 (parcerias) para não poluir o financeiro
          if (
            sub.next_billing_date &&
            sub.amount > 0 &&
            (sub.status === "active" ||
              sub.status === "past_due" ||
              sub.status === "waiting_details")
          ) {
            combined.push({
              id: `${sub.id}-next`,
              date: new Date(sub.next_billing_date),
              customerName: sub.student_name || "Não informado",
              customerEmail: sub.student_email || "Não informado",
              amount: Number(sub.amount) || 0,
              status: sub.status === "past_due" ? "pending" : "pending_future", // Identifica se está vencido ou é futuro
              category: "Assinatura (Previsto)",
              paymentMethod: "Recorrência Automática",
              description: `Plano ${sub.plan_name || "Padrão"}`,
              type: "subscription",
            });
          }
        });
      }

      // Mapear Receitas Manuais/Importadas
      if (revData) {
        revData.forEach((rev: any) => {
          const revDateStr = rev.received_at.split('T')[0];
          const [y, m, d] = revDateStr.split('-');
          const safeRevDate = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);

          combined.push({
            id: rev.id,
            date: safeRevDate,
            customerName: rev.customer_name || "Não informado",
            customerEmail: rev.customer_email || "---",
            amount: Number(rev.amount),
            status: rev.status || "received",
            category: rev.category || "Outros",
            paymentMethod: rev.source || "Geral",
            description: rev.description,
            type: "order", // Tratamos como pedido para visualização
            bankAccount: rev.bank_account || "boracorrerclub",
            receipt_url: rev.receipt_url,
            sourceDB: "financial_revenue",
          });
        });
      }

      // Ordenar do mais recente para o mais antigo
      combined.sort((a, b) => b.date.getTime() - a.date.getTime());

      return combined;
    },
  });

  const createRevenueMutation = useMutation({
    mutationFn: async (payload: { revenueData: any; file?: File | null }) => {
      const { revenueData, file } = payload;
      let finalReceiptUrl = revenueData.receipt_url;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('receipts')
          .getPublicUrl(fileName);
          
        finalReceiptUrl = publicUrl;
      }
      
      const newData = { ...revenueData, receipt_url: finalReceiptUrl };
      const { subscription_id, plan_name, ...insertData } = newData;

      const { data, error } = await supabase
        .from("financial_revenue")
        .insert([
          {
            description: newData.description,
            amount: Number(newData.amount),
            received_at: newData.received_at,
            category: newData.category,
            type: newData.type,
            status: newData.status || "received",
            customer_name: newData.customer_name,
            customer_email: newData.customer_email,
            bank_account: newData.bank_account,
            receipt_url: newData.receipt_url,
            source: "manual",
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Se foi vinculado a um aluno, dar baixa na fatura/assinatura
      if (newData.subscription_id) {
        // Marcar fatura como paga
        const { data: inv } = await supabase
          .from("subscription_invoices")
          .select("id, due_date")
          .eq("subscription_id", newData.subscription_id)
          .eq("status", "pending")
          .order("due_date", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (inv) {
          await supabase
            .from("subscription_invoices")
            .update({ status: "paid", paid_at: new Date().toISOString() })
            .eq("id", inv.id);

          // Calcular próxima cobrança baseada no ciclo do plano selecionado
          const periodMonths = getPlanPeriodMonths(newData.plan_name || "");
          const nextDate = new Date(inv.due_date);
          nextDate.setMonth(nextDate.getMonth() + periodMonths);

          const plan = allPlans?.find((p) => p.name === newData.plan_name);

          await supabase
            .from("recurring_subscriptions")
            .update({
              status: "active",
              next_billing_date: nextDate.toISOString(),
              plan_name: newData.plan_name,
              plan_id: plan?.id || null,
              amount: Number(newData.amount),
              last_payment_at: new Date().toISOString(),
            })
            .eq("id", newData.subscription_id);
        } else {
          // Se não houver fatura pendente, atualizamos apenas a assinatura principal
          const periodMonths = getPlanPeriodMonths(newData.plan_name || "");
          const nextDate = new Date();
          nextDate.setMonth(nextDate.getMonth() + periodMonths);

          const plan = allPlans?.find((p) => p.name === newData.plan_name);

          await supabase
            .from("recurring_subscriptions")
            .update({
              status: "active",
              next_billing_date: nextDate.toISOString(),
              plan_name: newData.plan_name,
              plan_id: plan?.id || null,
              amount: Number(newData.amount),
              last_payment_at: new Date().toISOString(),
            })
            .eq("id", newData.subscription_id);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-transactions"] });
      toast.success("Recebimento lançado e assinatura atualizada!");
      setIsOpen(false);
      setReceiptFile(null);
      setFormData({
        description: "",
        amount: "0",
        received_at: format(new Date(), "yyyy-MM-dd"),
        category: "Assinatura",
        type: "variable",
        status: "received",
        customer_name: "",
        customer_email: "",
        subscription_id: "",
        plan_name: "",
        bank_account: "rinaldopedroso",
        receipt_url: "",
      });
    },
    onError: (error: any) => {
      toast.error(`Erro ao lançar: ${error.message}`);
    },
  });

  const updateRevenueMutation = useMutation({
    mutationFn: async (payload: { id: string; revenueData: any; file?: File | null }) => {
      const { id, revenueData, file } = payload;
      let finalReceiptUrl = revenueData.receipt_url;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('receipts')
          .getPublicUrl(fileName);
          
        finalReceiptUrl = publicUrl;
      }
      
      const newData = { ...revenueData, receipt_url: finalReceiptUrl };
      const { subscription_id, plan_name, ...updateData } = newData;

      const { data, error } = await supabase
        .from("financial_revenue")
        .update({
          description: newData.description,
          amount: Number(newData.amount),
          received_at: newData.received_at,
          category: newData.category,
          type: newData.type,
          status: newData.status || "received",
          customer_name: newData.customer_name,
          customer_email: newData.customer_email,
          bank_account: newData.bank_account,
          receipt_url: newData.receipt_url,
          source: "manual",
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-transactions"] });
      toast.success("Recebimento atualizado!");
      setIsOpen(false);
      setReceiptFile(null);
      setEditingRevenue(null);
      setFormData({
        description: "",
        amount: "0",
        received_at: format(new Date(), "yyyy-MM-dd"),
        category: "Assinatura",
        type: "variable",
        status: "received",
        customer_name: "",
        customer_email: "",
        subscription_id: "",
        plan_name: "",
        bank_account: "rinaldopedroso",
        receipt_url: "",
      });
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const deleteRevenueMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("financial_revenue").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-transactions"] });
      toast.success("Recebimento excluído com sucesso!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir: ${error.message}`);
    },
  });

  const { data: allSubscriptions } = useQuery({
    queryKey: ["all-subs-minimal"],
    queryFn: async () => {
      const { data } = await supabase
        .from("recurring_subscriptions")
        .select("id, student_name, student_email, amount, plan_name, plan_id")
        .order("student_name");
      return data || [];
    },
  });

  const { data: allPlans } = useQuery({
    queryKey: ["all-plans"],
    queryFn: async () => {
      const { data } = await supabase
        .from("plans")
        .select("id, name, price")
        .order("position" as any);
      return data || [];
    },
  });

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || !formData.received_at) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    
    const payloadData = { ...formData };

    if (editingRevenue) {
      updateRevenueMutation.mutate({ id: editingRevenue.id, revenueData: payloadData, file: receiptFile });
    } else {
      createRevenueMutation.mutate({ revenueData: payloadData, file: receiptFile });
    }
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceiptFile(file);
    setIsAnalyzing(true);
    toast.info("Analisando comprovante com Inteligência Artificial...");

    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const fileToGenerativePart = async (f: File): Promise<{ inlineData: { data: string, mimeType: string } }> => {
        const base64EncodedDataPromise = new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(f);
        });
        return {
          inlineData: { data: await base64EncodedDataPromise as string, mimeType: f.type },
        };
      };

      const imagePart = await fileToGenerativePart(file);

      const prompt = `Analise este comprovante/recibo de recebimento (PIX recebido, depósito, etc). 
Extraia as seguintes informações e retorne APENAS um JSON válido, sem formatações extras:
{
  "amount": numero decimal usando ponto (sem R$),
  "due_date": data do documento no formato YYYY-MM-DD,
  "description": string curta com o nome de quem pagou ou o motivo do pagamento
}
Se não conseguir encontrar algum valor retorne null. Foque no valor transferido.`;

      const result = await model.generateContent([prompt, imagePart]);
      const responseText = result.response.text();
      
      const cleanJson = responseText.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
      const extracted = JSON.parse(cleanJson);

      setFormData(prev => ({
        ...prev,
        amount: extracted.amount ? String(extracted.amount) : prev.amount,
        received_at: extracted.due_date || prev.received_at,
        description: extracted.description || prev.description
      }));
      
      toast.success("Dados preenchidos com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível ler os dados automaticamente. Preencha manualmente.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const importMutation = useMutation({
    mutationFn: async (newRevenues: any[]) => {
      const { data, error } = await supabase.from("financial_revenue").insert(newRevenues).select();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["finance-transactions"] });
      toast.success(`${data ? data.length : 0} recebimentos importados com sucesso!`);
    },
    onError: (error: any) => {
      toast.error(`Erro na importação: ${error.message}`);
    },
    onSettled: () => {
      setIsImporting(false);
      const fileInput = document.getElementById("csv-upload-revenue") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    },
  });

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) throw new Error("Arquivo vazio");

        const delimiter = text.includes(";") ? ";" : ",";
        const lines = text.split("\n").filter((line) => line.trim().length > 0);

        let startIndex = 1;
        const newRevenues = [];
        let duplicateCount = 0;

        // ---- NOVO: Lógica de Conciliação Automática ----
        // Buscar todas as faturas pendentes para cruzar com o extrato
        const { data: pendingInvoices } = await supabase
          .from("subscription_invoices")
          .select("*, recurring_subscriptions(student_name, student_email, id)")
          .eq("status", "pending");

        const matchedInvoices: string[] = [];
        const subscriptionsToUpdate: { id: string; next_date: string }[] = [];

        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i];
          const cols = line.split(delimiter).map((c) => c.replace(/^"|"$/g, "").trim());
          if (cols.length < 3) continue;

          let dateStr = cols[0];
          let amountStr = cols[cols.length - 1];
          let descStr = cols.slice(1, cols.length - 1).join(" ");

          amountStr = amountStr.replace("R$", "").replace("R", "").replace("$", "").trim();
          if (amountStr.includes(",") && amountStr.includes(".")) {
            if (amountStr.lastIndexOf(",") > amountStr.lastIndexOf(".")) {
              amountStr = amountStr.replace(/\./g, "").replace(",", ".");
            } else {
              amountStr = amountStr.replace(/,/g, "");
            }
          } else if (amountStr.includes(",")) {
            amountStr = amountStr.replace(",", ".");
          }
          let amount = parseFloat(amountStr);

          if (isNaN(amount) || amount <= 0) continue;

          let dt: Date;
          if (dateStr.includes("/")) {
            const parts = dateStr.split("/");
            if (parts.length >= 3) {
              if (parts[0].length === 4) {
                dt = new Date(`${parts[0]}-${parts[1]}-${parts[2]}T12:00:00Z`);
              } else {
                dt = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00Z`);
              }
            } else {
              continue;
            }
          } else {
            dt = new Date(dateStr);
          }

          if (isNaN(dt.getTime())) continue;
          const formattedDate = format(dt, "yyyy-MM-dd");

          // Tentativa de Conciliação Automática
          const desc = descStr.toUpperCase();
          let matchedStudent = null;

          if (pendingInvoices) {
            // Procurar fatura com mesmo valor e nome contido na descrição do banco
            const match = pendingInvoices.find((inv) => {
              if (Number(inv.amount) !== amount) return false;
              const studentName = (inv.recurring_subscriptions as any)?.student_name?.toUpperCase();
              if (!studentName) return false;

              // Verifica se partes do nome do aluno estão na descrição do banco
              const nameParts = studentName.split(" ").filter((p: string) => p.length > 2);
              return nameParts.some((part: string) => desc.includes(part));
            });

            if (match && !matchedInvoices.includes(match.id)) {
              matchedInvoices.push(match.id);
              const sub = match.recurring_subscriptions as any;

              // Calcular próxima data (daqui a 30 dias do vencimento original)
              const nextDate = new Date(match.due_date);
              nextDate.setMonth(nextDate.getMonth() + 1);

              subscriptionsToUpdate.push({
                id: sub.id,
                next_date: nextDate.toISOString(),
              });

              matchedStudent = sub.student_name;
            }
          }

          // Verificacao Anti-Duplicidade
          const isDuplicate = transactions.some(
            (tx) =>
              format(tx.date, "yyyy-MM-dd") === formattedDate &&
              tx.amount === amount &&
              (tx.description.toLowerCase().trim() === descStr.toLowerCase().trim() ||
                descStr.toLowerCase().trim().includes(tx.description.toLowerCase().trim()))
          );

          if (isDuplicate) {
            duplicateCount++;
            continue;
          }

          newRevenues.push({
            description: matchedStudent
              ? `[AUTO-MATCH] ${descStr} (Ref: ${matchedStudent})`
              : descStr,
            amount: amount,
            received_at: formattedDate,
            category: matchedStudent ? "Assinatura" : "Outros",
            source: matchedStudent ? "Recorrência" : "PIX",
            status: "received",
            customer_name: matchedStudent || descStr.split(" ").slice(0, 2).join(" "),
            bank_account: importAccount,
          });
        }

        // Executar baixas automáticas se houver matches
        if (matchedInvoices.length > 0) {
          await supabase
            .from("subscription_invoices")
            .update({ status: "paid", paid_at: new Date().toISOString() })
            .in("id", matchedInvoices);

          for (const subUpdate of subscriptionsToUpdate) {
            await supabase
              .from("recurring_subscriptions")
              .update({ next_billing_date: subUpdate.next_date, status: "active" })
              .eq("id", subUpdate.id);
          }

          toast.success(
            `${matchedInvoices.length} mensalidades foram quitadas automaticamente pelo extrato!`
          );
        }

        if (newRevenues.length > 0) {
          importMutation.mutate(newRevenues);
          toast.info(
            `Processando ${newRevenues.length} novos recebimentos. Ignorados ${duplicateCount} duplicados.`
          );
        } else {
          toast.info(`Nenhum recebimento novo encontrado. Ignorados/Despesas: ${duplicateCount}`);
          setIsImporting(false);
        }
      } catch (err) {
        toast.error("Erro ao ler o arquivo CSV!");
        setIsImporting(false);
      }
    };

    reader.readAsText(file);
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.error("Não há transações para exportar neste período.");
      return;
    }

    const headers = ["Data", "Cliente", "Email", "Categoria", "Metodo", "Status", "Valor", "Conta"];
    const csvContent = [
      headers.join(","),
      ...filteredTransactions.map(tx => {
        return [
          format(tx.date, "dd/MM/yyyy"),
          `"${tx.customerName || ''}"`,
          `"${tx.customerEmail || ''}"`,
          `"${tx.category || ''}"`,
          `"${tx.paymentMethod || ''}"`,
          `"${tx.status || ''}"`,
          tx.amount.toString().replace('.', ','),
          `"${tx.bankAccount || ''}"`
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `extrato_boracorrerclub.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Extrato exportado com sucesso!");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
      case "active":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-none">Pago / Ativo</Badge>
        );
      case "refunded":
        return <Badge className="bg-orange-500/10 text-orange-600 border-none">Estornado</Badge>;
      case "pending_future":
        return <Badge className="bg-blue-500/10 text-blue-500 border-none italic">Previsto</Badge>;
      case "pending":
      case "awaiting_payment":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-none">Pendente</Badge>;
      case "canceled":
      case "failed":
        return <Badge className="bg-red-500/10 text-red-500 border-none">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    if (category.startsWith("Assinatura")) return <Laptop className="w-4 h-4 text-primary" />;
    if (category === "Transferência/PIX")
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    return <ShoppingBag className="w-4 h-4 text-indigo-500" />;
  };

  const monthlyTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Filtrar por Realizado vs Previsto
      if (selectedDateFilter === "realized") {
        // Apenas Realizados ou Pedidos (Ignora Previsões)
        if (t.category === "Assinatura (Previsto)") return false;
      } else if (selectedDateFilter === "scheduled") {
        // Apenas o que é previsão agenda
        if (t.category !== "Assinatura (Previsto)") return false;
      }

      const dtSafe = new Date(t.date.getTime() + Math.abs(t.date.getTimezoneOffset() * 60000));
      let isDateMatch = false;
      const today = new Date();
      const isSpecificMonth = !isNaN(parseInt(selectedPeriod));

      if (isSpecificMonth) {
        isDateMatch = dtSafe.getMonth().toString() === selectedPeriod && dtSafe.getFullYear().toString() === selectedYear;
      } else if (selectedPeriod === "3months") {
        const past = new Date(today.getFullYear(), today.getMonth() - 2, 1);
        isDateMatch = dtSafe >= past && dtSafe <= new Date(today.getFullYear(), today.getMonth() + 1, 0);
      } else if (selectedPeriod === "6months") {
        const past = new Date(today.getFullYear(), today.getMonth() - 5, 1);
        isDateMatch = dtSafe >= past && dtSafe <= new Date(today.getFullYear(), today.getMonth() + 1, 0);
      } else if (selectedPeriod === "year") {
        isDateMatch = dtSafe.getFullYear().toString() === selectedYear;
      } else if (selectedPeriod === "custom") {
        if (customStartDate && customEndDate) {
          const start = new Date(`${customStartDate}T00:00:00-03:00`);
          const end = new Date(`${customEndDate}T23:59:59-03:00`);
          isDateMatch = dtSafe >= start && dtSafe <= end;
        } else {
          isDateMatch = true; 
        }
      } else if (selectedPeriod === "all") {
        isDateMatch = true;
      }

      const isSameDay = selectedDay === "all" || dtSafe.getDate().toString() === selectedDay;

      let isSameStatus = true;
      if (selectedStatus === "paid") {
        isSameStatus = t.status === "paid" || t.status === "active" || t.status === "received";
      } else if (selectedStatus === "pending") {
        isSameStatus =
          t.status === "pending" ||
          t.status === "awaiting_payment" ||
          t.status === "aberto" ||
          t.status === "waiting_details";
      } else if (selectedStatus === "canceled") {
        isSameStatus = t.status === "canceled" || t.status === "failed" || t.status === "refunded";
      }

      let isSamePayment = true;
      if (selectedPayment === "pix") {
        isSamePayment = t.paymentMethod.toLowerCase().includes("pix");
      } else if (selectedPayment === "card") {
        isSamePayment =
          t.paymentMethod.toLowerCase().includes("cartão") ||
          t.paymentMethod.toLowerCase().includes("card");
      }

      let isSameAccount = true;
      if (selectedAccount !== "all") {
        const bank = t.bankAccount || "boracorrerclub";
        isSameAccount = bank === selectedAccount;
      }

      return isDateMatch && isSameDay && isSameStatus && isSamePayment && isSameAccount;
    });
  }, [transactions, selectedYear, selectedDay, selectedStatus, selectedPayment, selectedAccount, selectedPeriod, selectedDateFilter, customStartDate, customEndDate]);

  const filteredTransactions = monthlyTransactions.filter((t) => {
    const matchesSearch =
      t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === "all" || t.type === filterType;

    return matchesSearch && matchesType;
  });

  // Métricas KPI
  const totalPago = monthlyTransactions
    .filter((t) => t.status === "paid" || t.status === "active" || t.status === "received")
    .reduce((acc, t) => acc + t.amount, 0);
  const totalAberto = monthlyTransactions
    .filter((t) => t.status === "pending" || t.status === "awaiting_payment")
    .reduce((acc, t) => acc + t.amount, 0);
  const totalGeral = totalPago + totalAberto;

  // Estimativa de Tarifas: Cartão ~4.9% PIX ~0.99%
  const taxasCartao = monthlyTransactions
    .filter(
      (t) => (t.status === "paid" || t.status === "active" || t.status === "received") && t.paymentMethod.includes("Cartão")
    )
    .reduce((acc, t) => acc + t.amount * 0.049, 0);
  const taxasPix = monthlyTransactions
    .filter(
      (t) => (t.status === "paid" || t.status === "active" || t.status === "received") && t.paymentMethod.includes("PIX")
    )
    .reduce((acc, t) => acc + t.amount * 0.0099, 0);
  const totalLiquido = totalPago - taxasCartao - taxasPix;

  // Gráfico Evolução Diária ou Mensal
  const chartData = useMemo(() => {
    const data: any[] = [];
    const validTx = monthlyTransactions.filter((t) => t.status === "paid" || t.status === "active" || t.status === "received");
    const isSpecificMonth = !isNaN(parseInt(selectedPeriod));

    if (isSpecificMonth) {
      const daysInMonth = new Date(Number(selectedYear), Number(selectedPeriod) + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        data.push({
          dia: `${String(i).padStart(2, "0")}/${String(Number(selectedPeriod) + 1).padStart(2, "0")}`,
          Valor: 0,
        });
      }

      validTx.forEach((t) => {
        const dtSafe = new Date(t.date.getTime() + Math.abs(t.date.getTimezoneOffset() * 60000));
        const d = dtSafe.getUTCDate();
        if(data[d - 1]) data[d - 1].Valor += t.amount;
      });
    } else {
      const monthsMap = new Map();
      const monthNamesShort = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const today = new Date();
      
      const preFillMonths = (count: number) => {
        for (let i = count - 1; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const monthKey = `${monthNamesShort[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
          monthsMap.set(monthKey, { 
            dia: monthKey, 
            Valor: 0, 
            sortKey: `${d.getFullYear()}${String(d.getMonth()).padStart(2, '0')}` 
          });
        }
      };

      if (selectedPeriod === "3months") preFillMonths(3);
      else if (selectedPeriod === "6months") preFillMonths(6);
      else if (selectedPeriod === "year") {
        const yr = parseInt(selectedYear) || today.getFullYear();
        for (let i = 0; i < 12; i++) {
          const d = new Date(yr, i, 1);
          const monthKey = `${monthNamesShort[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
          monthsMap.set(monthKey, { dia: monthKey, Valor: 0, sortKey: `${d.getFullYear()}${String(d.getMonth()).padStart(2, '0')}` });
        }
      }

      validTx.forEach((t) => {
        const dtSafe = new Date(t.date.getTime() + Math.abs(t.date.getTimezoneOffset() * 60000));
        const monthKey = `${monthNamesShort[dtSafe.getMonth()]} ${dtSafe.getFullYear().toString().slice(2)}`;
        
        if (!monthsMap.has(monthKey)) {
          monthsMap.set(monthKey, { 
            dia: monthKey, 
            Valor: 0, 
            sortKey: `${dtSafe.getFullYear()}${String(dtSafe.getMonth()).padStart(2, '0')}` 
          });
        }
        monthsMap.get(monthKey).Valor += t.amount;
      });

      const sortedData = Array.from(monthsMap.values()).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
      sortedData.forEach(d => data.push(d));
    }

    return data;
  }, [monthlyTransactions, selectedYear, selectedPeriod]);

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const yearOptions = ["2024", "2025", "2026", "2027", "2028"];
  const dayOptions = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      {/* HEADER TIPO DASHBOARD ESPECÍFICO */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-4 shadow-sm flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <DollarSign className="w-6 h-6" />
          <span className="text-xl font-bold tracking-tight">Contas a Receber</span>
        </div>

        <div className="flex gap-2">
          <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) {
              setEditingRevenue(null);
              setFormData({
                description: "",
                amount: "0",
                received_at: format(new Date(), "yyyy-MM-dd"),
                category: "Assinatura",
                type: "variable",
                status: "received",
                customer_name: "",
                customer_email: "",
                subscription_id: "",
                plan_name: "",
                bank_account: "rinaldopedroso",
                receipt_url: "",
              });
              setReceiptFile(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-sm rounded-md px-3 sm:px-4 h-9">
                <Plus className="w-4 h-4" />
                <span className="font-semibold text-sm hidden sm:inline">Lançar Manual</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingRevenue ? "Editar Recebimento" : "Lançar Recebimento Manual"}</DialogTitle>
                <DialogDescription>
                  Use este formulário para registrar pagamentos via PIX direto ou Dinheiro.
                </DialogDescription>
              </DialogHeader>

              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-800">
                  <strong>Dica do Financeiro:</strong> O aluno enviou o comprovante no WhatsApp?
                  Lançando aqui, o sistema já ativa a assinatura dele e suspende os lembretes de
                  cobrança.
                </p>
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-4 pt-2">
                <div 
                  className={`bg-muted/30 p-5 rounded-xl border border-dashed flex flex-col items-center justify-center relative cursor-pointer transition-colors ${isAnalyzing ? 'border-primary/50 bg-primary/5' : 'hover:bg-muted/50 border-border/60'}`}
                  onClick={() => document.getElementById('revenue-receipt-upload')?.click()}
                >
                  <input type="file" id="revenue-receipt-upload" accept="image/*,application/pdf" className="hidden" onChange={handleReceiptUpload} />
                  {isAnalyzing ? (
                    <div className="flex flex-col items-center gap-2">
                       <Activity className="w-8 h-8 text-primary animate-spin" />
                       <span className="text-sm font-semibold text-primary">Analisando Inteligência Artificial...</span>
                    </div>
                  ) : receiptFile || formData.receipt_url ? (
                    <div className="flex items-center gap-2 text-emerald-500 font-semibold">
                      <CheckCircle2 className="w-6 h-6" /> Comprovante Anexado com Sucesso!
                    </div>
                  ) : (
                    <>
                      <div className="p-3 bg-primary/10 text-primary rounded-full mb-3">
                         <Upload className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-bold text-foreground">Leitura Inteligente (Foto do Recebimento)</span>
                      <span className="text-xs font-medium text-muted-foreground mt-1 max-w-[280px] text-center">
                        Faça o upload do comprovante que o aluno mandou e a IA tentará preencher tudo para você!
                      </span>
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sub_id">Vincular Aluno (Opcional)</Label>
                  <Select
                    value={formData.subscription_id}
                    onValueChange={(val) => {
                      const sub = allSubscriptions?.find((s) => s.id === val);
                      const currentCategory = formData.category;
                      let autoDesc = "";
                      if (currentCategory === "Assinatura") {
                        autoDesc = `Mensalidade - ${sub?.student_name}`;
                      } else if (currentCategory === "Venda Avulsa") {
                        autoDesc = `Venda Avulsa - ${sub?.student_name}`;
                      } else {
                        autoDesc = `${currentCategory} - ${sub?.student_name}`;
                      }
                      setFormData({
                        ...formData,
                        subscription_id: val,
                        customer_name: sub?.student_name || "",
                        customer_email: sub?.student_email || "",
                        amount: sub?.amount?.toString() || "",
                        plan_name: sub?.plan_name || "",
                        description: sub?.student_name ? autoDesc : formData.description,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um aluno para dar baixa" />
                    </SelectTrigger>
                    <SelectContent>
                      {allSubscriptions?.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>
                          {sub.student_name} ({sub.student_email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.subscription_id && (
                  <div className="space-y-2 p-3 bg-primary/5 rounded-xl border border-primary/10 animate-in slide-in-from-top-2 duration-300">
                    <Label className="text-primary font-bold text-[11px] uppercase flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" /> Confirmar Plano do Aluno
                    </Label>
                    <Select
                      value={formData.plan_name}
                      onValueChange={(val) => {
                        const plan = allPlans?.find(p => p.name === val);
                        setFormData({ 
                          ...formData, 
                          plan_name: val,
                          amount: plan?.price?.toString() || formData.amount
                        });
                      }}
                    >
                      <SelectTrigger className="h-11 bg-white border-primary/20">
                        <SelectValue placeholder="Qual é o plano?" />
                      </SelectTrigger>
                      <SelectContent>
                        {allPlans?.map((p: any) => (
                          <SelectItem key={p.id} value={p.name}>
                            {p.name} (R$ {p.price})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Ao salvar, o sistema atualizará o plano do aluno para <strong>{formData.plan_name}</strong> automaticamente.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="desc">Descrição *</Label>
                  <Input
                    id="desc"
                    placeholder="Ex: Mensalidade Janeiro - João"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="val">Valor (R$) *</Label>
                    <Input
                      id="val"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Data do Recebimento *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.received_at}
                      onChange={(e) => setFormData({ ...formData, received_at: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="acc">Conta Bancária</Label>
                    <Select
                      value={formData.bank_account}
                      onValueChange={(val) => setFormData({ ...formData, bank_account: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rinaldopedroso">Rinaldo Pedroso</SelectItem>
                        <SelectItem value="boracorrerclub">Superação Assessoria</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cat">Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(val) => {
                      // Se um aluno já está vinculado, atualiza a descrição de acordo com a nova categoria
                      if (formData.subscription_id && formData.customer_name) {
                        let autoDesc = "";
                        if (val === "Assinatura") {
                          autoDesc = `Mensalidade - ${formData.customer_name}`;
                        } else if (val === "Venda Avulsa") {
                          autoDesc = `Venda Avulsa - ${formData.customer_name}`;
                        } else {
                          autoDesc = `${val} - ${formData.customer_name}`;
                        }
                        setFormData({ ...formData, category: val, description: autoDesc });
                      } else {
                        setFormData({ ...formData, category: val });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Assinatura">Assinatura / Mensalidade</SelectItem>
                      <SelectItem value="Venda Avulsa">Venda de Produto</SelectItem>
                      <SelectItem value="Eventos">Inscrição em Eventos</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={createRevenueMutation.isPending}
                >
                  {createRevenueMutation.isPending ? "Lançando..." : "Confirmar Recebimento"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <input
            type="file"
            accept=".csv"
            id="csv-upload-revenue"
            className="hidden"
            onChange={handleImportCSV}
            disabled={isImporting}
          />
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 bg-white/10 hover:bg-white/20 text-white border-none shadow-sm transition-all rounded-md px-3 sm:px-4 h-9"
                disabled={isImporting}
              >
                {isImporting ? (
                  <Activity className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span className="font-semibold text-sm hidden sm:inline">Importar Extrato</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Importar Extrato InfinityPay</DialogTitle>
                <DialogDescription>
                  1. Selecione a conta de onde vem o extrato.<br/>
                  2. Escolha o arquivo CSV baixado do banco.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Conta Bancária do Extrato</Label>
                  <Select value={importAccount} onValueChange={setImportAccount}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rinaldopedroso">Rinaldo Pedroso</SelectItem>
                      <SelectItem value="boracorrerclub">Superação Assessoria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-2"
                  onClick={() => document.getElementById("csv-upload-revenue")?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" /> Selecionar Arquivo CSV
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            className="gap-2 bg-white/10 hover:bg-white/20 text-white border-none shadow-sm transition-all rounded-md px-3 sm:px-4 h-9"
            onClick={handleExportCSV}
          >
            <Download className="w-4 h-4" />
            <span className="font-semibold text-sm hidden sm:inline">Exportar Extrato</span>
          </Button>
        </div>
      </div>

      {/* BARRA DE FILTROS SUPERIOR */}
      <Card className="border-border/50 shadow-sm overflow-visible">
        <div className="p-4 flex flex-wrap gap-4 lg:gap-6 items-end bg-muted/20">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Dia
            </label>
            <Select value={selectedDay} onValueChange={setSelectedDay}>
              <SelectTrigger className="w-[100px] bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {dayOptions.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d.padStart(2, "0")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Conta
            </label>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger className="w-[160px] bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Contas</SelectItem>
                <SelectItem value="boracorrerclub">Superação Assessoria</SelectItem>
                <SelectItem value="rinaldopedroso">Rinaldo Pedroso</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Filtro de Período
            </label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px] bg-background border-teal-500/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthNames.map((m, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    {m} (30 Dias)
                  </SelectItem>
                ))}
                <SelectItem value="3months" className="font-semibold text-teal-600">⚡ Trimestral (3 Meses)</SelectItem>
                <SelectItem value="6months" className="font-semibold text-teal-600">⚡ Semestral (6 Meses)</SelectItem>
                <SelectItem value="year" className="font-semibold text-teal-600">⚡ Anual (Este Ano)</SelectItem>
                <SelectItem value="custom" className="font-semibold text-purple-600">🎯 Personalizado</SelectItem>
                <SelectItem value="all" className="font-semibold text-teal-600">⚡ Todo o Histórico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedPeriod === "custom" && (
            <div className="flex gap-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-purple-600 uppercase tracking-widest">
                  Data Inicial
                </label>
                <Input type="date" className="h-9 w-[130px] text-xs" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-purple-600 uppercase tracking-widest">
                  Data Final
                </label>
                <Input type="date" className="h-9 w-[130px] text-xs" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Ano
            </label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[120px] bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Status
            </label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="pending">Aberto / Pendente</SelectItem>
                <SelectItem value="canceled">Cancelado / Estornado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[300px]">
            <Tabs 
              value={selectedDateFilter} 
              onValueChange={setSelectedDateFilter}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/30">
                <TabsTrigger value="realized" className="text-xs font-bold data-[state=active]:bg-emerald-500 data-[state=active]:text-white transition-all">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Extrato Realizado
                </TabsTrigger>
                <TabsTrigger value="scheduled" className="text-xs font-bold data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all">
                  <Calendar className="w-3.5 h-3.5 mr-2" /> Agenda / Previsões
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-border/10">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest pl-1">
                Ref. Mês
              </label>
              <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v)}>
                <SelectTrigger className="w-[124px] bg-background">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo Histórico</SelectItem>
                  {[
                    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
                  ].map((m, i) => (
                    <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest pl-1">
                Ref. Ano
              </label>
              <Select value={selectedYear} onValueChange={(v) => setSelectedYear(v)}>
                <SelectTrigger className="w-[100px] bg-background">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {["2024", "2025", "2026", "2027", "2028"].map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Tipo de Pagamento
            </label>
            <Select value={selectedPayment} onValueChange={setSelectedPayment}>
              <SelectTrigger className="w-[200px] bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Formas</SelectItem>
                <SelectItem value="card">Cartão de Crédito</SelectItem>
                <SelectItem value="pix">PIX / TED</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPI CARDS (PAGOS, ABERTOS, TAXAS) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-y border-border/40 divide-y md:divide-y-0 md:divide-x divide-border/40">
          {/* Bloco 1: Pagos e Taxas Cartão */}
          <div className="p-6 pb-5">
            <div className="flex flex-col gap-5">
              <div>
                <div className="text-2xl sm:text-3xl font-light text-foreground mb-1">
                  {formatCurrency(totalPago, false)}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-info text-blue-500 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Pagos
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-light text-foreground mb-1">
                  {formatCurrency(taxasCartao, false)}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                  <CreditCard className="w-3.5 h-3.5" /> Taxas Cartão (Est.)
                </div>
              </div>
            </div>
          </div>

          {/* Bloco 2: Abertos e Taxas PIX */}
          <div className="p-6 pb-5">
            <div className="flex flex-col gap-5">
              <div>
                <div className="text-2xl sm:text-3xl font-light text-foreground mb-1">
                  {formatCurrency(totalAberto, false)}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-orange-500 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> Abertos / Pendentes
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-light text-foreground mb-1">
                  {formatCurrency(taxasPix, false)}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                  <Laptop className="w-3.5 h-3.5" /> Taxas PIX (Est.)
                </div>
              </div>
            </div>
          </div>

          {/* Bloco 3: Totais Gerais */}
          <div className="p-6 pb-5 bg-muted/5">
            <div className="flex flex-col gap-5">
              <div>
                <div className="text-2xl sm:text-3xl font-light text-foreground mb-1">
                  {formatCurrency(totalGeral, false)}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
                  <DollarSign className="w-3.5 h-3.5" /> Total Esperado
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-emerald-600 mb-1">
                  {formatCurrency(totalLiquido, false)}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                  <Activity className="w-3.5 h-3.5" /> Total Líquido após Taxas
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* GRAFICO EVOLUCAO MENSAL DE RECEBIMENTOS */}
        <div className="p-6 border-b border-border/40">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-6">
            Evolução dos Recebimentos
          </h4>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis
                  dataKey="dia"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickFormatter={(value) => `R$ ${value}`}
                />
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: "12px",
                    borderColor: "hsl(var(--border))",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  }}
                  formatter={(value: number) => [formatCurrency(value, false), "Receita no Dia"]}
                  labelStyle={{
                    fontWeight: "bold",
                    color: "hsl(var(--foreground))",
                    marginBottom: "4px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="Valor"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "white" }}
                  activeDot={{ r: 6, fill: "#10b981", strokeWidth: 0 }}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AREA DA TABELA */}
        <div className="p-4 bg-muted/20 border-b border-border/40 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar na tabela abaixo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-background h-9 text-sm border-border/60 shadow-sm"
            />
          </div>

          <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
            <SelectTrigger className="w-[180px] bg-background h-9 text-sm shadow-sm">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="order">Apenas Avulsas</SelectItem>
              <SelectItem value="subscription">Apenas Assinaturas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-background">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[120px]">Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Categoria / Item</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <p>Carregando extrato...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                      <Search className="w-8 h-8" />
                      <p>Nenhuma transação encontrada</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((tx) => (
                  <TableRow
                    key={`${tx.type}-${tx.id}`}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground/60" />
                        <span className="text-sm">{formatDate(tx.date.toISOString())}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {formatName(tx.customerName)}
                          </span>
                          {tx.receipt_url && (
                            <a href={tx.receipt_url} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-600 transition-colors" title="Ver Comprovante Anexo">
                              <CheckCircle2 className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                        {tx.customerEmail !== "---" && (
                          <span className="text-xs text-muted-foreground">{tx.customerEmail}</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 font-medium text-sm">
                          {getCategoryIcon(tx.category)}
                          {tx.category}
                        </div>
                        <span
                          className="text-xs text-muted-foreground truncate max-w-[200px] mt-0.5"
                          title={tx.description}
                        >
                          {tx.description}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="text-sm px-2 py-1 bg-muted rounded-md text-foreground font-medium">
                        {tx.paymentMethod}
                      </span>
                      {tx.bankAccount && (
                        <div className="mt-1 flex items-center gap-1 opacity-60">
                          <Wallet className="w-3 h-3" /> 
                          <span className="text-[10px] uppercase font-bold tracking-wider">{tx.bankAccount === 'boracorrerclub' ? 'BORA' : 'RINALDO'}</span>
                        </div>
                      )}
                    </TableCell>

                    <TableCell>{getStatusBadge(tx.status)}</TableCell>

                    <TableCell
                      className={`text-right font-black ${tx.status === "refunded" ? "text-orange-500" : "text-emerald-600 dark:text-emerald-500"}`}
                    >
                      {tx.status === "refunded" ? "-" : "+"}
                      {formatCurrency(tx.amount, false)}
                    </TableCell>
                    
                    <TableCell className="flex items-center gap-1 justify-end">
                      {tx.sourceDB === "financial_revenue" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Editar Lançamento"
                            onClick={() => {
                              setEditingRevenue(tx);
                              setFormData({
                                description: tx.description || "",
                                amount: tx.amount.toString(),
                                received_at: format(tx.date, "yyyy-MM-dd"),
                                category: tx.category || "Outros",
                                type: "variable",
                                status: "received",
                                customer_name: tx.customerName || "",
                                subscription_id: "",
                                plan_name: "",
                                bank_account: tx.bankAccount || "boracorrerclub",
                                receipt_url: tx.receipt_url || "",
                              });
                              setIsOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Excluir Lançamento"
                            onClick={() => {
                              if (window.confirm("Deseja realmente excluir este recebimento?")) {
                                deleteRevenueMutation.mutate(tx.id);
                              }
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
