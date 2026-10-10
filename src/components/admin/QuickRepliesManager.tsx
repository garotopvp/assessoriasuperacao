import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";

interface QuickReply {
  id: string;
  title: string;
  keywords: string[];
  message: string;
  category?: string;
  usage_count: number;
  is_active: boolean;
}

export function QuickRepliesManager() {
  const [replies, setReplies] = useState<QuickReply[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [title, setTitle] = useState("");
  const [keywords, setKeywords] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    fetchReplies();
  }, []);

  const fetchReplies = async () => {
    const { data } = await supabase
      .from("quick_replies")
      .select("*")
      .order("usage_count", { ascending: false });
    setReplies(data || []);
  };

  const createReply = async () => {
    if (!title || !keywords || !message) {
      toast.error("Preencha todos os campos");
      return;
    }

    const { error } = await supabase.from("quick_replies").insert([
      {
        title,
        keywords: keywords.split(",").map((k) => k.trim().toLowerCase()),
        message,
        category,
      },
    ]);

    if (error) {
      toast.error("Erro ao criar resposta rápida");
    } else {
      toast.success("Resposta rápida criada!");
      setShowDialog(false);
      setTitle("");
      setKeywords("");
      setMessage("");
      setCategory("");
      fetchReplies();
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await supabase.from("quick_replies").update({ is_active: !isActive }).eq("id", id);
    fetchReplies();
  };

  const deleteReply = async (id: string) => {
    if (!confirm("Excluir esta resposta rápida?")) return;
    await supabase.from("quick_replies").delete().eq("id", id);
    toast.success("Resposta excluída!");
    fetchReplies();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Respostas Rápidas</h2>
          <p className="text-muted-foreground">Respostas automáticas para perguntas frequentes</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Resposta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Resposta Rápida</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Título</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Horários de Treino"
                />
              </div>
              <div>
                <Label>Palavras-chave (separadas por vírgula)</Label>
                <Input
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="horário, treino, quando"
                />
              </div>
              <div>
                <Label>Mensagem</Label>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} />
              </div>
              <div>
                <Label>Categoria (opcional)</Label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="TREINO, FINANCEIRO, etc."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={createReply}>Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {replies.map((reply) => (
          <Card key={reply.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">{reply.title}</CardTitle>
                    {reply.is_active ? (
                      <Badge className="bg-green-500">Ativa</Badge>
                    ) : (
                      <Badge variant="outline">Inativa</Badge>
                    )}
                    {reply.category && <Badge variant="outline">{reply.category}</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{reply.message}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {reply.keywords.map((kw, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        <Zap className="w-3 h-3 mr-1" />
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(reply.id, reply.is_active)}
                  >
                    {reply.is_active ? "Desativar" : "Ativar"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => deleteReply(reply.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Usada {reply.usage_count} vezes</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
