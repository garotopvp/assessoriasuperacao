import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function AdminNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchRecentLogs = async () => {
    // Busca os logs mais recentes que são úteis para notificar (pagamentos, novos usuários, webhooks)
    const { data, error } = await supabase
      .from("system_logs")
      .select("*")
      .in("category", ["payment", "user_action", "webhook", "system"])
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Erro ao buscar notificações", error);
      return;
    }

    setNotifications(data || []);
    // Para simplificar, todas são consideradas não lidas até que o menu seja aberto
    setUnreadCount(data ? data.length : 0);
  };

  useEffect(() => {
    fetchRecentLogs();

    // Inscreve no Realtime para novos logs
    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "system_logs" },
        (payload) => {
          const newLog = payload.new;
          if (["payment", "user_action", "webhook", "system"].includes(newLog.category)) {
            setNotifications((prev) => [newLog, ...prev].slice(0, 10));
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setUnreadCount(0); // Marca como lido ao abrir o dropdown
    }
  };

  const getIcon = (level: string) => {
    switch (level) {
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case "info":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative transition-colors hover:bg-muted focus:outline-none"
        >
          <Bell className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center p-0 text-[10px] bg-red-500 text-white animate-in zoom-in"
              variant="destructive"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 sm:w-96 max-h-[400px] overflow-y-auto p-0">
        <div className="flex items-center justify-between p-3 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
          <span className="font-semibold text-sm">Notificações Recentes</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-1 text-xs text-muted-foreground hovet:text-primary"
            onClick={fetchRecentLogs}
          >
            Atualizar
          </Button>
        </div>

        <div className="flex flex-col">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhuma notificação nova.
            </div>
          ) : (
            notifications.map((notif, index) => (
              <div key={notif.id || index}>
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-default focus:bg-muted/50 rounded-none">
                  <div className="flex items-start gap-3 w-full">
                    <div className="mt-0.5 shrink-0 bg-background rounded-full">
                      {getIcon(notif.level)}
                    </div>
                    <div className="flex flex-col gap-0.5 w-full">
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                          {notif.action}
                        </span>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(notif.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                      <span className="text-sm font-medium leading-snug line-clamp-2">
                        {notif.message}
                      </span>
                    </div>
                  </div>
                </DropdownMenuItem>
                {index < notifications.length - 1 && <DropdownMenuSeparator className="m-0" />}
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
