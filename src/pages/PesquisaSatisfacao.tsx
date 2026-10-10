import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { 
  CheckCircle2, Star, User, Mail, MessageSquare, HeartHandshake, 
  Activity, MapPin, Target, Phone, ChevronRight, ChevronLeft, Calendar as CalendarIcon 
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  // 1. Dados Pessoais
  name: z.string().min(2, "Por favor, insira seu nome."),
  email: z.string().email("E-mail inválido."),
  whatsapp: z.string().min(14, "WhatsApp inválido. Ex: (11) 99999-9999"),
  birthdate: z.string().optional().refine((val) => {
    if (!val) return true;
    const year = new Date(val).getFullYear();
    return year > 1900 && year <= new Date().getFullYear();
  }, "Data de nascimento inválida."),
  gender: z.string().optional(),

  // 2. Demográficas e Vestuário
  state: z.string().optional(),
  city: z.string().optional(),
  profession: z.string().optional(),
  how_found_us: z.string().optional(),
  instagram: z.string().optional(),
  shirt_size: z.string().optional(),
  shirt_model: z.string().optional(),

  // 3. Saúde e Emergência
  blood_type: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  has_health_conditions: z.string().optional(),
  health_conditions: z.string().optional(),
  has_medications: z.string().optional(),
  medications: z.string().optional(),
  has_injuries: z.string().optional(),
  injuries: z.string().optional(),
  has_surgeries: z.string().optional(),
  surgeries: z.string().optional(),
  has_allergies: z.string().optional(),
  allergies: z.string().optional(),
  workout_frequency: z.string().optional(),
  experience_level: z.string().optional(),

  // 4. Objetivos
  main_goal: z.string().optional(),
  timeframe_goal: z.string().optional(),
  expectations: z.string().optional(),

  // 5. Jornada
  time_in_advisory: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  nps_score: z.number().min(0).max(10).optional(),

  // 6. Feedback Aberto e Detalhado
  good: z.string().optional(),
  missing: z.string().optional(),
  improve: z.string().optional(),
  rate_plan: z.number().optional(),
  rate_support: z.number().optional(),
  rate_communication: z.number().optional(),
  rate_motivation: z.number().optional(),

  // 7. Preferências
  best_times: z.string().optional(),
  communication_pref: z.string().optional(),
  workout_pref: z.string().optional(),
  additional_comments: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function PesquisaSatisfacao() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const totalSteps = 7;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    trigger,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rating: 0,
      nps_score: 10,
      rate_plan: 0,
      rate_support: 0,
      rate_communication: 0,
      rate_motivation: 0,
    },
    mode: "onChange",
  });

  const values = watch();

  const nextStep = async () => {
    // Basic validation before jumping
    let fieldsToValidate: (keyof FormValues)[] = [];
    if (step === 1) fieldsToValidate = ["name", "email", "whatsapp"];
    
    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid) {
      setStep((prev) => Math.min(prev + 1, totalSteps));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("student_feedbacks").insert({
        name: data.name,
        email: data.email,
        improve: data.improve || "",
        missing: data.missing || "",
        good: data.good || "",
        whatsapp: data.whatsapp,
        birthdate: data.birthdate,
        gender: data.gender,
        location: (data.city && data.state) ? `${data.city} / ${data.state}` : "",
        profession: data.profession,
        how_found_us: data.how_found_us,
        instagram: data.instagram,
        shirt_size: data.shirt_size,
        shirt_model: data.shirt_model,
        blood_type: data.blood_type,
        emergency_contact_name: data.emergency_contact_name,
        emergency_contact_phone: data.emergency_contact_phone,
        health_conditions: data.has_health_conditions === "sim" ? data.health_conditions : "Não",
        medications: data.has_medications === "sim" ? data.medications : "Não",
        injuries: data.has_injuries === "sim" ? data.injuries : "Não",
        surgeries: data.has_surgeries === "sim" ? data.surgeries : "Não",
        allergies: data.has_allergies === "sim" ? data.allergies : "Não",
        workout_frequency: data.workout_frequency,
        experience_level: data.experience_level,
        main_goal: data.main_goal,
        timeframe_goal: data.timeframe_goal,
        expectations: data.expectations,
        time_in_advisory: data.time_in_advisory || "Não informado",
        rating: data.rating || 0,
        nps_score: data.nps_score || 0,
        rate_plan: data.rate_plan || 0,
        rate_support: data.rate_support || 0,
        rate_communication: data.rate_communication || 0,
        rate_motivation: data.rate_motivation || 0,
        best_times: data.best_times,
        communication_pref: data.communication_pref,
        workout_pref: data.workout_pref,
        additional_comments: data.additional_comments,
      });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Seu perfil completo foi registrado.",
      });
      setIsSuccess(true);
      reset();
    } catch (error) {
      console.error("Erro ao enviar onboard:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro. Tente novamente mais tarde.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (fieldName: keyof FormValues, label: string) => (
    <div className="space-y-4 pt-2 pb-4">
      <Label className="text-sm font-semibold">{label}</Label>
      <div className="flex flex-wrap gap-2 items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            aria-label={`Dar nota ${star}`}
            onClick={() => setValue(fieldName, star, { shouldValidate: true })}
            className={cn(
              "p-2 md:p-3 rounded-full transition-all duration-300 transform hover:scale-110",
              (values[fieldName as keyof FormValues] as number) >= star 
                ? "bg-yellow-500/10 text-yellow-500" 
                : "bg-muted text-muted-foreground"
            )}
          >
            <Star className={cn("w-6 h-6 md:w-8 md:h-8", (values[fieldName as keyof FormValues] as number) >= star && "fill-current")} />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <Header />
      <main className="flex-1 flex flex-col items-center py-12 px-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-5xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-500">
              Onboarding & Satisfação
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
              Seja bem-vindo(a)! Ajude-nos a criar um perfil 360° para você.
            </p>
          </div>

          <Card className="border-t-4 border-t-primary shadow-xl overflow-hidden relative">
            {/* Progress Bar */}
            {!isSuccess && (
              <div className="w-full h-2 bg-secondary absolute top-0 left-0">
                <div 
                  className="h-full bg-primary transition-all duration-500" 
                  style={{ width: `${(step / totalSteps) * 100}%` }}
                />
              </div>
            )}

            <CardContent className="p-0">
              {isSuccess ? (
                <div className="flex flex-col items-center py-20 px-6 text-center animate-in fade-in zoom-in duration-500 bg-secondary/10">
                  <div className="bg-green-500/10 p-4 rounded-full mb-6">
                    <CheckCircle2 className="w-24 h-24 text-green-500" />
                  </div>
                  <h2 className="text-3xl font-bold mb-3">Tudo Certo!</h2>
                  <p className="text-muted-foreground text-lg mb-8 max-w-md">
                    Seu perfil completo foi salvo com sucesso. Nossa equipe utilizará essas informações para entregar a melhor experiência!
                  </p>
                  <Button onClick={() => { setIsSuccess(false); setStep(1); }} variant="outline" size="lg" className="rounded-full px-8">
                    Voltar ao início
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-0">
                  
                  {/* Etapa 1: Dados Pessoais */}
                  {step === 1 && (
                    <div className="p-6 sm:p-10 space-y-6 animate-in slide-in-from-right-8 duration-300">
                      <div className="flex items-center gap-3 text-primary mb-6">
                        <div className="bg-primary/10 p-2 rounded-lg"><User className="w-6 h-6" /></div>
                        <div>
                          <h2 className="text-2xl font-bold">1. Conhecendo Você</h2>
                          <p className="text-sm text-muted-foreground">Suas informações básicas</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold">Nome Completo *</Label>
                          <Input placeholder="Seu nome" {...register("name")} className={errors.name && "border-red-500 bg-red-500/5"} />
                          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-semibold">E-mail *</Label>
                          <Input type="email" placeholder="seu@email.com" {...register("email")} className={errors.email && "border-red-500 bg-red-500/5"} />
                          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-semibold">WhatsApp *</Label>
                          <Input 
                            type="tel" 
                            placeholder="(11) 99999-9999" 
                            {...register("whatsapp")} 
                            onChange={(e) => {
                              let v = e.target.value.replace(/\D/g, "");
                              if (v.length > 11) v = v.slice(0, 11);
                              if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
                              if (v.length > 10) v = `${v.slice(0, 10)}-${v.slice(10)}`;
                              e.target.value = v;
                              setValue("whatsapp", v, { shouldValidate: true });
                            }}
                            className={errors.whatsapp && "border-red-500 bg-red-500/5"} 
                          />
                          {errors.whatsapp && <p className="text-xs text-red-500">{errors.whatsapp.message}</p>}
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-semibold">Data de Nascimento</Label>
                          <div className="relative">
                            <Input 
                              type="date" 
                              max={new Date().toISOString().split("T")[0]} 
                              {...register("birthdate")} 
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-semibold">Gênero</Label>
                          <Select onValueChange={(val) => setValue("gender", val)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Feminino">Feminino</SelectItem>
                              <SelectItem value="Masculino">Masculino</SelectItem>
                              <SelectItem value="Não Binário">Não Binário</SelectItem>
                              <SelectItem value="Prefiro não informar">Prefiro não informar</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold">Instagram (@)</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-3 text-muted-foreground text-sm">@</span>
                            <Input placeholder="seu_perfil" {...register("instagram")} className="pl-7" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Etapa 2: Demográficas */}
                  {step === 2 && (
                    <div className="p-6 sm:p-10 space-y-6 animate-in slide-in-from-right-8 duration-300">
                      <div className="flex items-center gap-3 text-primary mb-6">
                        <div className="bg-primary/10 p-2 rounded-lg"><MapPin className="w-6 h-6" /></div>
                        <div>
                          <h2 className="text-2xl font-bold">2. Localização e Rotina</h2>
                          <p className="text-sm text-muted-foreground">Para alinharmos as atividades</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold">Estado do Brasil</Label>
                          <Select onValueChange={(val) => setValue("state", val)}>
                            <SelectTrigger><SelectValue placeholder="Selecione seu estado" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="AC">Acre</SelectItem>
                              <SelectItem value="AL">Alagoas</SelectItem>
                              <SelectItem value="AP">Amapá</SelectItem>
                              <SelectItem value="AM">Amazonas</SelectItem>
                              <SelectItem value="BA">Bahia</SelectItem>
                              <SelectItem value="CE">Ceará</SelectItem>
                              <SelectItem value="DF">Distrito Federal</SelectItem>
                              <SelectItem value="ES">Espírito Santo</SelectItem>
                              <SelectItem value="GO">Goiás</SelectItem>
                              <SelectItem value="MA">Maranhão</SelectItem>
                              <SelectItem value="MT">Mato Grosso</SelectItem>
                              <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                              <SelectItem value="MG">Minas Gerais</SelectItem>
                              <SelectItem value="PA">Pará</SelectItem>
                              <SelectItem value="PB">Paraíba</SelectItem>
                              <SelectItem value="PR">Paraná</SelectItem>
                              <SelectItem value="PE">Pernambuco</SelectItem>
                              <SelectItem value="PI">Piauí</SelectItem>
                              <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                              <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                              <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                              <SelectItem value="RO">Rondônia</SelectItem>
                              <SelectItem value="RR">Roraima</SelectItem>
                              <SelectItem value="SC">Santa Catarina</SelectItem>
                              <SelectItem value="SP">São Paulo</SelectItem>
                              <SelectItem value="SE">Sergipe</SelectItem>
                              <SelectItem value="TO">Tocantins</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-semibold">Cidade</Label>
                          <Input placeholder="Qual sua cidade?" {...register("city")} />
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-semibold">Sua Profissão</Label>
                          <Input placeholder="Qual sua área de atuação?" {...register("profession")} />
                        </div>

                        <div className="space-y-3 md:col-span-2">
                          <Label className="text-sm font-semibold">Como você nos conheceu?</Label>
                          <Select onValueChange={(val) => setValue("how_found_us", val)}>
                            <SelectTrigger><SelectValue placeholder="Selecione uma opção" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Indicação">Indicação de amigo</SelectItem>
                              <SelectItem value="Instagram/Redes Sociais">Instagram / Redes Sociais</SelectItem>
                              <SelectItem value="Pesquisa Google">Pesquisa Google</SelectItem>
                              <SelectItem value="Evento">Em algum Evento/Corrida</SelectItem>
                              <SelectItem value="Outro">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-1 md:col-span-2 pt-4 border-t">
                          <h3 className="text-lg font-bold mb-4 text-primary">Vestuário e Equipamento</h3>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-semibold">Tamanho (Camiseta ou Regata)</Label>
                          <Select onValueChange={(val) => setValue("shirt_size", val)}>
                            <SelectTrigger><SelectValue placeholder="Selecione seu tamanho" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PP">PP</SelectItem>
                              <SelectItem value="P">P</SelectItem>
                              <SelectItem value="M">M</SelectItem>
                              <SelectItem value="G">G</SelectItem>
                              <SelectItem value="GG">GG</SelectItem>
                              <SelectItem value="XG">XG / EXG</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-semibold">Preferência de Modelo</Label>
                          <Select onValueChange={(val) => setValue("shirt_model", val)}>
                            <SelectTrigger><SelectValue placeholder="Selecione o corte" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Tradicional">Tradicional (Unissex)</SelectItem>
                              <SelectItem value="Baby Look">Baby Look (Feminina)</SelectItem>
                              <SelectItem value="Regata">Regata (Cavada)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Etapa 3: Saúde e Aptidão */}
                  {step === 3 && (
                    <div className="p-6 sm:p-10 space-y-8 animate-in slide-in-from-right-8 duration-300">
                      <div className="flex items-center gap-3 text-primary mb-4">
                        <div className="bg-primary/10 p-2 rounded-lg"><Activity className="w-6 h-6" /></div>
                        <div>
                          <h2 className="text-2xl font-bold">3. Saúde e Corpo</h2>
                          <p className="text-sm text-muted-foreground">Prescrição segura é a nossa prioridade</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-3 bg-secondary/20 p-4 rounded-xl">
                          <Label className="font-semibold text-base">Possui condição médica preexistente? (Diabetes, hipertensão, asma...)</Label>
                          <RadioGroup onValueChange={(v) => setValue("has_health_conditions", v)} className="flex gap-4">
                            <div className="flex items-center gap-2"><RadioGroupItem value="sim" id="hc-sim" /><Label htmlFor="hc-sim">Sim</Label></div>
                            <div className="flex items-center gap-2"><RadioGroupItem value="nao" id="hc-nao" /><Label htmlFor="hc-nao">Não</Label></div>
                          </RadioGroup>
                          {values.has_health_conditions === "sim" && (
                            <Input placeholder="Por favor, especifique" {...register("health_conditions")} className="mt-2" />
                          )}
                        </div>

                        <div className="space-y-3 bg-secondary/20 p-4 rounded-xl">
                          <Label className="font-semibold text-base">Toma algum medicamento regularmente?</Label>
                          <RadioGroup onValueChange={(v) => setValue("has_medications", v)} className="flex gap-4">
                            <div className="flex items-center gap-2"><RadioGroupItem value="sim" id="med-sim" /><Label htmlFor="med-sim">Sim</Label></div>
                            <div className="flex items-center gap-2"><RadioGroupItem value="nao" id="med-nao" /><Label htmlFor="med-nao">Não</Label></div>
                          </RadioGroup>
                          {values.has_medications === "sim" && (
                            <Input placeholder="Quais?" {...register("medications")} className="mt-2" />
                          )}
                        </div>

                        <div className="space-y-3 bg-secondary/20 p-4 rounded-xl">
                          <Label className="font-semibold text-base">Tem alguma dor crônica ou lesão?</Label>
                          <RadioGroup onValueChange={(v) => setValue("has_injuries", v)} className="flex gap-4">
                            <div className="flex items-center gap-2"><RadioGroupItem value="sim" id="inj-sim" /><Label htmlFor="inj-sim">Sim</Label></div>
                            <div className="flex items-center gap-2"><RadioGroupItem value="nao" id="inj-nao" /><Label htmlFor="inj-nao">Não</Label></div>
                          </RadioGroup>
                          {values.has_injuries === "sim" && (
                            <Input placeholder="Qual região/tipo de dor?" {...register("injuries")} className="mt-2" />
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <Label className="font-semibold">Frequência Física Atual</Label>
                            <Select onValueChange={(v) => setValue("workout_frequency", v)}>
                              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Sedentário">Sedentário</SelectItem>
                                <SelectItem value="1-2 vezes/semana">1 a 2 vezes por semana</SelectItem>
                                <SelectItem value="3-4 vezes/semana">3 a 4 vezes por semana</SelectItem>
                                <SelectItem value="5+ vezes/semana">Mais de 5 vezes por semana</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-3">
                            <Label className="font-semibold">Nível de Experiência</Label>
                            <Select onValueChange={(v) => setValue("experience_level", v)}>
                              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Iniciante">Iniciante</SelectItem>
                                <SelectItem value="Intermediário">Intermediário</SelectItem>
                                <SelectItem value="Avançado">Avançado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="pt-6 mt-4 border-t space-y-4">
                          <h3 className="text-lg font-bold text-primary mb-2">Contato de Emergência e Tipo Sanguíneo</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-3">
                              <Label className="font-semibold">Tipo Sanguíneo (Fator RH)</Label>
                              <Select onValueChange={(v) => setValue("blood_type", v)}>
                                <SelectTrigger><SelectValue placeholder="Ex: O+" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="A+">A+</SelectItem>
                                  <SelectItem value="A-">A-</SelectItem>
                                  <SelectItem value="B+">B+</SelectItem>
                                  <SelectItem value="B-">B-</SelectItem>
                                  <SelectItem value="AB+">AB+</SelectItem>
                                  <SelectItem value="AB-">AB-</SelectItem>
                                  <SelectItem value="O+">O+</SelectItem>
                                  <SelectItem value="O-">O-</SelectItem>
                                  <SelectItem value="Não sei informar">Não sei informar</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-3">
                              <Label className="font-semibold">Nome para Emergência</Label>
                              <Input placeholder="Nome da pessoa" {...register("emergency_contact_name")} />
                            </div>
                            <div className="space-y-3">
                              <Label className="font-semibold">Telefone de Emergência</Label>
                              <Input type="tel" placeholder="(11) 99999-9999" {...register("emergency_contact_phone")} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Etapa 4: Objetivos */}
                  {step === 4 && (
                    <div className="p-6 sm:p-10 space-y-6 animate-in slide-in-from-right-8 duration-300">
                      <div className="flex items-center gap-3 text-primary mb-6">
                        <div className="bg-primary/10 p-2 rounded-lg"><Target className="w-6 h-6" /></div>
                        <div>
                          <h2 className="text-2xl font-bold">4. Onde quer chegar?</h2>
                          <p className="text-sm text-muted-foreground">Objetivos e Metas</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-3">
                          <Label className="font-semibold text-base">Principal Objetivo</Label>
                          <Select onValueChange={(v) => setValue("main_goal", v)}>
                            <SelectTrigger><SelectValue placeholder="Escolha um objetivo primário" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Emagrecimento">Emagrecimento</SelectItem>
                              <SelectItem value="Ganho de Massa Muscular">Ganho de Massa Muscular</SelectItem>
                              <SelectItem value="Melhora Performance">Melhorar Performance (Corrida/Ciclismo)</SelectItem>
                              <SelectItem value="Qualidade de Vida">Saúde e Bem-estar Geral</SelectItem>
                              <SelectItem value="Evento Específico">Preparação para Evento/Exame</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-3">
                          <Label className="font-semibold text-base">Em quanto tempo quer alcançar?</Label>
                          <Select onValueChange={(v) => setValue("timeframe_goal", v)}>
                            <SelectTrigger><SelectValue placeholder="Selecione uma estimativa" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="3 meses">Até 3 meses</SelectItem>
                              <SelectItem value="6 meses">Em torno de 6 meses</SelectItem>
                              <SelectItem value="1 ano">1 ano</SelectItem>
                              <SelectItem value="Longo Prazo">Longo prazo (sem pressa)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-3">
                          <Label className="font-semibold text-base">O que espera da nossa assessoria para te ajudar nesse objetivo?</Label>
                          <Textarea placeholder="Suas expectativas..." {...register("expectations")} className="min-h-[100px]" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Etapa 5: Jornada Juntos */}
                  {step === 5 && (
                    <div className="p-6 sm:p-10 space-y-8 animate-in slide-in-from-right-8 duration-300">
                      <div className="flex items-center gap-3 text-primary mb-4">
                        <div className="bg-primary/10 p-2 rounded-lg"><HeartHandshake className="w-6 h-6" /></div>
                        <div>
                          <h2 className="text-2xl font-bold">5. Nossa Jornada (Feedback)</h2>
                          <p className="text-sm text-muted-foreground">Seu nível de satisfação geral</p>
                        </div>
                      </div>

                      <div className="space-y-8">
                        <div className="space-y-4">
                          <Label className="font-semibold text-base">Há quanto tempo você treina conosco?</Label>
                          <RadioGroup onValueChange={(v) => setValue("time_in_advisory", v)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {["Novo aluno", "Menos de 3 meses", "3 a 6 meses", "6 a 12 meses", "Mais de 1 ano"].map((opt) => (
                              <div key={opt} className="flex items-center space-x-2 border rounded-xl p-4 hover:border-primary/50 cursor-pointer">
                                <RadioGroupItem value={opt} id={opt} />
                                <Label htmlFor={opt} className="cursor-pointer">{opt}</Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>

                        {renderStars("rating", "De maneira geral, qual nota você dá para a Assessoria?")}

                        <div className="space-y-4 pt-4 border-t">
                          <Label className="font-semibold text-base block mb-2">
                            Em uma escala de 0 a 10, qual a probabilidade de você nos recomendar para um amigo?
                          </Label>
                          <div className="flex justify-between items-center text-xs text-muted-foreground px-1 mb-2">
                            <span>0 - Nada provável</span>
                            <span>10 - Muito provável</span>
                          </div>
                          <div className="flex flex-wrap md:flex-nowrap justify-between gap-1 w-full bg-secondary/30 p-2 rounded-xl border">
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                              <button
                                key={num}
                                type="button"
                                aria-label={`Nota ${num}`}
                                onClick={() => setValue("nps_score", num)}
                                className={cn(
                                  "w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-all",
                                  values.nps_score === num 
                                    ? "bg-primary text-primary-foreground shadow-md transform scale-110" 
                                    : "bg-background border hover:bg-muted"
                                )}
                              >
                                {num}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Etapa 6: Detalhamento */}
                  {step === 6 && (
                    <div className="p-6 sm:p-10 space-y-8 animate-in slide-in-from-right-8 duration-300">
                      <div className="flex items-center gap-3 text-primary mb-4">
                        <div className="bg-primary/10 p-2 rounded-lg"><MessageSquare className="w-6 h-6" /></div>
                        <div>
                          <h2 className="text-2xl font-bold">6. Indo Além</h2>
                          <p className="text-sm text-muted-foreground">Elogios, Críticas e Pontos Específicos</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-3 bg-green-500/5 p-4 rounded-xl border border-green-500/20">
                          <Label className="font-semibold">O que já está muito bom e deve continuar?</Label>
                          <Textarea placeholder="Qualidade dos treinos, professores, atendimento..." {...register("good")} />
                        </div>
                        
                        <div className="space-y-3 bg-blue-500/5 p-4 rounded-xl border border-blue-500/20">
                          <Label className="font-semibold">Sente falta de algo que não está sendo atendido?</Label>
                          <Textarea placeholder="Variedade, frequência de contato, ferramentas..." {...register("missing")} />
                        </div>

                        <div className="space-y-3 bg-red-500/5 p-4 rounded-xl border border-red-500/20">
                          <Label className="font-semibold">Qual única melhoria você sugeriria hoje?</Label>
                          <Textarea placeholder="Sugira algo prático..." {...register("improve")} />
                        </div>

                        <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                          {renderStars("rate_plan", "Qualidade dos Planos de Treino")}
                          {renderStars("rate_support", "Suporte e Atenção dos Professores")}
                          {renderStars("rate_communication", "Clareza e Frequência de Comunicação")}
                          {renderStars("rate_motivation", "Nível de Motivação/Incentivo Recebido")}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Etapa 7: Preferências */}
                  {step === 7 && (
                    <div className="p-6 sm:p-10 space-y-6 animate-in slide-in-from-right-8 duration-300">
                      <div className="flex items-center gap-3 text-primary mb-6">
                        <div className="bg-primary/10 p-2 rounded-lg"><CalendarIcon className="w-6 h-6" /></div>
                        <div>
                          <h2 className="text-2xl font-bold">7. Preferências Finais</h2>
                          <p className="text-sm text-muted-foreground">Como nos adequamos à sua rotina</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-3">
                          <Label className="font-semibold">Quais os melhores períodos para treinar?</Label>
                          <Select onValueChange={(v) => setValue("best_times", v)}>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Manhã (cedo)">Manhã (cedo)</SelectItem>
                              <SelectItem value="Hora do Almoço">Hora do Almoço</SelectItem>
                              <SelectItem value="Tarde">Tarde</SelectItem>
                              <SelectItem value="Noite">Noite</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-3">
                          <Label className="font-semibold">Como prefere nossa comunicação?</Label>
                          <Select onValueChange={(v) => setValue("communication_pref", v)}>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                              <SelectItem value="App da Assessoria">Aplicativo (Sisrun)</SelectItem>
                              <SelectItem value="E-mail">E-mail</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-3">
                          <Label className="font-semibold">Preferência por tipo de treino?</Label>
                          <Input placeholder="Ex: Ar livre, Academia, Em casa..." {...register("workout_pref")} />
                        </div>

                        <div className="space-y-3 pt-4 border-t">
                          <Label className="font-semibold">Comentários Adicionais (livre)</Label>
                          <Textarea placeholder="Tem mais alguma coisa em mente?" {...register("additional_comments")} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Controles de Navegação */}
                  <div className="p-6 sm:px-10 sm:py-6 bg-secondary/10 border-t flex items-center justify-between">
                    {step > 1 ? (
                      <Button type="button" variant="outline" onClick={prevStep} className="gap-2">
                        <ChevronLeft className="w-4 h-4" /> Voltar
                      </Button>
                    ) : (
                      <div /> /* Spacer */
                    )}
                    
                    {step < totalSteps ? (
                      <Button type="button" onClick={nextStep} className="gap-2 px-8">
                        Próximo <ChevronRight className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button type="submit" size="lg" disabled={isSubmitting} className="px-8 font-bold">
                        {isSubmitting ? "Enviando..." : "Finalizar Cadastro"}
                      </Button>
                    )}
                  </div>

                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
