import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Loader2, UserPlus, Eye, EyeOff, FileText, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { RegisterSchema } from "@/lib/schemas";
import { Logger } from "@/lib/logger";
import { captureError } from "@/lib/sentry";
import { useProfile } from "@/hooks/useProfile";

import { TERMS_CONTENT } from "@/data/terms";

const logger = new Logger("CadastroAluno");
const TERMS_VERSION = "v1.0"; // Versão atual dos termos para fins jurídicos

// Planos simplificados sem preço, conforme solicitado
const registrationPlans = [
  { id: "mensal", name: "Plano Mensal" },
  { id: "trimestral", name: "Plano Trimestral" },
  { id: "semestral", name: "Plano Semestral" },
  { id: "anual", name: "Plano Anual" },
  { id: "plano_teste", name: "Plano Teste (1 mês)" },
  { id: "parceria", name: "Parceria" },
];

export default function CadastroAluno() {
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuthContext();
  const { profile } = useProfile();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [step, setStep] = useState(1);
  const [clientIp, setClientIp] = useState("");

  useEffect(() => {
    // Capturar IP para validade jurídica (Marco Civil da Internet)
    fetch("https://api.ipify.org?format=json")
      .then((res) => res.json())
      .then((data) => setClientIp(data.ip))
      .catch((err) => console.error("Erro ao capturar IP:", err));
  }, []);

  const [formData, setFormData] = useState({
    // Step 1
    name: "",
    email: "",
    phone: "",
    cpf: "",
    dataNascimento: "",
    password: "",
    confirmPassword: "",
    planId: "mensal",

    // Step 2
    nivelCorrida: 5,
    frequenciaSemanal: "3",
    objetivoPrincipal: "Saúde e Qualidade de Vida",
    diasFavoraveis: [] as string[],
    paceAtual: "",
    usoGpsApp: "",
    temContaSisrun: false, // Se o aluno já tem conta no SisRUN

    // Step 3
    peso: "",
    altura: "",
    profissao: "",
    cargaHoraria: "",
    medicamentoControlado: "",
    restricaoFisica: "",
    historicoLesoesCirurgias: "",
    hipertensaoDiabetes: "NÃO TENHO DIABETES NEM HIPERTENSÃO",
  });

  useEffect(() => {
    if (user) {
      // Pre-fill fields if user is already logged in
      setFormData((prev) => ({
        ...prev,
        name: profile?.nome_completo || user.user_metadata?.full_name || "",
        email: user.email || "",
        phone: profile?.telefone || user.user_metadata?.phone || "",
        cpf: profile?.cpf || "",
      }));
    }
  }, [user, profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handlePlanChange = (value: string) => {
    setFormData((prev) => ({ ...prev, planId: value }));
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, "") // remove não dígitos
      .replace(/(\d{3})(\d)/, "$1.$2") // coloca ponto
      .replace(/(\d{3})(\d)/, "$1.$2") // coloca ponto
      .replace(/(\d{3})(\d{1,2})/, "$1-$2") // coloca traço
      .replace(/(-\d{2})\d+?$/, "$1"); // limita tamanho
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setFormData((prev) => ({ ...prev, cpf: formatted }));
  };

  const nextStep = () => {
    if (step === 1) {
      if (
        !formData.name ||
        !formData.email ||
        !formData.phone ||
        !formData.cpf ||
        !formData.dataNascimento
      ) {
        toast.error("Por favor, preencha todos os campos obrigatórios.");
        return;
      }
      if (
        !user &&
        (formData.password.length < 6 || formData.password !== formData.confirmPassword)
      ) {
        toast.error("Verifique a senha informada.");
        return;
      }
    }

    if (step === 2) {
      const freq = parseInt(formData.frequenciaSemanal);
      const selecionados = formData.diasFavoraveis.length;

      if (selecionados !== freq) {
        toast.error(
          `Você selecionou ${freq} ${freq === 1 ? "vez" : "vezes"} na semana. Por favor, marque exatamente ${freq} ${freq === 1 ? "dia preferencial" : "dias preferenciais"}. (Atualmente: ${selecionados})`
        );
        return;
      }
    }
    setStep((prev) => prev + 1);
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
    window.scrollTo(0, 0);
  };

  const handleCheckboxChange = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      diasFavoraveis: prev.diasFavoraveis.includes(day)
        ? prev.diasFavoraveis.filter((d) => d !== day)
        : [...prev.diasFavoraveis, day],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!user) {
        // Validar senha apenas se não estiver logado
        if (formData.password.length < 6) {
          toast.error("A senha deve ter no mínimo 6 caracteres");
          setIsLoading(false);
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          toast.error("As senhas não coincidem.");
          setIsLoading(false);
          return;
        }

        // Validate basic fields
        const validation = RegisterSchema.safeParse({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
          cpf: formData.cpf,
        });

        if (!validation.success) {
          const errors = validation.error.errors
            .map((e) => `${e.path.join(".")}: ${e.message}`)
            .join("; ");
          toast.error(errors);
          setIsLoading(false);
          return;
        }
      }

      if (!termsAccepted) {
        toast.error("Você precisa aceitar os Termos de Uso para continuar.");
        setIsLoading(false);
        return;
      }

      let userId = user?.id;

      if (!user) {
        // 1. Usar Edge Function para criar conta JÁ CONFIRMADA
        logger.info("Iniciando cadastro via Edge Function (auto-confirm)...");

        const { data: funcData, error: funcError } = await supabase.functions.invoke(
          "signup-student",
          {
            body: {
              email: formData.email,
              password: formData.password,
              name: formData.name,
              phone: formData.phone,
              cpf: formData.cpf,
              planId: formData.planId,
              planName:
                registrationPlans.find((p) => p.id === formData.planId)?.name ||
                "Plano Selecionado",
            },
          }
        );

        if (funcError) {
          logger.error("Erro na função signup-student:", funcError);
          // Tentar parsear erro se vier como string JSON
          let msg = "Erro ao criar conta.";
          try {
            const body = await funcError.context?.json();
            if (body?.error) msg = body.error;
          } catch (e) {}
          throw new Error(msg);
        }

        if (!funcData?.userId) {
          throw new Error("Erro desconhecido ao criar usuário (sem ID retornado).");
        }

        userId = funcData.userId;
        logger.info("Conta criada com sucesso via função!", { userId });

        // 2. Fazer Login Automático
        logger.info("Realizando login automático...");
        const { error: loginError } = await signIn(formData.email, formData.password);

        if (loginError) {
          logger.warn("Conta criada, mas erro ao logar automaticamente.", { error: loginError });
          toast.warning("Conta criada! Por favor, faça login.");
          navigate("/login");
          return;
        }

        toast.success("Cadastro realizado e email confirmado!");
      } else {
        // Update existing profile
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            nome_completo: formData.name || undefined,
            cpf: formData.cpf || undefined,
            telefone: formData.phone || undefined,
            terms_accepted_at: new Date().toISOString(),
            tem_conta_sisrun: formData.temContaSisrun,
          })
          .eq("user_id", user.id);

        if (updateError) {
          logger.error("Error updating profile:", updateError);
          throw updateError;
        }
      }

      // 3. Salvar Anamnese
      logger.info("Salvando dados de anamnese...");
      const { error: anamneseError } = await supabase.from("student_anamnesis").upsert({
        user_id: userId,
        data_nascimento: formData.dataNascimento,
        peso: parseFloat(formData.peso) || null,
        altura: parseInt(formData.altura) || null,
        profissao: formData.profissao,
        carga_horaria: formData.cargaHoraria,
        frequencia_semanal: parseInt(formData.frequenciaSemanal),
        nivel_corrida: formData.nivelCorrida,
        objetivo_principal: formData.objetivoPrincipal,
        medicamento_controlado: formData.medicamentoControlado,
        restricao_fisica: formData.restricaoFisica,
        historico_lesoes_cirurgias: formData.historicoLesoesCirurgias,
        hipertensao_diabetes: formData.hipertensaoDiabetes,
        dias_favoraveis: formData.diasFavoraveis,
        pace_atual: formData.paceAtual,
        uso_gps_app: formData.usoGpsApp,
        // Logs de Validade Jurídica
        terms_accepted: termsAccepted,
        terms_version: TERMS_VERSION,
        accepted_ip: clientIp,
        user_agent: navigator.userAgent,
      });

      if (anamneseError) {
        logger.error("Erro ao salvar anamnese:", anamneseError);
        // Não lançar erro aqui para não travar o fluxo se o perfil/plano deu certo?
        // Mas é bom avisar.
        toast.warning("Cadastro realizado, mas houve um erro ao salvar sua anamnese.");
      }

      // 4. Registrar Plano
      logger.info("Registrando plano...");
      const { data: rpcData, error: rpcError } = await supabase.rpc("create_new_subscription", {
        p_user_id: userId,
        p_student_name: formData.name,
        p_student_email: formData.email,
        p_student_phone: formData.phone,
        p_plan_id: formData.planId,
        p_plan_name:
          registrationPlans.find((p) => p.id === formData.planId)?.name || "Plano Selecionado",
      });

      if (rpcError) {
        logger.error("ERRO CRÍTICO NO RPC:", { error: rpcError });
        toast.error(`Erro ao registrar plano: ${rpcError.message}`);
      } else {
        const message = (rpcData as any)?.message || "Plano registrado com sucesso!";
        toast.success(message);
      }

      // Finalização
      navigate(`/sucesso?type=registration&email=${encodeURIComponent(formData.email)}`);
    } catch (error: any) {
      logger.error("Erro no cadastro:", { error: error.message || error, email: formData.email });

      let errorMessage = error.message || "Erro ao realizar cadastro.";

      // Tratamento específico para erro de envio de email (comum no Supabase/Resend)
      if (errorMessage.includes("Error sending confirmation email")) {
        errorMessage =
          "Erro ao enviar email de confirmação. O serviço pode estar temporariamente indisponível ou limite de envio atingido. Tente novamente mais tarde.";
      } else if (errorMessage.includes("User already registered")) {
        errorMessage = "Este email já está cadastrado. Tente fazer login ou recuperar sua senha.";
      }

      captureError(error, { email: formData.email, planId: formData.planId });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black tracking-tighter sm:text-4xl text-foreground">
            Superação Assessoria
          </h1>
          <p className="text-muted-foreground">
            {user
              ? "Complete seu cadastro de aluno para aproveitar todos os benefícios."
              : "Cadastre-se para acessar seu controle financeiro e nossa loja oficial de roupas."}
          </p>
        </div>

        <Card className="border-muted">
          <CardHeader>
            <CardTitle>{user ? "Finalizar Cadastro de Aluno" : "Cadastro de Aluno"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex justify-between items-center px-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                      step === s
                        ? "bg-primary text-primary-foreground"
                        : step > s
                          ? "bg-green-500 text-white"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {step > s ? "✓" : s}
                  </div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">
                    {s === 1 ? "Pessoal" : s === 2 ? "Foco" : "Saúde"}
                  </span>
                </div>
              ))}
              <div className="absolute h-[2px] bg-muted w-[70%] left-[15%] top-[108px] -z-10 hidden md:block" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      placeholder="Seu nome"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={!!user}
                      className={user ? "bg-muted text-muted-foreground" : ""}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Celular (WhatsApp)</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(11) 99999-9999"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        placeholder="000.000.000-00"
                        value={formData.cpf}
                        onChange={handleCPFChange}
                        required
                        maxLength={14}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                    <Input
                      id="dataNascimento"
                      type="date"
                      value={formData.dataNascimento}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="planId">Plano Escolhido</Label>
                    <Select value={formData.planId} onValueChange={handlePlanChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um plano" />
                      </SelectTrigger>
                      <SelectContent>
                        {registrationPlans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Pergunta sobre conta no SisRUN */}
                  <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                    <Label className="text-sm font-semibold">
                      📱 Você já possui conta no <strong>SisRUN</strong> (app do seu plano de
                      corrida)?
                    </Label>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant={formData.temContaSisrun === true ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setFormData((prev) => ({ ...prev, temContaSisrun: true }))}
                      >
                        ✅ Sim, já tenho
                      </Button>
                      <Button
                        type="button"
                        variant={formData.temContaSisrun === false ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setFormData((prev) => ({ ...prev, temContaSisrun: false }))}
                      >
                        🆕 Não, ainda não
                      </Button>
                    </div>
                    {formData.temContaSisrun === false && (
                      <p className="text-xs text-muted-foreground">
                        Sem problema! Após seu pagamento, criaremos sua conta automaticamente e
                        enviaremos o login pelo WhatsApp. 🚀
                      </p>
                    )}
                  </div>

                  {!user && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Senha"
                          value={formData.password}
                          onChange={handleChange}
                          required
                          minLength={6}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Repita a senha"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                  )}

                  <Button type="button" className="w-full mt-4" onClick={nextStep}>
                    Continuar para Objetivos
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-3">
                    <Label className="text-base font-bold">
                      De 0 a 10 qual o seu nível na corrida?
                    </Label>
                    <div className="flex justify-between gap-1 overflow-x-auto pb-2 no-scrollbar">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                        <Button
                          key={val}
                          type="button"
                          variant={formData.nivelCorrida === val ? "default" : "outline"}
                          className="w-10 h-10 p-0 shrink-0"
                          onClick={() => setFormData((prev) => ({ ...prev, nivelCorrida: val }))}
                        >
                          {val}
                        </Button>
                      ))}
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground font-bold px-1">
                      <span>INICIANTE</span>
                      <span>AVANÇADO</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-bold">
                      Quantas vezes na semana você tem disponível?
                    </Label>
                    <Select
                      value={formData.frequenciaSemanal}
                      onValueChange={(val) =>
                        setFormData((prev) => ({ ...prev, frequenciaSemanal: val }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} {num === 1 ? "vez" : "vezes"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-bold">
                      Quais dias da semana você prefere treinar?
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"].map(
                        (day) => (
                          <div
                            key={day}
                            className="flex items-center space-x-2 border rounded-md p-2 hover:bg-muted/50 transition-colors"
                          >
                            <Checkbox
                              id={day}
                              checked={formData.diasFavoraveis.includes(day)}
                              onCheckedChange={() => handleCheckboxChange(day)}
                            />
                            <Label
                              htmlFor={day}
                              className="text-[10px] font-bold cursor-pointer uppercase flex-1 py-1"
                            >
                              {day.slice(0, 3)}
                            </Label>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="font-bold">Qual seu principal objetivo com a corrida?</Label>
                    <Select
                      value={formData.objetivoPrincipal}
                      onValueChange={(val) =>
                        setFormData((prev) => ({ ...prev, objetivoPrincipal: val }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Saúde e Qualidade de Vida">
                          Saúde e Qualidade de Vida
                        </SelectItem>
                        <SelectItem value="Condicionamento Físico">
                          Condicionamento Físico
                        </SelectItem>
                        <SelectItem value="Performance">Performance (Provas e tempos)</SelectItem>
                        <SelectItem value="Emagrecimento">Emagrecimento</SelectItem>
                        <SelectItem value="Atleta Profissional">Atleta Profissional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="paceAtual">Pace Médio ou Tempo 5km</Label>
                      <Input
                        id="paceAtual"
                        placeholder="Ex: 5:30 min/km ou 25min"
                        value={formData.paceAtual}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="usoGpsApp">Relógio GPS ou App (Strava?)</Label>
                      <Input
                        id="usoGpsApp"
                        placeholder="Garmin, Apple Watch, Strava..."
                        value={formData.usoGpsApp}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 mt-4">
                    <Button type="button" variant="outline" className="flex-1" onClick={prevStep}>
                      Voltar
                    </Button>
                    <Button type="button" className="flex-1" onClick={nextStep}>
                      Continuar para Saúde
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="peso">Peso (kg)</Label>
                      <Input
                        id="peso"
                        type="number"
                        placeholder="70.5"
                        value={formData.peso}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="altura">Altura (cm)</Label>
                      <Input
                        id="altura"
                        type="number"
                        placeholder="175"
                        value={formData.altura}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="profissao">Profissão</Label>
                      <Input
                        id="profissao"
                        placeholder="Sua profissão"
                        value={formData.profissao}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cargaHoraria">Carga Horária (horas/dia)</Label>
                      <Input
                        id="cargaHoraria"
                        placeholder="8h"
                        value={formData.cargaHoraria}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medicamentoControlado">
                      Faz uso de medicamento controlado?
                    </Label>
                    <Input
                      id="medicamentoControlado"
                      placeholder="Se sim, quais?"
                      value={formData.medicamentoControlado}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="restricaoFisica">Possui alguma restrição física?</Label>
                    <Textarea
                      id="restricaoFisica"
                      placeholder="Ex: Problema no joelho, coluna..."
                      value={formData.restricaoFisica}
                      onChange={handleChange as any}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="historicoLesoesCirurgias">
                      Histórico de lesões ou cirurgias?
                    </Label>
                    <Textarea
                      id="historicoLesoesCirurgias"
                      placeholder="Explique se houve acidentes ou cirurgias"
                      value={formData.historicoLesoesCirurgias}
                      onChange={handleChange as any}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="font-bold">Em relação à Hipertensão e Diabetes:</Label>
                    <Select
                      value={formData.hipertensaoDiabetes}
                      onValueChange={(val) =>
                        setFormData((prev) => ({ ...prev, hipertensaoDiabetes: val }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SOU DIABÉTICO">SOU DIABÉTICO</SelectItem>
                        <SelectItem value="SOU HIPERTENSO">SOU HIPERTENSO</SelectItem>
                        <SelectItem value="SOU HIPERTENSO E DIABÉTICO">
                          SOU HIPERTENSO E DIABÉTICO
                        </SelectItem>
                        <SelectItem value="NÃO TENHO DIABETES NEM HIPERTENSÃO">
                          NÃO TENHO DIABETES NEM HIPERTENSÃO
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-start space-x-2 pt-2">
                    <Checkbox
                      id="terms"
                      checked={termsAccepted}
                      onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                      className="mt-1"
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor="terms"
                        className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground"
                      >
                        Li e concordo com os{" "}
                        <Dialog>
                          <DialogTrigger asChild>
                            <button
                              type="button"
                              className="text-primary hover:underline font-bold"
                            >
                              Termos de Responsabilidade e Adesão
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md md:max-w-xl max-h-[80vh]">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Termos de Responsabilidade
                              </DialogTitle>
                              <DialogDescription>
                                Leia atentamente as condições de participação no Superação Assessoria.
                              </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="h-[50vh] pr-4 mt-2 border rounded-md p-4 bg-muted/30">
                              {TERMS_CONTENT}
                            </ScrollArea>
                            <div className="flex justify-end pt-4">
                              <Button
                                type="button"
                                onClick={() => setTermsAccepted(true)}
                                className="w-full sm:w-auto"
                              >
                                Li e Concordo
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </Label>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={prevStep}
                      disabled={isLoading}
                    >
                      Voltar
                    </Button>
                    <Button
                      type="submit"
                      className="flex-[2] bg-primary hover:bg-primary/90"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finalizando...
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" /> Finalizar Cadastro
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
          {!user && (
            <CardFooter className="flex justify-center">
              <p className="text-sm text-muted-foreground">
                Já tem uma conta?{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Fazer login
                </Link>
              </p>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
