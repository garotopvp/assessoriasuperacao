import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Plus,
  Trash,
  Wallet,
  Edit2,
  AlignLeft,
  DollarSign,
  CalendarDays,
  Tag,
  Activity,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Search,
  Calendar,
  Menu,
  XCircle,
  Upload,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { useEffect } from "react";

export function ExpensesManager({
  selectedMonth: initialMonth,
  selectedYear: initialYear,
}: {
  selectedMonth?: string;
  selectedYear?: string;
}) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
 
  useEffect(() => {
    if (initialMonth) setSelectedPeriod(initialMonth);
  }, [initialMonth]);
 
  useEffect(() => {
    if (initialYear) setSelectedYear(initialYear);
  }, [initialYear]);

  // Filtros
  const [selectedPeriod, setSelectedPeriod] = useState(initialMonth || new Date().getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(initialYear || new Date().getFullYear().toString());
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [importAccount, setImportAccount] = useState("rinaldopedroso");
  const [monthsCount, setMonthsCount] = useState(1);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    due_date: format(new Date(), "yyyy-MM-dd"),
    paid_at: "",
    category: "Sistemas e Ferramentas",
    type: "fixed",
    status: "pending",
    bank_account: "rinaldopedroso",
    receipt_url: "",
  });

  const { data: expenses, isLoading } = useQuery({
    queryKey: ["financial_expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_expenses")
        .select("*")
        .order("due_date", { ascending: false });

      if (error) {
        toast.error("Erro ao carregar despesas");
        throw error;
      }
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: { expenseData: any; count: number; file?: File | null }) => {
      const { expenseData, count, file } = payload;
      let finalReceiptUrl = expenseData.receipt_url;

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
      
      const finalExpenseData = { ...expenseData, receipt_url: finalReceiptUrl };

      if (editingExpense) {
        const { data, error } = await supabase
          .from("financial_expenses")
          .update(finalExpenseData)
          .eq("id", editingExpense.id)
          .select();
        if (error) throw error;
        return data;
      } else {
        const expensesToInsert = [];
        const [year, month, day] = finalExpenseData.due_date.split("-").map(Number);

        for (let i = 0; i < count; i++) {
          const newDate = new Date(year, month - 1 + i, day);
          expensesToInsert.push({
            ...finalExpenseData,
            due_date: format(newDate, "yyyy-MM-dd"),
            description: count > 1 ? `${finalExpenseData.description} (${i + 1}/${count})` : finalExpenseData.description,
          });
        }

        const { data, error } = await supabase
          .from("financial_expenses")
          .insert(expensesToInsert)
          .select();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["financial_expenses"] });
      toast.success(editingExpense ? "Despesa atualizada" : `Despesa registrada${variables.count > 1 ? ` em ${variables.count} meses` : ''}`);
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("financial_expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial_expenses"] });
      toast.success("Despesa apagada");
    },
  });

  const resetForm = () => {
    setEditingExpense(null);
    setIsAddingCategory(false);
    setReceiptFile(null);
    setFormData({
      description: "",
      amount: "",
      due_date: format(new Date(), "yyyy-MM-dd"),
      paid_at: "",
      category: "Sistemas e Ferramentas",
      type: "fixed",
      status: "pending",
      bank_account: "rinaldopedroso",
      receipt_url: "",
    });
    setMonthsCount(1);
  };

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    setIsAddingCategory(
      !uniqueCategories.includes(expense.category) && expense.category !== "general"
    );
    setReceiptFile(null);
    
    let formattedDueDate = expense.due_date;
    if (expense.due_date) {
      const ds = expense.due_date.split('T')[0];
      const [y, m, dNum] = ds.split('-');
      const dtSafe = new Date(Number(y), Number(m) - 1, Number(dNum), 12, 0, 0);
      formattedDueDate = format(dtSafe, "yyyy-MM-dd");
    }

    let formattedPaidAt = "";
    if (expense.paid_at) {
      const ps = expense.paid_at.split('T')[0];
      const [py, pm, pd] = ps.split('-');
      const ptSafe = new Date(Number(py), Number(pm) - 1, Number(pd), 12, 0, 0);
      formattedPaidAt = format(ptSafe, "yyyy-MM-dd");
    }

    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      due_date: formattedDueDate,
      paid_at: formattedPaidAt,
      category: expense.category,
      type: expense.type,
      status: expense.status,
      bank_account: expense.bank_account || "boracorrerclub",
      receipt_url: expense.receipt_url || "",
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const payloadData = {
      ...formData,
      amount: parseFloat(formData.amount.replace(",", ".")),
      paid_at: formData.paid_at || null,
    };

    saveMutation.mutate({
      expenseData: payloadData,
      count: editingExpense ? 1 : monthsCount,
      file: receiptFile
    });
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

      const prompt = `Analise este comprovante/recibo/nota fiscal. 
Extraia as seguintes informações e retorne APENAS um JSON válido, sem formatações extras:
{
  "amount": numero decimal usando ponto (sem R$),
  "due_date": data no formato YYYY-MM-DD,
  "description": string curta descrevendo a despesa ou recebedor
}
Se não conseguir encontrar algum valor retorne null e se tente adivinhar a description se tiver a logomarca de quem recebeu.`;

      const result = await model.generateContent([prompt, imagePart]);
      const responseText = result.response.text();
      
      const cleanJson = responseText.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
      const extracted = JSON.parse(cleanJson);

      setFormData(prev => ({
        ...prev,
        amount: extracted.amount ? String(extracted.amount) : prev.amount,
        due_date: extracted.due_date || prev.due_date,
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

  const toggleStatus = async (expense: any) => {
    const newStatus = expense.status === "paid" ? "pending" : "paid";
    try {
      const { error } = await supabase
        .from("financial_expenses")
        .update({ status: newStatus })
        .eq("id", expense.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["financial_expenses"] });
      toast.success(`Despesa marcada como ${newStatus === "paid" ? "Paga" : "Pendente"}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const importMutation = useMutation({
    mutationFn: async (newExpenses: any[]) => {
      const { data, error } = await supabase
        .from("financial_expenses")
        .insert(newExpenses)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["financial_expenses"] });
      toast.success(`${data ? data.length : 0} despesas importadas com sucesso!`);
    },
    onError: (error: any) => {
      toast.error(`Erro na importação: ${error.message}`);
    },
    onSettled: () => {
      setIsImporting(false);
      const fileInput = document.getElementById("csv-upload") as HTMLInputElement;
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

        // Detecção de delimitador e quebra de linhas
        const delimiter = text.includes(";") ? ";" : ",";
        const lines = text.split("\n").filter((line) => line.trim().length > 0);

        let startIndex = 1; // assumindo que a primeira linha é cabeçalho
        const newExpenses = [];
        let duplicateCount = 0;

        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i];
          const cols = line.split(delimiter).map((c) => c.replace(/^"|"$/g, "").trim());
          if (cols.length < 3) continue;

          let dateStr = cols[0];
          let amountStr = cols[cols.length - 1];
          let descStr = cols.slice(1, cols.length - 1).join(" ");

          // Limpeza do valor
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
          if (isNaN(amount) || amount === 0) continue;

          // Assumindo valor absoluto pois toda linha será tratada como CUSTO
          const finalAmount = Math.abs(amount);

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

          // Verificacao Extrema de Duplicidade (Data exata, Valor exato e Nome Parcial)
          // Isso ajuda se a extrato der "PGTO DEB 123" e antes tava só "PGTO" manual, mas na margem é seguro pegar matches perfeitos:
          const expensesListSafe = expenses || [];
          const isDuplicate = expensesListSafe.some(
            (exp) =>
              exp.due_date === formattedDate &&
              (exp.description.toLowerCase().trim() === descStr.toLowerCase().trim() ||
                descStr.toLowerCase().trim().includes(exp.description.toLowerCase().trim())) &&
              Number(exp.amount) === finalAmount
          );

          if (isDuplicate) {
            duplicateCount++;
            continue;
          }

          newExpenses.push({
            description: descStr,
            amount: finalAmount,
            due_date: formattedDate,
            category: "Outros",
            type: "variable",
            status: "paid",
            bank_account: importAccount,
          });
        }

        if (newExpenses.length > 0) {
          importMutation.mutate(newExpenses);
          toast.info(
            `Processando ${newExpenses.length} novas despesas. Ignoradas ${duplicateCount} duplicadas.`
          );
        } else {
          toast.info(
            `Nenhuma despesa válida encontrada. Linhas ignoradas/duplicadas: ${duplicateCount}`
          );
          setIsImporting(false);
        }
      } catch (err) {
        toast.error("Erro ao ler o arquivo CSV!");
        setIsImporting(false);
      }
    };

    reader.onerror = () => {
      toast.error("Falha ao abrir arquivo CSV.");
      setIsImporting(false);
    };

    reader.readAsText(file);
  };

  // Filtros no Frontend
  const expensesList = expenses || [];

  const filteredExpenses = expensesList.filter((expense) => {
    if (!expense.due_date) return false;
    
    // Se a despesa está paga E tem data de pagamento real (paid_at),
    // filtramos pela data real do pagamento — não pelo vencimento.
    // Assim, uma conta de Janeiro paga em Março aparece em Março.
    const dateSource = (expense.status === "paid" && expense.paid_at)
      ? expense.paid_at
      : expense.due_date;

    const ds = dateSource.split('T')[0];
    const [y, m, d] = ds.split('-');
    const dtSafe = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
    
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


    let isSameStatus = true;
    if (selectedStatus === "paid") isSameStatus = expense.status === "paid";
    if (selectedStatus === "pending") isSameStatus = expense.status === "pending";

    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase());

    let isSameAccount = true;
    if (selectedAccount !== "all") {
      const bank = expense.bank_account || "boracorrerclub";
      isSameAccount = bank === selectedAccount;
    }

    return isDateMatch && isSameStatus && matchesSearch && isSameAccount;
  });

  // Métricas
  const totalPagos = filteredExpenses
    .filter((e) => e.status === "paid")
    .reduce((acc, e) => acc + Number(e.amount), 0);
  const totalAbertos = filteredExpenses
    .filter((e) => e.status === "pending")
    .reduce((acc, e) => acc + Number(e.amount), 0);
  const totalGeral = totalPagos + totalAbertos;

  // Gráfico da Evolução de Despesas do período
  const chartData = useMemo(() => {
    const data: any[] = [];
    const isSpecificMonth = !isNaN(parseInt(selectedPeriod));
    
    if (isSpecificMonth) {
      const daysInMonth = new Date(Number(selectedYear), Number(selectedPeriod) + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        data.push({
          dia: `${String(i).padStart(2, "0")}/${String(Number(selectedPeriod) + 1).padStart(2, "0")}`,
          Valor: 0,
        });
      }

      filteredExpenses.forEach((e) => {
        const dateSource = (e.status === "paid" && e.paid_at) ? e.paid_at : e.due_date;
        const ds = dateSource.split('T')[0];
        const [y, m, dNum] = ds.split('-');
        const dtSafe = new Date(Number(y), Number(m) - 1, Number(dNum), 12, 0, 0);

        if(data[dtSafe.getDate() - 1]) data[dtSafe.getDate() - 1].Valor += Number(e.amount);
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
      
      filteredExpenses.forEach((e) => {
        const dateSource = (e.status === "paid" && e.paid_at) ? e.paid_at : e.due_date;
        const ds = dateSource.split('T')[0];
        const [y, m, dNum] = ds.split('-');
        const dtSafe = new Date(Number(y), Number(m) - 1, Number(dNum), 12, 0, 0);

        const monthKey = `${monthNamesShort[dtSafe.getMonth()]} ${dtSafe.getFullYear().toString().slice(2)}`;
        
        if (!monthsMap.has(monthKey)) {
          monthsMap.set(monthKey, { 
            dia: monthKey, 
            Valor: 0, 
            sortKey: `${dtSafe.getFullYear()}${String(dtSafe.getMonth()).padStart(2, '0')}` 
          });
        }
        monthsMap.get(monthKey).Valor += Number(e.amount);
      });

      const sortedData = Array.from(monthsMap.values()).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
      sortedData.forEach(d => data.push(d));
    }

    return data;
  }, [filteredExpenses, selectedPeriod, selectedYear]);

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

  const predefinedCategories = [
    "Equipamentos",
    "Eventos e Corridas",
    "Infraestrutura e Aluguel",
    "Marketing e Ads",
    "Outros",
    "Salários e Prestadores",
    "Sistemas e Ferramentas",
    "Taxas e Impostos",
  ];

  const uniqueCategories = Array.from(
    new Set([
      ...predefinedCategories,
      ...expensesList.map((e) => e.category).filter((c) => c && c !== "general"),
    ])
  ).sort();

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.text("Relatório de Contas a Pagar", 14, 22);

      doc.setFontSize(11);
      const periodText = !isNaN(parseInt(selectedPeriod)) 
        ? `${monthNames[parseInt(selectedPeriod)]}/${selectedYear}`
        : selectedPeriod === "3months" ? "Últimos 3 Meses"
        : selectedPeriod === "6months" ? "Últimos 6 Meses"
        : selectedPeriod === "year" ? `Ano de ${selectedYear}`
        : "Todo o Histórico";
      doc.text(`Período: ${periodText}`, 14, 30);

      const statusText =
        selectedStatus === "all"
          ? "Todos os Status"
          : selectedStatus === "paid"
            ? "Pagos"
            : "Abertos / Pendentes";
      doc.text(`Status: ${statusText}`, 14, 36);

      const tableColumn = ["Descrição", "Categoria", "Tipo", "Valor", "Vencimento", "Status"];
      const tableRows: any[] = [];

      filteredExpenses.forEach((expense) => {
        const expenseData = [
          expense.description,
          expense.category || "Sistemas/Outros",
          expense.type === "fixed"
            ? "Custo Fixo"
            : expense.type === "installment"
              ? "Parcelado"
              : "Variável",
          new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
            expense.amount
          ),
          (() => {
            const ds = expense.due_date.split('T')[0];
            const [y, m, d] = ds.split('-');
            const dtSafe = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
            return format(dtSafe, "dd/MM/yyyy");
          })(),
          expense.status === "paid" ? "Pago" : "Aberto",
        ];
        tableRows.push(expenseData);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 42,
        theme: "grid",
        styles: { fontSize: 9 },
        headStyles: { fillColor: [31, 136, 200] },
      });

      const finalY = (doc as any).lastAutoTable.finalY || 42;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(
        `Total Pagos: ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalPagos)}`,
        14,
        finalY + 10
      );
      doc.text(
        `Total Abertos: ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalAbertos)}`,
        14,
        finalY + 16
      );
      doc.text(
        `Total Geral: ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalGeral)}`,
        14,
        finalY + 22
      );

      doc.save(`contas-a-pagar-${selectedPeriod}-${selectedYear}.pdf`);
      toast.success("PDF exportado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao exportar PDF");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      {/* HEADER TIPO DASHBOARD ESPECÍFICO */}
      <div className="bg-[#1f88c8] rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between text-white gap-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-6 h-6" />
          <span className="text-xl font-bold tracking-tight">Contas a Pagar</span>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2 bg-white/10 hover:bg-white/20 text-white border-none shadow-sm transition-all rounded-md px-3 sm:px-4 h-9"
            onClick={handleExportPDF}
            title="Exportar dados para PDF"
          >
            <Download className="w-4 h-4" />
            <span className="font-semibold text-sm hidden sm:inline">Exportar PDF</span>
          </Button>

          <input
            type="file"
            accept=".csv"
            id="csv-upload"
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
                <span className="font-semibold text-sm hidden sm:inline">Importar CSV</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Importar Despesas InfinityPay</DialogTitle>
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
                  className="w-full bg-primary hover:bg-primary/90 text-white mt-2"
                  onClick={() => document.getElementById("csv-upload")?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" /> Selecionar Arquivo CSV
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog
            open={isOpen}
            onOpenChange={(open) => {
              setIsOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2 bg-white/20 hover:bg-white/30 text-white border-none shadow-sm transition-all rounded-md px-3 sm:px-4 h-9">
                <Plus className="w-4 h-4" />
                <span className="font-semibold text-sm hidden sm:inline">Adicionar Pagamento</span>
                <span className="font-semibold text-sm sm:hidden">Novo</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] p-0 border-border/60 bg-background/95 backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] rounded-[24px] overflow-hidden">
              <div className="px-8 pt-8 pb-6 border-b border-border/40 relative bg-gradient-to-b from-primary/5 to-transparent">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
                    <div className="bg-primary/20 text-primary p-2.5 rounded-xl shadow-sm">
                      <Wallet className="w-6 h-6" />
                    </div>
                    {editingExpense ? "Editar Despesa" : "Lançar Nova Despesa"}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground mt-2 font-medium">
                    Preencha os dados abaixo para registrar uma saída no caixa.
                  </p>
                </DialogHeader>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6 relative">
                
                {/* Upload & Análise por Inteligência Artificial */}
                <div 
                  className={`bg-muted/30 p-5 rounded-2xl border border-dashed flex flex-col items-center justify-center relative cursor-pointer transition-colors ${isAnalyzing ? 'border-primary/50 bg-primary/5' : 'hover:bg-muted/50 border-border/60'}`}
                  onClick={() => document.getElementById('receipt-upload')?.click()}
                >
                  <input type="file" id="receipt-upload" accept="image/*,application/pdf" className="hidden" onChange={handleReceiptUpload} />
                  {isAnalyzing ? (
                    <div className="flex flex-col items-center gap-2">
                       <Activity className="w-8 h-8 text-primary animate-spin" />
                       <span className="text-sm font-semibold text-primary">Analisando com Inteligência Artificial...</span>
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
                      <span className="text-sm font-bold text-foreground">Leitura Inteligente (Foto ou Print)</span>
                      <span className="text-xs font-medium text-muted-foreground mt-1 max-w-[280px] text-center">
                        Faça o upload do recibo e a IA preencherá tudo para você automaticamente. Mágica!
                      </span>
                    </>
                  )}
                </div>

                <div className="space-y-3">
                  <Label className="text-[11px] uppercase font-bold text-muted-foreground tracking-widest">
                    Descrição do Custo
                  </Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                      <AlignLeft className="h-5 w-5" />
                    </div>
                    <Input
                      required
                      placeholder="Ex: Tráfego Facebook Ads"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="pl-12 rounded-2xl border-border/50 bg-muted/30 hover:bg-muted/50 focus:bg-background h-14 focus-visible:ring-primary/30 transition-all font-medium text-base shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-[11px] uppercase font-bold text-muted-foreground tracking-widest">
                      Valor (R$)
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-rose-500 transition-colors">
                        <DollarSign className="h-5 w-5" />
                      </div>
                      <Input
                        required
                        type="number"
                        step="0.01"
                        placeholder="100.00"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        className="pl-12 rounded-2xl border-border/50 bg-muted/30 hover:bg-muted/50 focus:bg-background h-14 focus-visible:ring-rose-500/30 transition-all font-black text-lg text-rose-500 placeholder:font-medium placeholder:text-muted-foreground shadow-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[11px] uppercase font-bold text-muted-foreground tracking-widest">
                      Vencimento
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                        <CalendarDays className="h-5 w-5" />
                      </div>
                      <Input
                        required
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        className="pl-12 rounded-2xl border-border/50 bg-muted/30 hover:bg-muted/50 focus:bg-background h-14 focus-visible:ring-primary/30 transition-all font-medium text-[15px] shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {!editingExpense && (
                  <div className="space-y-3">
                    <Label className="text-[11px] uppercase font-bold text-muted-foreground tracking-widest">
                      Repetir por Quantos Meses?
                    </Label>
                    <div className="flex items-center gap-4">
                      <Input
                        type="range"
                        min="1"
                        max="24"
                        value={monthsCount}
                        onChange={(e) => setMonthsCount(parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <div className="w-16 h-14 flex items-center justify-center bg-muted/30 rounded-2xl border border-border/50 font-bold text-lg text-primary shadow-sm">
                        {monthsCount}
                      </div>
                    </div>
                    {monthsCount > 1 && (
                      <p className="text-[11px] text-muted-foreground ml-1">
                        Serão geradas {monthsCount} parcelas/lançamentos (ex: {formData.description} (1/{monthsCount})) com vencimento para os próximos meses a partir da data informada.
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6 pb-2">
                  {/* Categoria Real */}
                  <div className="space-y-3">
                    <Label className="text-[11px] uppercase font-bold text-muted-foreground tracking-widest">
                      Categoria
                    </Label>
                    {isAddingCategory ? (
                      <div className="flex items-center gap-2">
                        <div className="relative group flex-1">
                          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-muted-foreground">
                            <Tag className="h-5 w-5" />
                          </div>
                          <Input
                            required
                            autoFocus
                            placeholder="Digite a nova categoria..."
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="pl-12 rounded-2xl border-border/50 bg-muted/30 hover:bg-muted/50 focus:bg-background h-14 focus-visible:ring-primary/30 transition-all font-medium text-[15px] shadow-sm"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsAddingCategory(false);
                            setFormData({ ...formData, category: "Sistemas e Ferramentas" });
                          }}
                          className="h-14 w-14 rounded-2xl border-border/50 bg-muted/30 hover:bg-muted/50 hover:text-foreground shrink-0 shadow-sm"
                        >
                          <XCircle className="w-5 h-5 text-muted-foreground" />
                        </Button>
                      </div>
                    ) : (
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-muted-foreground">
                          <Tag className="h-5 w-5" />
                        </div>
                        <select
                          title="Categoria da despesa"
                          className="w-full pl-12 pr-10 appearance-none rounded-2xl border border-border/50 bg-muted/30 hover:bg-muted/50 focus:bg-background h-14 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-medium text-[15px] cursor-pointer shadow-sm text-foreground"
                          value={
                            uniqueCategories.includes(formData.category)
                              ? formData.category
                              : formData.category
                                ? "nova"
                                : "Sistemas e Ferramentas"
                          }
                          onChange={(e) => {
                            if (e.target.value === "nova") {
                              setIsAddingCategory(true);
                              setFormData({ ...formData, category: "" });
                            } else {
                              setFormData({ ...formData, category: e.target.value });
                            }
                          }}
                        >
                          {uniqueCategories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                          <option value="nova" className="font-bold text-primary">
                            ➕ Criar nova categoria...
                          </option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-muted-foreground">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 12 12"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M2.5 4.5L6 8L9.5 4.5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tipo de Despesa */}
                  <div className="space-y-3">
                    <Label className="text-[11px] uppercase font-bold text-muted-foreground tracking-widest">
                      Tipo de Gasto
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-muted-foreground">
                        <Wallet className="h-5 w-5" />
                      </div>
                      <select
                        title="Tipo de despesa"
                        className="w-full pl-12 pr-10 appearance-none rounded-2xl border border-border/50 bg-muted/30 hover:bg-muted/50 focus:bg-background h-14 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-medium text-foreground text-[15px] cursor-pointer shadow-sm"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      >
                        <option value="fixed">Custo Fixo Mensal</option>
                        <option value="variable">Relativo / Variável</option>
                        <option value="installment">Compra Parcelada</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-muted-foreground">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 12 12"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M2.5 4.5L6 8L9.5 4.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
                  <div className="space-y-3">
                    <Label className="text-[11px] uppercase font-bold text-muted-foreground tracking-widest">
                      Situação
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-muted-foreground">
                        <Activity className="h-5 w-5" />
                      </div>
                      <select
                        title="Status da despesa"
                        className="w-full pl-12 pr-10 appearance-none rounded-2xl border border-border/50 bg-muted/30 hover:bg-muted/50 focus:bg-background h-14 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-medium text-foreground text-[15px] cursor-pointer shadow-sm"
                        value={formData.status}
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          // Se marcar como pago e não tiver data, preenche com hoje
                          const autoDate = newStatus === "paid" && !formData.paid_at
                            ? format(new Date(), "yyyy-MM-dd")
                            : formData.paid_at;
                          setFormData({ ...formData, status: newStatus, paid_at: autoDate });
                        }}
                      >
                        <option value="pending">A Pagar (Pendente)</option>
                        <option value="paid">Já Foi Pago</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-muted-foreground">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 12 12"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M2.5 4.5L6 8L9.5 4.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Campo Data de Pagamento - só aparece quando pago */}
                  {formData.status === "paid" && (
                    <div className="space-y-3 md:col-span-2">
                      <Label className="text-[11px] uppercase font-bold text-emerald-600 tracking-widest">
                        📅 Data de Pagamento Real
                      </Label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-emerald-500">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <Input
                          type="date"
                          value={formData.paid_at}
                          onKeyDown={(e) => {
                            // Bloqueia digitação manual de números — força uso do seletor nativo
                            if (e.key >= '0' && e.key <= '9') e.preventDefault();
                          }}
                          onChange={(e) => {
                            const val = e.target.value; // formato: YYYY-MM-DD
                            if (!val) return;
                            const year = parseInt(val.split('-')[0]);
                            // Só aceita se o ano for razoável
                            if (year >= 2020 && year <= 2035) {
                              setFormData({ ...formData, paid_at: val });
                            }
                          }}
                          className="pl-12 rounded-2xl border-emerald-300/60 bg-emerald-50/40 hover:bg-emerald-50/60 focus:bg-background h-14 focus-visible:ring-emerald-500/30 transition-all font-medium text-[15px] shadow-sm"
                        />
                        <p className="text-[11px] text-muted-foreground mt-1 ml-1">
                          Se pagou em data diferente do vencimento, informe aqui a data real do pagamento.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label className="text-[11px] uppercase font-bold text-muted-foreground tracking-widest">
                      Conta
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-muted-foreground">
                        <Wallet className="h-5 w-5" />
                      </div>
                      <select
                        title="Conta da despesa"
                        className="w-full pl-12 pr-10 appearance-none rounded-2xl border border-border/50 bg-muted/30 hover:bg-muted/50 focus:bg-background h-14 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-medium text-foreground text-[15px] cursor-pointer shadow-sm"
                        value={formData.bank_account}
                        onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                      >
                        <option value="rinaldopedroso">Rinaldo Pedroso</option>
                        <option value="boracorrerclub">Superação Assessoria</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-muted-foreground">
                        <svg width="14" height="14" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/40">
                  <Button
                    type="submit"
                    className="w-full h-14 rounded-2xl text-[16px] font-bold shadow-[0_8px_20px_-8px_rgba(var(--primary),0.5)] bg-primary hover:bg-primary/90 text-primary-foreground transition-all flex items-center justify-center gap-2"
                    disabled={saveMutation.isPending}
                  >
                    {saveMutation.isPending ? (
                      "Processando..."
                    ) : (
                      <>
                        {editingExpense ? "Atualizar Registro" : "Confirmar Lançamento"}
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* BARRA DE FILTROS SUPERIOR */}
      <Card className="border-border/50 shadow-sm overflow-visible">
        <div className="p-4 flex flex-wrap gap-4 lg:gap-6 items-end bg-muted/20">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Filtro de Período
            </label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px] bg-background border-primary/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthNames.map((m, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    {m} (30 Dias)
                  </SelectItem>
                ))}
                <SelectItem value="3months" className="font-semibold text-primary">⚡ Trimestral (3 Meses)</SelectItem>
                <SelectItem value="6months" className="font-semibold text-primary">⚡ Semestral (6 Meses)</SelectItem>
                <SelectItem value="year" className="font-semibold text-primary">⚡ Anual (Este Ano)</SelectItem>
                <SelectItem value="custom" className="font-semibold text-purple-600">🎯 Personalizado</SelectItem>
                <SelectItem value="all" className="font-semibold text-primary">⚡ Todo o Histórico</SelectItem>
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
                <SelectItem value="paid">Pagos</SelectItem>
                <SelectItem value="pending">Abertos / Pendentes</SelectItem>
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
        </div>

        {/* KPI CARDS (PAGOS, ABERTOS, TOTAL) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-y border-border/40 divide-y md:divide-y-0 md:divide-x divide-border/40">
          {/* Pagos */}
          <div className="p-6 pb-5">
            <div className="flex flex-col gap-5">
              <div>
                <div className="text-2xl sm:text-3xl font-light text-foreground mb-1">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                    totalPagos
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-info text-[#1f88c8] font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Pagos
                </div>
              </div>
            </div>
          </div>

          {/* Abertos */}
          <div className="p-6 pb-5">
            <div className="flex flex-col gap-5">
              <div>
                <div className="text-2xl sm:text-3xl font-light text-foreground mb-1">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                    totalAbertos
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-orange-500 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> Abertos
                </div>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="p-6 pb-5 bg-muted/5">
            <div className="flex flex-col gap-5">
              <div>
                <div className="text-2xl sm:text-3xl font-light text-foreground mb-1">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                    totalGeral
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
                  <DollarSign className="w-3.5 h-3.5" /> Total Esperado
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* GRAFICO EVOLUCAO MENSAL DE DESPESAS */}
        <div className="p-6 border-b border-border/40">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-6">
            Evolução das Despesas
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
                  formatter={(value: number) => [
                    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value), 
                    "Despesa Custo Total"
                  ]}
                  labelStyle={{
                    fontWeight: "bold",
                    color: "hsl(var(--foreground))",
                    marginBottom: "4px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="Valor"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#ef4444", strokeWidth: 2, stroke: "white" }}
                  activeDot={{ r: 6, fill: "#ef4444", strokeWidth: 0 }}
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
              placeholder="Pesquisar fatura na tabela abaixo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-background h-9 text-sm border-border/60 shadow-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-background border-b border-border/50 text-xs text-muted-foreground tracking-wider font-semibold uppercase">
              <tr>
                <th className="px-5 py-4 w-12 text-center">#</th>
                <th className="px-4 py-4">Nome da Fatura</th>
                <th className="px-4 py-4">Tipo</th>
                <th className="px-4 py-4">Valor</th>
                <th className="px-4 py-4">Vencimento</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30 bg-background">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">
                    Carregando despesas...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-6 h-6 opacity-30" />
                      <p>Nenhum pagamento encontrado para este mês.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense: any, idx: number) => {
                  const isOverdue =
                    expense.status === "pending" &&
                    new Date(expense.due_date) < new Date(new Date().setHours(0, 0, 0, 0));
                  return (
                    <tr
                      key={expense.id}
                      className="group hover:bg-muted/10 transition-colors duration-200"
                    >
                      <td className="px-5 py-4 text-center text-muted-foreground text-xs">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="text-[#1f88c8] hover:underline font-medium cursor-pointer"
                            onClick={() => handleEdit(expense)}
                          >
                            {expense.description}
                          </div>
                          {expense.receipt_url && (
                            <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-600 transition-colors" title="Ver Comprovante Anexo">
                              <CheckCircle2 className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                        {expense.bank_account && (
                          <div className="mt-1 flex items-center gap-1 opacity-60">
                            <Wallet className="w-3 h-3" /> 
                            <span className="text-[10px] uppercase font-bold tracking-wider">{expense.bank_account === 'boracorrerclub' ? 'BORA' : 'RINALDO'}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground text-xs flex flex-col items-start gap-1">
                        <Badge variant="outline" className="font-normal text-[10px] bg-background">
                          {expense.category && expense.category !== "general"
                            ? expense.category
                            : "Sistemas/Outros"}
                        </Badge>
                        <span
                          className="text-muted-foreground/80 mt-1 uppercase tracking-wider font-semibold"
                          style={{ fontSize: "9px" }}
                        >
                          {expense.type === "fixed"
                            ? "Custo Fixo"
                            : expense.type === "installment"
                              ? "Parcelado"
                              : "Relativo (Variável)"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(expense.amount)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex bg-muted/30 px-2 py-0.5 rounded-sm items-center gap-1.5 text-[13px] font-medium text-muted-foreground whitespace-nowrap">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {(() => {
                              const ds = expense.due_date.split('T')[0];
                              const [y, m, d] = ds.split('-');
                              const dtSafe = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
                              return format(dtSafe, "dd/MM/yyyy");
                            })()}
                          </div>
                          {isOverdue && (
                            <Badge className="bg-red-500/10 text-red-500 border-none px-1.5 py-0 text-[9px] uppercase tracking-wider">
                              Vencido
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => toggleStatus(expense)}
                          className="transition-transform active:scale-95 outline-none"
                        >
                          {expense.status === "paid" ? (
                            <Badge className="bg-[#1f88c8]/10 text-[#1f88c8] border-none font-semibold hover:bg-[#1f88c8]/20 transition-colors">
                              Pago ✓
                            </Badge>
                          ) : (
                            <Badge className="bg-[#1f88c8] text-white border-none font-semibold hover:bg-[#1f88c8]/90 transition-colors">
                              Aberto
                            </Badge>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleEdit(expense)}
                            className="h-7 text-xs bg-[#1f88c8] hover:bg-[#1f88c8]/90 text-white gap-2"
                          >
                            <Menu className="w-3.5 h-3.5" /> Menu
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(expense.id)}
                            className="h-7 w-7 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
