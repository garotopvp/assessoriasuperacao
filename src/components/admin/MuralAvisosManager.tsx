import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Megaphone, Plus, Trash2, Calendar, Users, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Squad {
  id: string;
  name: string;
}

interface Notice {
  id: string;
  squad_id: string | null;
  title: string;
  content: string;
  created_at: string;
  active: boolean;
  important: boolean;
  squads?: { name: string } | null;
}

export function MuralAvisosManager() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // New Notice State
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [selectedSquad, setSelectedSquad] = useState<string>("all");
  const [isImportant, setIsImportant] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch Squads
      const { data: squadsData, error: squadsError } = await supabase
        .from("squads")
        .select("id, name");

      if (squadsError) throw squadsError;
      setSquads(squadsData || []);

      // Fetch Notices
      const { data: noticesData, error: noticesError } = await supabase
        .from("squad_notices")
        .select(`
          *,
          squads:squad_id (name)
        `)
        .order("created_at", { ascending: false });

      if (noticesError) throw noticesError;
      setNotices(noticesData || []);
    } catch (err: any) {
      console.error("Erro ao carregar avisos:", err);
      toast.error("Erro ao carregar avisos: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddNotice() {
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error("Preencha o título e o conteúdo.");
      return;
    }

    try {
      const { error } = await supabase.from("squad_notices").insert([
        {
          title: newTitle,
          content: newContent,
          squad_id: selectedSquad === "all" ? null : selectedSquad,
          important: isImportant,
        },
      ]);

      if (error) throw error;

      toast.success("Aviso publicado com sucesso!");
      setNewTitle("");
      setNewContent("");
      setIsAdding(false);
      fetchData();
    } catch (err: any) {
      toast.error("Erro ao publicar: " + err.message);
    }
  }

  async function handleDeleteNotice(id: string) {
    if (!confirm("Tem certeza que deseja remover este aviso?")) return;

    try {
      const { error } = await supabase.from("squad_notices").delete().eq("id", id);
      if (error) throw error;
      toast.success("Aviso removido.");
      fetchData();
    } catch (err: any) {
      toast.error("Erro ao remover: " + err.message);
    }
  }

  if (loading && notices.length === 0) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Carregando mural...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Mural de Avisos</h2>
          <p className="text-muted-foreground">Comunique-se com seus squads ou com todos os alunos.</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? "outline" : "default"} className="gap-2">
          {isAdding ? "Cancelar" : <><Plus className="w-4 h-4" /> Novo Aviso</>}
        </Button>
      </div>

      {isAdding && (
        <Card className="border-primary/20 shadow-md animate-in fade-in slide-in-from-top-2">
          <CardHeader>
            <CardTitle className="text-lg">Criar Novo Comunicado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título do Aviso</label>
                <Input 
                  placeholder="Ex: Treino de Sábado" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Público Alvo (Squad)</label>
                <Select value={selectedSquad} onValueChange={setSelectedSquad}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Alunos</SelectItem>
                    {squads.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Conteúdo do Aviso</label>
              <Textarea 
                placeholder="Escreva a mensagem aqui..." 
                className="min-h-[120px]"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="important" 
                checked={isImportant}
                onChange={(e) => setIsImportant(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="important" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" /> Marcar como Importante
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={handleAddNotice} className="w-full md:w-auto px-8">Publicar Agora</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {notices.length === 0 ? (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Megaphone className="w-12 h-12 mb-4 opacity-20" />
              <p>Nenhum aviso publicado recentemente.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {notices.map((notice) => (
              <Card key={notice.id} className={`transition-all hover:shadow-md ${notice.important ? 'border-amber-200 bg-amber-50/10' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {notice.important && (
                          <Badge variant="warning" className="bg-amber-100 text-amber-700 border-amber-200">
                            IMPORTANTE
                          </Badge>
                        )}
                        <CardTitle className="text-lg">{notice.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> 
                          {notice.squads?.name || "Todos os Alunos"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> 
                          {format(new Date(notice.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteNotice(notice.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{notice.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
