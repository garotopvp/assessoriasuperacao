import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Calendar, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";

interface Notice {
  id: string;
  title: string;
  content: string;
  created_at: string;
  important: boolean;
  squad_id: string | null;
}

export function MuralAvisos({ squadId }: { squadId: string | null | undefined }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (squadId !== undefined) {
      fetchNotices();
    }
  }, [squadId]);

  async function fetchNotices() {
    setLoading(true);
    try {
      let query = supabase
        .from("squad_notices")
        .select("*")
        .eq("active", true)
        .order("important", { ascending: false })
        .order("created_at", { ascending: false });

      // Filter by squad or global
      if (squadId) {
        query = query.or(`squad_id.is.null,squad_id.eq.${squadId}`);
      } else {
        query = query.is("squad_id", null);
      }

      const { data, error } = await query.limit(10);

      if (error) throw error;
      setNotices(data || []);
      
      // Auto-expand first important notice
      if (data && data.length > 0 && data[0].important) {
        setExpandedId(data[0].id);
      }
    } catch (err) {
      console.error("Erro ao carregar mural:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="animate-pulse flex items-center gap-2 text-muted-foreground p-4">
      <Megaphone className="w-4 h-4" /> Carregando avisos...
    </div>;
  }

  if (notices.length === 0) return null;

  return (
    <div className="space-y-4 mb-8">
      <div className="flex items-center gap-2 text-primary font-black uppercase text-sm tracking-wider">
        <Megaphone className="w-4 h-4" />
        Mural de Avisos
      </div>
      
      <div className="grid gap-3">
        {notices.map((notice) => (
          <Card 
            key={notice.id} 
            className={`overflow-hidden border-l-4 transition-all ${
              notice.important 
              ? 'border-l-amber-500 bg-amber-50/20' 
              : 'border-l-primary/40 bg-card'
            }`}
          >
            <CardHeader className="p-4 cursor-pointer hover:bg-muted/30" onClick={() => setExpandedId(expandedId === notice.id ? null : notice.id)}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {notice.important && (
                      <AlertCircle className="w-4 h-4 text-amber-600 fill-amber-100 shrink-0" />
                    )}
                    <h3 className={`font-bold leading-tight ${notice.important ? 'text-amber-900' : ''}`}>
                      {notice.title}
                    </h3>
                  </div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(notice.created_at), "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                  {expandedId === notice.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>
            </CardHeader>
            {expandedId === notice.id && (
              <CardContent className="px-4 pb-4 pt-0 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed border-t border-border/40 pt-3">
                  {notice.content}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
