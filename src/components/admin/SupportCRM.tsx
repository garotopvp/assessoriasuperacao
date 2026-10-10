import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  MessageSquare,
  Send,
  Search,
  CheckCircle,
  Clock,
  MoreVertical,
  Phone,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Mic,
  X,
  Plus,
  Tag,
  AlertCircle,
  Eye,
  Hand,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SupportSettings, ResponseTemplate } from "./SupportSettings";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquarePlus } from "lucide-react";

interface SupportSession {
  id: string;
  student_phone: string;
  status:
    | "WAITING_NAME"
    | "CONFIRMING_NAME"
    | "WAITING_EXPERIENCE"
    | "WAITING_GOAL"
    | "WAITING_MENU"
    | "WAITING_TRAINER"
    | "ACTIVE"
    | "CLOSED"
    | "BOT";
  sector: string | null;
  last_interaction: string;
  created_at: string;
  profile?: {
    nome_completo: string;
    email: string;
    avatar_url: string;
    cpf?: string;
    endereco?: string;
  } | null;
  unread_count?: number;
  tags?: string[];
  sentiment_label?: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  sentiment_score?: number;
  admin_phone?: string;
  summary?: string;
}

interface SupportMessage {
  id: string;
  session_id: string;
  sender_type: "STUDENT" | "ADMIN" | "SYSTEM" | "BOT";
  content: string;
  media_url?: string;
  media_type?: "image" | "audio" | "video" | "document";
  is_internal?: boolean;
  created_at: string;
}

interface StudentContext {
  profile: {
    nome_completo: string | null;
    email: string | null;
    cpf: string | null;
    endereco: string | null;
  } | null;
  subscription: {
    status: string;
    plan_name: string | null;
    amount: number;
    next_billing_date: string;
  } | null;
  totalOrders: number;
}

