import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PlayCircle, CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react";

export function BotStatusManager() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      // Busca perfis e tenta cruzar com assinaturas e anamnese
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select(
          `
          user_id,
          nome_completo,
          telefone,
          cpf,
          tem_conta_sisrun,
          sisrun_bot_status,
          sisrun_bot_error,
          created_at
        `
        )
        .order("created_at", { ascending: false })
        .limit(100);

      if (profilesError) throw profilesError;

      // Buscar assinaturas ativas para saber quem DEVERIA ter conta
      const { data: subsData } = await supabase
        .from("subscriptions")
        .select("user_id, status")
        .eq("status", "active");

      const activeUserIds = new Set(subsData?.map((s) => s.user_id) || []);

      const formatted = profilesData.map((p) => ({
        ...p,
        isActive: activeUserIds.has(p.user_id),
      }));

      setStudents(formatted);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao buscar status do robô");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleForcarCriacao = async (student: any) => {
    try {
      toast.loading(`Tentando cadastrar ${student.nome_completo} no SisRUN...`, {
        id: "forcar-bot",
      });

      // Ajustar CPF para senha
      const cpfFormatado = student.cpf?.replace(/\D/g, "");
      const senhaDefault = cpfFormatado ? cpfFormatado.substring(0, 6) : "mudar123";

      // Pegar anamnese
      const { data: anamnese } = await supabase
        .from("student_anamnesis")
        .select("*")
        .eq("user_id", student.user_id)
        .maybeSingle();

      const payload = {
        nome: student.nome_completo || "Sem Nome",
        email: `aluno_${student.user_id?.substring(0, 5)}@superacaoassessoria.com`, // Fallback
        telefone: student.telefone || "",
        data_nascimento: anamnese?.data_nascimento || null,
        senha: senhaDefault,
        objetivo_principal: anamnese?.objetivo_principal || "Sem objetivo preenchido",
        dias_treino: anamnese?.dias_favoraveis || [],
        instagram: anamnese?.instagram || "",
        user_id: student.user_id,
        // Nota: Idealmente o email vem do auth.users,
        // mas o SisRUN usa apenas email como identificador de login secundário na interface atual.
      };

      // Tentar pegar o email real via edge function ou buscar se houver no perfil
      const { data: userData } = await supabase
        .rpc("get_user_email_by_id", { target_user_id: student.user_id })
        .maybeSingle();
      if (userData) {
        payload.email = userData;
      }

      // Muda o status temporariamente para pending no banco
      await supabase
        .from("profiles")
        .update({ sisrun_bot_status: "pending", sisrun_bot_error: null })
        .eq("user_id", student.user_id);
      fetchStatus();

      const botUrl = "https://sisrun-bot.onrender.com/webhook/novo-aluno";
      const res = await fetch(botUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Erro de comunicação com o servidor do Robô (Render)");
      }

      toast.success("Comando enviado ao Robô! Aguarde alguns minutos e atualize a página.", {
        id: "forcar-bot",
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro desconhecido", { id: "forcar-bot" });
      await supabase
        .from("profiles")
        .update({ sisrun_bot_status: "error", sisrun_bot_error: err.message })
        .eq("user_id", student.user_id);
      fetchStatus();
    }
  };

  const renderBadge = (status: string, tem_conta: boolean) => {
    if (tem_conta)
      return (
        <Badge className="bg-emerald-500">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Sucesso
        </Badge>
      );
    if (status === "success")
      return (
        <Badge className="bg-emerald-500">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Sucesso
        </Badge>
      );
    if (status === "pending")
      return (
        <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50">
          <Clock className="w-3 h-3 mr-1" /> Rodando...
        </Badge>
      );
    if (status === "error")
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" /> Erro
        </Badge>
      );
    return (
      <Badge variant="outline" className="text-slate-500">
        <Clock className="w-3 h-3 mr-1" /> Não Acionado
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Monitoramento do Robô SisRUN</h2>
          <p className="text-sm text-muted-foreground">
            Acompanhe se o robô conseguiu cadastrar os novos assinantes e acione manualmente em caso
            de falha.
          </p>
        </div>
        <Button onClick={fetchStatus} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Atualizar Tabela
        </Button>
      </div>

      <div className="border rounded-md bg-white overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Aluno</th>
              <th className="px-4 py-3 font-medium">Data Cadastro</th>
              <th className="px-4 py-3 font-medium">Assinante Ativo?</th>
              <th className="px-4 py-3 font-medium">Status Robô</th>
              <th className="px-4 py-3 font-medium">Detalhes/Erro</th>
              <th className="px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {students.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhum aluno encontrado.
                </td>
              </tr>
            )}
            {students.map((aluno) => (
              <tr
                key={aluno.user_id}
                className={aluno.sisrun_bot_status === "error" ? "bg-red-50/30" : ""}
              >
                <td className="px-4 py-3 font-medium">
                  {aluno.nome_completo || "Sem nome"}
                  <div className="text-xs text-muted-foreground">
                    {aluno.telefone || "Sem telefone"}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(aluno.created_at).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-3">
                  {aluno.isActive ? (
                    <Badge
                      variant="outline"
                      className="bg-emerald-50 text-emerald-600 border-emerald-200"
                    >
                      Sim
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-slate-500">
                      Não
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  {renderBadge(aluno.sisrun_bot_status, aluno.tem_conta_sisrun)}
                </td>
                <td
                  className="px-4 py-3 max-w-[200px] text-xs text-red-600 truncate"
                  title={aluno.sisrun_bot_error}
                >
                  {aluno.sisrun_bot_error || "-"}
                </td>
                <td className="px-4 py-3">
                  {!aluno.tem_conta_sisrun && (
                    <Button
                      size="sm"
                      onClick={() => handleForcarCriacao(aluno)}
                      disabled={aluno.sisrun_bot_status === "pending"}
                      className="h-7 text-xs"
                    >
                      <PlayCircle className="w-3 h-3 mr-1" />
                      Forçar Robô
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
