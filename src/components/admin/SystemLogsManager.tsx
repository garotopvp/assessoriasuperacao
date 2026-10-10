import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RefreshCw, Search, ArrowDownToLine, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SystemLog = {
  id: string;
  created_at: string;
  action: string;
  category: string;
  level: string;
  message: string;
  details: any;
  user_id: string | null;
  profiles: { nome_completo: string | null; email: string | null } | null;
};

export function SystemLogsManager() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("system_logs")
        .select(
          `
          *,
          profiles:user_id(nome_completo, email)
        `
        )
        .order("created_at", { ascending: false })
        .limit(100);

      if (filterLevel !== "all") {
        query = query.eq("level", filterLevel);
      }

      if (filterCategory !== "all") {
        query = query.eq("category", filterCategory);
      }

      if (searchTerm) {
        query = query.or(`message.ilike.%${searchTerm}%,action.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      console.error("Error fetching logs:", error);
      toast({
        title: "Erro ao buscar logs",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterLevel, filterCategory, searchTerm]);

  const getLevelBadgeValue = (level: string) => {
    switch (level) {
      case "error":
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Erro
          </span>
        );
      case "warning":
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
            Aviso
          </span>
        );
      case "info":
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
            Info
          </span>
        );
      default:
        return level;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border">
        <div className="flex gap-4 items-center w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ocorrências..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Nível" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Níveis</SelectItem>
              <SelectItem value="info">Info / Sucesso</SelectItem>
              <SelectItem value="warning">Avisos (Warning)</SelectItem>
              <SelectItem value="error">Erros (Error)</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Categ.</SelectItem>
              <SelectItem value="system">Sistema Real</SelectItem>
              <SelectItem value="user_action">Ação Humana</SelectItem>
              <SelectItem value="edge_function">Integrações/Bots</SelectItem>
              <SelectItem value="notification">Notificações</SelectItem>
              <SelectItem value="payment">Pagamentos</SelectItem>
              <SelectItem value="webhook">Webhooks</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
          <Button
            onClick={() => fetchLogs()}
            disabled={loading}
            variant="outline"
            className="w-full md:w-auto gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Data / Hora</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead className="max-w-[300px]">Mensagem</TableHead>
                <TableHead>Detalhes Téc.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Carregando logs...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum log encontrado para estes filtros.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="text-sm">
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                    </TableCell>
                    <TableCell>{getLevelBadgeValue(log.level)}</TableCell>
                    <TableCell className="text-xs uppercase text-muted-foreground">
                      {log.category}
                    </TableCell>
                    <TableCell className="font-medium text-xs uppercase text-muted-foreground">
                      {log.action}
                    </TableCell>
                    <TableCell>
                      {log.user_id ? (
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {log.profiles?.nome_completo || "Admin"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {log.profiles?.email || "N/A"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic text-xs">Sistema Auto</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate" title={log.message}>
                      {log.message}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          alert(JSON.stringify(log.details, null, 2));
                        }}
                        disabled={!log.details || Object.keys(log.details).length === 0}
                      >
                        Ver JSON
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
