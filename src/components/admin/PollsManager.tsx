import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, BarChart3, Users, Clock, CheckCircle2, XCircle, Pause } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Poll {
  id: string;
  title: string;
  question: string;
  options: string[];
  status: "ACTIVE" | "PAUSED" | "CLOSED";
  target_audience: string;
  auto_send: boolean;
  created_at: string;
  starts_at?: string;
  ends_at?: string;
  response_count?: number;
}

interface PollResponse {
  id: string;
  poll_id: string;
  student_phone: string;
  option_index: number;
  option_text: string;
  created_at: string;
}

export function PollsManager() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [responses, setResponses] = useState<PollResponse[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [targetAudience, setTargetAudience] = useState("ALL");
  const [autoSend, setAutoSend] = useState(false);

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("polls")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar enquetes");
      console.error(error);
    } else {
      // Buscar contagem de respostas para cada enquete
      const pollsWithCounts = await Promise.all(
        (data || []).map(async (poll) => {
          const { count } = await supabase
            .from("poll_responses")
            .select("*", { count: "exact", head: true })
            .eq("poll_id", poll.id);

          return { ...poll, response_count: count || 0 };
        })
      );
      setPolls(pollsWithCounts);
    }
    setLoading(false);
  };

  const fetchResponses = async (pollId: string) => {
    const { data, error } = await supabase
      .from("poll_responses")
      .select("*")
      .eq("poll_id", pollId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar respostas");
      console.error(error);
    } else {
      setResponses(data || []);
    }
  };

  const createPoll = async () => {
    if (!title || !question || options.filter((o) => o.trim()).length < 2) {
      toast.error("Preencha todos os campos e adicione pelo menos 2 opções");
      return;
    }

    const { error } = await supabase.from("polls").insert([
      {
        title,
        question,
        options: options.filter((o) => o.trim()),
        target_audience: targetAudience,
        auto_send: autoSend,
        status: "ACTIVE",
      },
    ]);

    if (error) {
      toast.error("Erro ao criar enquete");
      console.error(error);
    } else {
      toast.success("Enquete criada com sucesso!");
      setShowCreateDialog(false);
      resetForm();
      fetchPolls();
    }
  };

  const updatePollStatus = async (pollId: string, newStatus: "ACTIVE" | "PAUSED" | "CLOSED") => {
    const { error } = await supabase.from("polls").update({ status: newStatus }).eq("id", pollId);

    if (error) {
      toast.error("Erro ao atualizar status");
      console.error(error);
    } else {
      toast.success("Status atualizado!");
      fetchPolls();
    }
  };

  const deletePoll = async (pollId: string) => {
    if (
      !confirm("Tem certeza que deseja excluir esta enquete? Todas as respostas serão perdidas.")
    ) {
      return;
    }

    const { error } = await supabase.from("polls").delete().eq("id", pollId);

    if (error) {
      toast.error("Erro ao excluir enquete");
      console.error(error);
    } else {
      toast.success("Enquete excluída!");
      fetchPolls();
    }
  };

  const resetForm = () => {
    setTitle("");
    setQuestion("");
    setOptions(["", ""]);
    setTargetAudience("ALL");
    setAutoSend(false);
  };

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Ativa
          </Badge>
        );
      case "PAUSED":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-500">
            <Pause className="w-3 h-3 mr-1" /> Pausada
          </Badge>
        );
      case "CLOSED":
        return (
          <Badge variant="outline">
            <XCircle className="w-3 h-3 mr-1" /> Encerrada
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const calculateResults = (poll: Poll) => {
    const pollResponses = responses.filter((r) => r.poll_id === poll.id);
    const total = pollResponses.length;

    return poll.options.map((option, index) => {
      const count = pollResponses.filter((r) => r.option_index === index).length;
      const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : "0";
      return { option, count, percentage };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Enquetes</h2>
          <p className="text-muted-foreground">Crie e gerencie enquetes para seus alunos</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Enquete
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Enquete</DialogTitle>
              <DialogDescription>
                Crie uma enquete para coletar feedback dos seus alunos
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="title">Título da Enquete</Label>
                <Input
                  id="title"
                  placeholder="Ex: Pesquisa de Satisfação"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="question">Pergunta</Label>
                <Textarea
                  id="question"
                  placeholder="Ex: Como você avalia nosso treino de hoje?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label>Opções de Resposta</Label>
                <div className="space-y-2 mt-2">
                  {options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`Opção ${index + 1}`}
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                      />
                      {options.length > 2 && (
                        <Button variant="outline" size="icon" onClick={() => removeOption(index)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                {options.length < 10 && (
                  <Button variant="outline" size="sm" onClick={addOption} className="mt-2">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Opção
                  </Button>
                )}
              </div>

              <div>
                <Label htmlFor="audience">Público-Alvo</Label>
                <Select value={targetAudience} onValueChange={setTargetAudience}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value="STUDENTS_ONLY">Apenas Alunos</SelectItem>
                    <SelectItem value="TRIAL_ONLY">Apenas Trial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Envio Automático</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar automaticamente quando aluno entrar em contato
                  </p>
                </div>
                <Switch checked={autoSend} onCheckedChange={setAutoSend} />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={createPoll}>Criar Enquete</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12">Carregando...</div>
      ) : polls.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma enquete criada ainda</p>
            <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Enquete
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {polls.map((poll) => (
            <Card key={poll.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle>{poll.title}</CardTitle>
                      {getStatusBadge(poll.status)}
                      {poll.auto_send && (
                        <Badge variant="outline" className="border-blue-500 text-blue-500">
                          <Clock className="w-3 h-3 mr-1" /> Auto
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{poll.question}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {poll.status === "ACTIVE" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updatePollStatus(poll.id, "PAUSED")}
                      >
                        Pausar
                      </Button>
                    )}
                    {poll.status === "PAUSED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updatePollStatus(poll.id, "ACTIVE")}
                      >
                        Ativar
                      </Button>
                    )}
                    {poll.status !== "CLOSED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updatePollStatus(poll.id, "CLOSED")}
                      >
                        Encerrar
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => deletePoll(poll.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{poll.response_count || 0} respostas</span>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPoll(poll);
                          fetchResponses(poll.id);
                        }}
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Ver Resultados
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{poll.title}</DialogTitle>
                        <DialogDescription>{poll.question}</DialogDescription>
                      </DialogHeader>

                      {selectedPoll?.id === poll.id && (
                        <div className="space-y-4 py-4">
                          <div className="text-sm text-muted-foreground">
                            Total de respostas: {responses.length}
                          </div>

                          {calculateResults(poll).map((result, index) => (
                            <div key={index} className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium">{result.option}</span>
                                <span className="text-muted-foreground">
                                  {result.count} ({result.percentage}%)
                                </span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full transition-all"
                                  style={{ width: `${result.percentage}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