export function SupportCRM() {
  const [sessions, setSessions] = useState<SupportSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<SupportSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sending, setSending] = useState(false);
  const [studentContext, setStudentContext] = useState<StudentContext | null>(null);
  const [uploading, setUploading] = useState(false);
  const [internal, setInternal] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [currentUserName, setCurrentUserName] = useState("Suporte");
  const [templates, setTemplates] = useState<ResponseTemplate[]>([]);
  const [newTag, setNewTag] = useState("");
  const [activeTab, setActiveTab] = useState("human"); // 'human' or 'bot'

  // SLA Helper
  const getSLAColor = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const hours = diff / (1000 * 60 * 60);
    if (hours < 1) return "bg-green-500";
    if (hours < 4) return "bg-yellow-500";
    return "bg-red-500 animate-pulse";
  };

  const getSentimentIcon = (label?: string) => {
    if (label === "POSITIVE") return <span title="Positivo">😊</span>;
    if (label === "NEGATIVE") return <span title="Negativo">😠</span>;
    return null;
  };

  const handleAddTag = async () => {
    if (!selectedSessionId || !newTag.trim()) return;
    const session = sessions.find((s) => s.id === selectedSessionId);
    if (!session) return;

    const currentTags = session.tags || [];
    if (currentTags.includes(newTag.trim())) {
      setNewTag("");
      return;
    }

    const updatedTags = [...currentTags, newTag.trim()];
    setSessions((prev) =>
      prev.map((s) => (s.id === selectedSessionId ? { ...s, tags: updatedTags } : s))
    );

    const { error } = await supabase
      .from("support_sessions")
      .update({ tags: updatedTags } as any)
      .eq("id", selectedSessionId);

    if (error) {
      toast({ title: "Erro ao adicionar tag", variant: "destructive" });
      fetchSessions();
    }
    setNewTag("");
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!selectedSessionId) return;
    const session = sessions.find((s) => s.id === selectedSessionId);
    if (!session) return;

    const updatedTags = (session.tags || []).filter((t) => t !== tagToRemove);
    setSessions((prev) =>
      prev.map((s) => (s.id === selectedSessionId ? { ...s, tags: updatedTags } : s))
    );

    const { error } = await supabase
      .from("support_sessions")
      .update({ tags: updatedTags } as any)
      .eq("id", selectedSessionId);

    if (error) {
      toast({ title: "Erro ao remover tag", variant: "destructive" });
      fetchSessions();
    }
  };

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("nome_completo")
          .eq("id", user.id)
          .single();
        if (profile?.nome_completo) {
          const firstName = profile.nome_completo.split(" ")[0];
          setCurrentUserName(firstName);
        }
      }
    };
    getUser();
  }, []);

  // Fetch Sessions
  useEffect(() => {
    fetchSessions();
    fetchTemplates();

    const channel = supabase
      .channel("public:support_sessions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_sessions" },
        (payload) => {
          console.log("Session update:", payload);
          fetchSessions(); // Refresh list on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter Sessions based on Tab and Search
  useEffect(() => {
    let filtered = sessions;

    console.log("🔍 [DEBUG] Total sessions:", sessions.length);
    console.log("🔍 [DEBUG] Active tab:", activeTab);

    // Filter by Tab (Active vs Bot)
    if (activeTab === "human") {
      filtered = sessions.filter((s) => s.status === "ACTIVE");
    } else {
      // Todos os status gerenciados pelo bot
      filtered = sessions.filter((s) =>
        [
          "WAITING_NAME",
          "CONFIRMING_NAME",
          "WAITING_EXPERIENCE",
          "WAITING_GOAL",
          "WAITING_MENU",
          "WAITING_TRAINER",
          "BOT",
        ].includes(s.status)
      );
    }

    console.log("🔍 [DEBUG] Filtered sessions:", filtered.length, filtered);

    // Filter by Search
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.student_phone.includes(lower) ||
          s.profile?.nome_completo?.toLowerCase().includes(lower) ||
          s.sector?.toLowerCase().includes(lower)
      );
    }

    setFilteredSessions(filtered);
  }, [searchTerm, sessions, activeTab]);

  // Fetch Messages when Session Selected
  useEffect(() => {
    if (!selectedSessionId) return;

    fetchMessages(selectedSessionId);

    const channel = supabase
      .channel(`public:support_messages:session_${selectedSessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `session_id=eq.${selectedSessionId}`,
        },
        (payload) => {
          const newMsg = payload.new as SupportMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          setTimeout(scrollToBottom, 50);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedSessionId]);

  // Fetch Student Context when Session Selected
  useEffect(() => {
    if (!selectedSessionId) {
      setStudentContext(null);
      return;
    }
    fetchStudentContext(selectedSessionId);
  }, [selectedSessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const fetchTemplates = async () => {
    const { data } = await supabase
      .from("support_settings")
      .select("value")
      .eq("key", "response_templates")
      .single();

    if (data?.value) {
      setTemplates(data.value as any as ResponseTemplate[]);
    } else {
      setTemplates([
        { id: "1", label: "👋 Saudação (Dia)", text: "Bom dia! Tudo bem? Como posso ajudar?" },
        { id: "2", label: "👋 Saudação (Tarde)", text: "Boa tarde! Tudo bem? Como posso ajudar?" },
        {
          id: "3",
          label: "💰 Pagamento",
          text: "Poderia me enviar o comprovante de pagamento, por favor?",
        },
        { id: "4", label: "🤝 Fechamento", text: "Posso ajudar em algo mais?" },
      ]);
    }
  };

  const fetchSessions = async () => {
    try {
      const { data: sessionsData, error } = await supabase
        .from("support_sessions")
        .select("*, tags, sentiment_label, sentiment_score, summary")
        .neq("status", "CLOSED")
        .order("last_interaction", { ascending: false });

      if (error) throw error;

      const phones = sessionsData.map((s) => s.student_phone).filter(Boolean);
      let profilesMap: Record<string, any> = {};

      if (phones.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("nome_completo, email, telefone, cpf, endereco")
          .in("telefone", phones);

        if (profilesData) {
          profilesData.forEach((p) => {
            if (p.telefone) profilesMap[p.telefone] = p;
          });
        }
      }

      const formatted = sessionsData.map((item: any) => ({
        ...item,
        profile: profilesMap[item.student_phone] || null,
      }));

      setSessions(formatted);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchMessages = async (sessionId: string) => {
    const { data, error } = await supabase
      .from("support_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      setMessages(data as SupportMessage[]);
    }
  };

  const fetchStudentContext = async (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;

    const phone = session.student_phone;
    let context: StudentContext = {
      profile: session.profile
        ? {
            ...session.profile,
            cpf: session.profile.cpf || null,
            endereco: session.profile.endereco || null,
          }
        : null,
      subscription: null,
      totalOrders: 0,
    };

    try {
      const { data: subData } = await supabase
        .from("recurring_subscriptions")
        .select("status, plan_name, amount, next_billing_date")
        .eq("student_phone", phone)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subData) {
        context.subscription = subData;
      }

      if (context.profile?.email) {
        const { count } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("customer_email", context.profile.email);
        context.totalOrders = count || 0;
      }

      setStudentContext(context);
    } catch (error) {
      console.error("Error fetching student context:", error);
    }
  };

  const handleTakeover = async () => {
    if (!selectedSessionId) return;

    const { error } = await supabase
      .from("support_sessions")
      .update({ status: "ACTIVE", sector: "MANUAL_TAKEOVER" }) // Mark as active
      .eq("id", selectedSessionId);

    if (error) {
      toast({ title: "Erro ao assumir conversa", variant: "destructive" });
    } else {
      toast({ title: "Você assumiu o atendimento!" });
      setActiveTab("human"); // Switch to human tab automatically
      fetchSessions();
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputMessage.trim() && !fileInputRef.current?.files?.length) || !selectedSessionId)
      return;

    // Se estiver na aba BOT, enviamos mensagem e assumimos a conversa
    if (activeTab === "bot") {
      await handleTakeover();
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-support-message", {
        body: {
          sessionId: selectedSessionId,
          message: inputMessage,
          senderName: currentUserName,
          isInternal: internal,
        },
      });

      if (error) throw error;

      if (data?.data) {
        const newMsg = data.data;
        setMessages((prev) => [...prev, newMsg]);
        setTimeout(scrollToBottom, 50);
      }

      setInputMessage("");
      setInternal(false);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({ title: "Erro ao enviar mensagem", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedSessionId) return;

    if (activeTab === "bot") await handleTakeover();

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${selectedSessionId}/${Date.now()}.${fileExt}`;
      const bucket = "chat-uploads";

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(fileName);

      let mediaType = "document";
      if (file.type.startsWith("image/")) mediaType = "image";
      else if (file.type.startsWith("audio/")) mediaType = "audio";
      else if (file.type.startsWith("video/")) mediaType = "video";

      const { error: sendError } = await supabase.functions.invoke("send-support-message", {
        body: {
          sessionId: selectedSessionId,
          message: mediaType === "image" ? "📷 Imagem enviada" : `📎 Arquivo enviado: ${file.name}`,
          mediaUrl: publicUrl,
          mediaType: mediaType,
          senderName: currentUserName,
        },
      });

      if (sendError) throw sendError;

      toast({ title: "Arquivo enviado com sucesso!" });
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast({
        title: "Erro no envio",
        description: error.message || "Falha ao enviar arquivo.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const startRecording = async () => {
    try {
      if (activeTab === "bot") await handleTakeover();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const file = new File([blob], `audio-${Date.now()}.webm`, { type: "audio/webm" });

        setUploading(true);
        try {
          const fileName = `${selectedSessionId}/${Date.now()}.webm`;
          const bucket = "chat-uploads";
          const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file);
          if (uploadError) throw uploadError;

          const {
            data: { publicUrl },
          } = supabase.storage.from(bucket).getPublicUrl(fileName);

          await supabase.functions.invoke("send-support-message", {
            body: {
              sessionId: selectedSessionId,
              message: "🎤 Áudio enviado",
              mediaUrl: publicUrl,
              mediaType: "audio",
              senderName: currentUserName,
              isInternal: internal,
            },
          });
          toast({ title: "Áudio enviado!" });
        } catch (error) {
          console.error("Audio upload error:", error);
          toast({ title: "Erro ao enviar áudio", variant: "destructive" });
        } finally {
          setUploading(false);
        }
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast({ title: "Erro ao acessar microfone", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    setRecording(false);
  };

  const handleCloseSession = async () => {
    if (!selectedSessionId) return;

    const sendSurvey = confirm("Deseja encerrar este atendimento e enviar Pesquisa de Satisfação?");

    try {
      await supabase.functions.invoke("send-support-message", {
        body: {
          sessionId: selectedSessionId,
          message: sendSurvey
            ? "Obrigado pelo contato! Por favor, avalie nosso atendimento de 1 a 5. ⭐"
            : "Atendimento finalizado pelo suporte. Até breve!",
        },
      });

      const { error } = await supabase
        .from("support_sessions")
        .update({ status: "CLOSED" })
        .eq("id", selectedSessionId);

      if (error) throw error;

      toast({ title: "Atendimento encerrado!" });
      setSelectedSessionId(null);
      fetchSessions();
    } catch (e: any) {
      console.error("Error closing session:", e);
      toast({ title: "Erro ao encerrar", description: e.message, variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-500">Em Atendimento</Badge>;
      case "WAITING_MENU":
        return <Badge variant="secondary">No Menu</Badge>;
      case "WAITING_TRAINER":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-500">
            Escolhendo Treinador
          </Badge>
        );
      case "WAITING_NAME":
        return <Badge variant="secondary">Novo Contato</Badge>;
      case "CONFIRMING_NAME":
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-500">
            Confirmando Nome
          </Badge>
        );
      case "WAITING_EXPERIENCE":
        return (
          <Badge variant="outline" className="border-purple-500 text-purple-500">
            Informando Experiência
          </Badge>
        );
      case "WAITING_GOAL":
        return (
          <Badge variant="outline" className="border-indigo-500 text-indigo-500">
            Definindo Objetivo
          </Badge>
        );
      case "BOT":
        return (
          <Badge variant="outline" className="border-gray-500 text-gray-500">
            Com o Robô
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  return (
    <div className="flex h-[calc(100vh-140px)] border rounded-lg bg-card overflow-hidden shadow-sm">
      {/* Sidebar: Session List with Tabs */}
      <div className="w-1/3 md:w-80 border-r border-border flex flex-col bg-muted/10">
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Atendimentos
            </h2>
            <SupportSettings />
          </div>

          <Tabs defaultValue="human" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="human">Humanos</TabsTrigger>
              <TabsTrigger value="bot">O Robô</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar aluno..."
              className="pl-9 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            {filteredSessions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                {loadingSessions
                  ? "Carregando..."
                  : activeTab === "human"
                    ? "Nenhum humano falando."
                    : "O robô está ocioso."}
              </div>
            ) : (
              filteredSessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSessionId(session.id)}
                  className={cn(
                    "flex items-start gap-3 p-4 text-left border-b border-border/50 hover:bg-muted/50 transition-colors",
                    selectedSessionId === session.id && "bg-muted border-l-4 border-l-primary"
                  )}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={session.profile?.avatar_url} />
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold truncate flex items-center gap-1">
                        {session.profile?.nome_completo || session.student_phone}
                        {getSentimentIcon(session.sentiment_label)}
                      </span>
                      <div className="flex items-center gap-1">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full",
                            getSLAColor(session.last_interaction)
                          )}
                          title="SLA"
                        />
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(session.last_interaction), "HH:mm")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {getStatusBadge(session.status)}
                      {session.tags?.map((t) => (
                        <span
                          key={t}
                          className="px-1 py-0.5 rounded bg-muted text-[9px] text-muted-foreground border border-border"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {session.sector ? `Setor: ${session.sector}` : "No Fluxo Automático"}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat Main Area */}
        <div className="flex-1 flex flex-col bg-background relative border-r border-border">
          {selectedSession ? (
            <>
              {/* Chat Header */}
              <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card shrink-0">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={selectedSession.profile?.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {selectedSession.profile?.nome_completo?.charAt(0) || (
                        <User className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold leading-none">
                      {selectedSession.profile?.nome_completo || selectedSession.student_phone}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {selectedSession.student_phone}
                      {activeTab === "bot" && (
                        <span className="text-yellow-600 font-bold ml-2 flex items-center gap-1">
                          <Eye className="w-3 h-3" /> Espionando Robô
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {activeTab === "bot" && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleTakeover}
                      className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold animate-pulse"
                    >
                      <Hand className="w-4 h-4 mr-2" />
                      Assumir Conversa
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCloseSession}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Encerrar
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-5 h-5 text-muted-foreground" />
                  </Button>
                </div>
              </header>

              {/* Chat Messages */}
              <div
                className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 dark:bg-slate-900/50"
                ref={scrollRef}
              >
                {messages.map((msg) => {
                  const isInternal = msg.is_internal;
                  const isSystem = msg.sender_type === "SYSTEM" || msg.sender_type === "BOT"; // AI or Bot Message
                  const isStudent = msg.sender_type === "STUDENT";
                  const isAdmin = msg.sender_type === "ADMIN";

                  // In Spy Mode, we SHOW System/Bot messages as bubbles on the left/center
                  if (isSystem) {
                    return (
                      <div
                        key={msg.id}
                        className="flex justify-start my-4 ml-0 w-full animate-in fade-in slide-in-from-left-2"
                      >
                        <div className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-4 py-2 rounded-lg rounded-tl-none shadow-sm max-w-[80%]">
                          <p className="text-xs font-bold mb-1 flex items-center gap-1">
                            🤖 Robô{" "}
                            <span className="text-[10px] font-normal opacity-70">
                              {format(new Date(msg.created_at), "HH:mm")}
                            </span>
                          </p>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex max-w-[80%] flex-col gap-1 animate-in fade-in slide-in-from-bottom-2",
                        isStudent ? "mr-auto items-start" : "ml-auto items-end"
                      )}
                    >
                      <div
                        className={cn(
                          "p-3 rounded-lg text-sm shadow-sm relative group",
                          isInternal
                            ? "bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100"
                            : isStudent
                              ? "bg-white dark:bg-slate-800 border border-border text-foreground rounded-tl-none"
                              : "bg-primary text-primary-foreground rounded-tr-none"
                        )}
                      >
                        {isInternal && (
                          <span className="absolute -top-2 -right-2 text-[10px] bg-yellow-200 text-yellow-800 px-1 rounded shadow-sm border border-yellow-300">
                            Sussurro
                          </span>
                        )}
                        <p className="whitespace-pre-wrap text-left break-words">{msg.content}</p>
                        {msg.media_url && (
                          <div className="mt-2">
                            {msg.media_type === "image" ? (
                              <img
                                src={msg.media_url}
                                alt="media"
                                className="max-w-[200px] rounded-md cursor-pointer hover:opacity-90"
                                onClick={() => window.open(msg.media_url, "_blank")}
                              />
                            ) : msg.media_type === "audio" ? (
                              <audio controls src={msg.media_url} className="max-w-[200px]" />
                            ) : (
                              <a
                                href={msg.media_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-background/20 p-2 rounded flex items-center gap-2 hover:bg-background/30 transition-colors"
                              >
                                <FileText className="w-4 h-4" />
                                <span className="underline text-xs">Ver Arquivo</span>
                              </a>
                            )}
                          </div>
                        )}
                        {/* Sentiment Indicator on Message if available */}
                        {isStudent &&
                          selectedSession?.sentiment_label &&
                          messages[messages.length - 1].id === msg.id && (
                            <div className="absolute -bottom-2 -left-2 bg-background rounded-full border border-border p-0.5 shadow-sm text-xs">
                              {getSentimentIcon(selectedSession.sentiment_label)}
                            </div>
                          )}
                      </div>
                      <span className="text-[10px] text-muted-foreground px-1 flex items-center gap-1">
                        {format(new Date(msg.created_at), "HH:mm")} •{" "}
                        {isInternal ? (
                          <span className="text-yellow-600 font-bold flex items-center gap-0.5">
                            <Clock className="w-3 h-3" /> Nota Interna
                          </span>
                        ) : isAdmin ? (
                          currentUserName
                        ) : (
                          "Aluno"
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Input Area */}
              <footer
                className={cn(
                  "p-4 bg-card border-t border-border shrink-0 space-y-2",
                  activeTab === "bot" && "bg-yellow-50/10 border-yellow-200"
                )}
              >
                {/* Internal Checkbox */}
                <div className="flex items-center gap-2 px-1">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      title="Nota Interna"
                      checked={internal}
                      onChange={(e) => setInternal(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    {internal ? (
                      <span className="text-yellow-600 font-bold flex items-center gap-1">
                        🔒 Modo "Sussurro" (Apenas Interno)
                      </span>
                    ) : (
                      "Enviar como Nota Interna"
                    )}
                  </label>
                </div>

                <form
                  onSubmit={handleSendMessage}
                  className={cn(
                    "flex gap-2 items-end p-2 rounded-md transition-colors",
                    internal &&
                      "bg-yellow-50/50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/20"
                  )}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        title="Respostas Rápidas"
                        className="text-muted-foreground hover:text-primary"
                      >
                        <MessageSquarePlus className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64">
                      {templates.map((resp) => (
                        <DropdownMenuItem
                          key={resp.id}
                          onClick={() =>
                            setInputMessage((prev) => (prev ? `${prev}\n${resp.text}` : resp.text))
                          }
                          className="cursor-pointer"
                        >
                          <span className="truncate">{resp.label}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                    accept="image/*,application/pdf,audio/*,video/*"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    title="Anexar Arquivo"
                    className="text-muted-foreground hover:text-primary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Clock className="w-5 h-5 animate-spin" />
                    ) : (
                      <Paperclip className="h-5 w-5" />
                    )}
                  </Button>

                  <Button
                    variant={recording ? "destructive" : "ghost"}
                    size="icon"
                    type="button"
                    title={recording ? "Parar Gravação" : "Gravar Áudio"}
                    className={cn(
                      "text-muted-foreground hover:text-primary",
                      recording && "animate-pulse"
                    )}
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onMouseLeave={stopRecording} // Stop if drag out
                  >
                    <Mic className="h-5 w-5" />
                  </Button>

                  <Input
                    placeholder={
                      activeTab === "bot"
                        ? "Escreva para assumir a conversa..."
                        : "Digite sua mensagem..."
                    }
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={sending || (!inputMessage.trim() && !uploading)}
                    className={cn("transition-all", sending ? "opacity-50" : "")}
                    title={activeTab === "bot" ? "Enviar e Assumir" : "Enviar"}
                  >
                    {sending ? (
                      <Clock className="h-4 w-4 animate-spin" />
                    ) : activeTab === "bot" ? (
                      <Hand className="h-4 w-4" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </footer>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-slate-50/50">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-10 h-10 opacity-20" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">CRM de Suporte</h3>
              <p className="max-w-sm">Selecione uma conversa ao lado para iniciar o atendimento.</p>
              {activeTab === "bot" && (
                <p className="mt-4 text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full border border-yellow-200">
                  🕵️‍♂️ Você está no modo espião
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar: Context Info */}
        {selectedSession && (
          <div className="w-80 border-l border-border bg-card p-6 overflow-y-auto hidden xl:block">
            <div className="text-center mb-6">
              <Avatar className="h-20 w-20 mx-auto mb-3">
                <AvatarImage src={selectedSession.profile?.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {selectedSession.profile?.nome_completo?.charAt(0) || <User />}
                </AvatarFallback>
              </Avatar>
              <h2 className="font-bold text-lg">
                {selectedSession.profile?.nome_completo || "Aluno Visitante"}
              </h2>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-sm text-muted-foreground">
                  {selectedSession.student_phone}
                </span>
              </div>
              {selectedSession.profile?.email && (
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedSession.profile.email}
                </p>
              )}
            </div>

            <Separator className="my-6" />

            {/* Tags Section */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4" /> Etiquetas
              </h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedSession.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary" className="group">
                    {tag}
                    <X
                      className="w-3 h-3 ml-1 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
                {!selectedSession.tags?.length && (
                  <p className="text-xs text-muted-foreground italic">Sem etiquetas.</p>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Nova tag..."
                  className="h-8 text-xs"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                />
                <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={handleAddTag}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold mb-3">Assinatura</h3>
                {studentContext?.subscription ? (
                  <Card>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          {studentContext.subscription.plan_name}
                        </span>
                        <Badge
                          variant={
                            studentContext.subscription.status === "active"
                              ? "default"
                              : "destructive"
                          }
                          className="uppercase text-[10px]"
                        >
                          {studentContext.subscription.status === "active" ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Próxima cobrança:{" "}
                        {format(
                          new Date(studentContext.subscription.next_billing_date),
                          "dd/MM/yyyy"
                        )}
                      </p>
                      <p className="text-sm font-bold">
                        R$ {studentContext.subscription.amount?.toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="bg-muted/50 p-4 rounded-lg text-center">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      Nenhuma assinatura ativa encontrada.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-3">Histórico de Compras</h3>
                <div className="flex justify-between items-center bg-muted/30 p-3 rounded-md border border-border">
                  <span className="text-sm">Total de Pedidos</span>
                  <span className="font-bold">{studentContext?.totalOrders || 0}</span>
                </div>
              </div>

              {selectedSession.profile?.endereco && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Localização</h3>
                  <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md border border-border">
                    {selectedSession.profile.endereco}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
