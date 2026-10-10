import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings, Save, Plus, Trash2, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface MenuOption {
  id: string;
  title: string;
  description: string;
  action?: string;
  target?: string;
}

interface SupportConfig {
  greeting_message: string;
  offline_message: string;
  business_hours: {
    enabled: boolean;
    start: string;
    end: string;
    days: number[];
  };
  menu_options: MenuOption[];
  admins: any;
  ai_config?: {
    enabled: boolean;
    provider: "openai" | "deepseek";
    model: string;
    openai_key?: string;
    context?: string;
  };
}

export interface ResponseTemplate {
  id: string;
  label: string;
  text: string;
}

export function SupportSettings() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<SupportConfig | null>(null);
  const [templates, setTemplates] = useState<ResponseTemplate[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchSettings();
      fetchTemplates();
    }
  }, [open]);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("support_settings")
      .select("value")
      .eq("key", "general_config")
      .single();

    if (error) {
      console.error("Error fetching settings:", error);
      toast({ title: "Erro ao carregar configurações", variant: "destructive" });
    } else if (data) {
      // Merge with defaults to ensure structure exists
      const defaultConfig: SupportConfig = {
        greeting_message: "",
        offline_message: "",
        business_hours: { enabled: false, start: "08:00", end: "18:00", days: [1, 2, 3, 4, 5] },
        menu_options: [],
        admins: { TREINADORES: {} },
        ai_config: {
          enabled: false,
          provider: "openai",
          model: "gpt-4o-mini",
          openai_key: "",
          context: "",
        },
      };

      const rawConfig = data.value as Partial<SupportConfig>;

      const mergedConfig: SupportConfig = {
        greeting_message: rawConfig.greeting_message || defaultConfig.greeting_message,
        offline_message: rawConfig.offline_message || defaultConfig.offline_message,
        business_hours: {
          ...defaultConfig.business_hours,
          ...(rawConfig.business_hours || {}),
        },
        menu_options: rawConfig.menu_options || defaultConfig.menu_options,
        admins: {
          ...defaultConfig.admins,
          ...(rawConfig.admins || {}),
          TREINADORES: {
            ...(defaultConfig.admins.TREINADORES || {}),
            ...(rawConfig.admins?.TREINADORES || {}),
          },
        },
        ai_config: {
          ...defaultConfig.ai_config,
          ...(rawConfig.ai_config || {}),
        },
      };

      setConfig(mergedConfig);
    }
    setLoading(false);
  };

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from("support_settings")
      .select("value")
      .eq("key", "response_templates")
      .single();

    if (data?.value) {
      setTemplates(data.value as any as ResponseTemplate[]);
    } else {
      // Default templates to start with if none exist
      setTemplates([
        { id: "1", label: "👋 Saudação (Dia)", text: "Bom dia! Tudo bem? Como posso ajudar?" },
        { id: "2", label: "👋 Saudação (Tarde)", text: "Boa tarde! Tudo bem? Como posso ajudar?" },
        {
          id: "3",
          label: "💰 Pagamento",
          text: "Poderia me enviar o comprovante de pagamento, por favor?",
        },
        {
          id: "4",
          label: "⏳ Aguarde",
          text: "Vou verificar essa informação para você, só um momento.",
        },
        { id: "5", label: "🤝 Fechamento", text: "Posso ajudar em algo mais?" },
      ]);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    setLoading(true);

    // Sanitize content to ensure pure JSON
    const cleanConfig = JSON.parse(JSON.stringify(config));

    // Save Config
    const { error: configError } = await supabase
      .from("support_settings")
      .upsert({ key: "general_config", value: cleanConfig }, { onConflict: "key" });

    if (configError) {
      console.error("Error saving settings:", configError);
      alert(`Erro ao salvar: ${configError.message} (Código: ${configError.code})`);
      setLoading(false);
      return;
    }

    // Save Templates
    const { error: templateError } = await supabase
      .from("support_settings")
      .upsert({ key: "response_templates", value: templates as any }, { onConflict: "key" });

    if (templateError) {
      console.error("Error saving templates:", templateError);
      toast({ title: "Erro ao salvar templates", variant: "destructive" });
    } else {
      toast({ title: "Configurações salvas!" });
      setOpen(false);
    }
    setLoading(false);
  };

  const updateBusinessHours = (field: string, value: any) => {
    if (!config) return;
    setConfig({
      ...config,
      business_hours: { ...config.business_hours, [field]: value },
    });
  };

  const toggleDay = (day: number) => {
    if (!config) return;
    const currentDays = config.business_hours.days || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day];
    updateBusinessHours("days", newDays);
  };

  const updateMenuOption = (index: number, field: keyof MenuOption, value: string) => {
    if (!config) return;
    const newOptions = [...config.menu_options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setConfig({ ...config, menu_options: newOptions });
  };

  const addTemplate = () => {
    setTemplates([...templates, { id: Date.now().toString(), label: "Nova Resposta", text: "" }]);
  };

  const updateTemplate = (id: string, field: keyof ResponseTemplate, value: string) => {
    setTemplates(templates.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const removeTemplate = (id: string) => {
    setTemplates(templates.filter((t) => t.id !== id));
  };

  if (!config && loading) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="w-4 h-4" />
          Configurar Bot
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configuração do Auto-Atendimento</DialogTitle>
        </DialogHeader>

        {config && (
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">Geral & Horários</TabsTrigger>
              <TabsTrigger value="ai">Inteligência Artificial</TabsTrigger>
              <TabsTrigger value="templates">Respostas Rápidas</TabsTrigger>
            </TabsList>

            <TabsContent value="ai" className="space-y-6 py-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-semibold text-lg">IA de Atendimento</h3>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="ai-enabled">Ativar IA</Label>
                    <Switch
                      id="ai-enabled"
                      checked={config.ai_config?.enabled}
                      onCheckedChange={(c) =>
                        setConfig({
                          ...config,
                          ai_config: {
                            ...config.ai_config,
                            enabled: c,
                            provider: config.ai_config?.provider || "openai",
                            model: config.ai_config?.model || "gpt-4o-mini",
                            openai_key: config.ai_config?.openai_key,
                            context: config.ai_config?.context,
                          },
                        })
                      }
                    />
                  </div>
                </div>

                {config.ai_config?.enabled && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Provedor</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={config.ai_config?.provider || "openai"}
                          onChange={(e) => {
                            const newProvider = e.target.value as "openai" | "deepseek";
                            const newModel =
                              newProvider === "openai" ? "gpt-4o-mini" : "deepseek-chat";
                            setConfig({
                              ...config,
                              ai_config: {
                                ...config.ai_config,
                                enabled: true,
                                provider: newProvider,
                                model: newModel,
                                openai_key: config.ai_config?.openai_key,
                                context: config.ai_config?.context,
                              },
                            });
                          }}
                        >
                          <option value="openai">OpenAI (GPT-4o Mini)</option>
                          <option value="deepseek">DeepSeek (V3)</option>
                        </select>
                      </div>
                      <div>
                        <Label>Modelo (ID Técnico)</Label>
                        <Input
                          value={config.ai_config?.model || ""}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              ai_config: {
                                ...config.ai_config,
                                enabled: true,
                                model: e.target.value,
                                provider: config.ai_config?.provider || "openai",
                                openai_key: config.ai_config?.openai_key,
                                context: config.ai_config?.context,
                              },
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Chave da API (API Key)</Label>
                      <Input
                        type="password"
                        placeholder={
                          config.ai_config?.provider === "deepseek" ? "sk-..." : "sk-..."
                        }
                        value={config.ai_config?.openai_key || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            ai_config: {
                              ...config.ai_config,
                              enabled: true,
                              openai_key: e.target.value,
                              context: config.ai_config?.context,
                              provider: config.ai_config?.provider || "openai",
                              model: config.ai_config?.model || "gpt-4o-mini",
                            },
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        {config.ai_config?.provider === "deepseek"
                          ? "Obtenha em platform.deepseek.com/api-keys"
                          : "Obtenha em platform.openai.com/api-keys"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Base de Conhecimento (Contexto)</Label>
                      <Textarea
                        rows={10}
                        placeholder="Cole aqui todas as informações do site. Ex: Nossos planos custam R$97/mês. As aulas são online..."
                        value={config.ai_config?.context || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            ai_config: {
                              ...config.ai_config,
                              enabled: true,
                              context: e.target.value,
                              openai_key: config.ai_config?.openai_key,
                            },
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        A IA usará APENAS estas informações para responder dúvidas que não estiverem
                        no menu.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="general" className="space-y-6 py-4">
              {/* Mensagens Gerais */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Mensagens</h3>
                <div className="space-y-2">
                  <Label>Saudação Inicial (Menu)</Label>
                  <Textarea
                    value={config.greeting_message}
                    onChange={(e) => setConfig({ ...config, greeting_message: e.target.value })}
                    rows={4}
                  />
                  <p className="text-xs text-gray-500">
                    Esta mensagem é enviada junto com as opções do menu.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Mensagem Fora do Expediente</Label>
                  <Textarea
                    value={config.offline_message}
                    onChange={(e) => setConfig({ ...config, offline_message: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              {/* Horário de Atendimento */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-semibold text-lg">Horário de Atendimento</h3>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="bh-enabled">Ativar verificação</Label>
                    <Switch
                      id="bh-enabled"
                      checked={config.business_hours.enabled}
                      onCheckedChange={(c) => updateBusinessHours("enabled", c)}
                    />
                  </div>
                </div>

                {config.business_hours.enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Início</Label>
                      <Input
                        type="time"
                        value={config.business_hours.start}
                        onChange={(e) => updateBusinessHours("start", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Fim</Label>
                      <Input
                        type="time"
                        value={config.business_hours.end}
                        onChange={(e) => updateBusinessHours("end", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="block mb-2">Dias de Funcionamento</Label>
                      <div className="flex gap-2">
                        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dayName, idx) => (
                          <Button
                            key={idx}
                            variant={
                              config.business_hours.days.includes(idx) ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => toggleDay(idx)}
                            className="w-10 h-10 p-0"
                          >
                            {dayName[0]}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Menu Principal */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Opções do Menu</h3>
                {config.menu_options.map((option, idx) => (
                  <div
                    key={option.id}
                    className="grid grid-cols-12 gap-2 items-end border p-3 rounded-md bg-gray-50"
                  >
                    <div className="col-span-4">
                      <Label>Título (Botão)</Label>
                      <Input
                        value={option.title}
                        onChange={(e) => updateMenuOption(idx, "title", e.target.value)}
                      />
                    </div>
                    <div className="col-span-7">
                      <Label>Descrição (Rodapé)</Label>
                      <Input
                        value={option.description}
                        onChange={(e) => updateMenuOption(idx, "description", e.target.value)}
                      />
                    </div>
                    <div className="col-span-1">
                      <Button variant="ghost" size="icon" disabled>
                        <Trash2 className="w-4 h-4 text-gray-400" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Responsáveis */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Responsáveis (WhatsApp)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Financeiro (Demétrio)</Label>
                    <Input
                      value={config.admins?.FINANCEIRO || ""}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          admins: { ...config.admins, FINANCEIRO: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Comunicação (Isa)</Label>
                    <Input
                      value={config.admins?.COMUNICACAO || ""}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          admins: { ...config.admins, COMUNICACAO: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-muted-foreground">Treinadores</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Fernanda</Label>
                      <Input
                        value={config.admins?.TREINADORES?.FERNANDA || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            admins: {
                              ...config.admins,
                              TREINADORES: {
                                ...config.admins.TREINADORES,
                                FERNANDA: e.target.value,
                              },
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Diego</Label>
                      <Input
                        value={config.admins?.TREINADORES?.DIEGO || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            admins: {
                              ...config.admins,
                              TREINADORES: { ...config.admins.TREINADORES, DIEGO: e.target.value },
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Caique</Label>
                      <Input
                        value={config.admins?.TREINADORES?.CAIQUE || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            admins: {
                              ...config.admins,
                              TREINADORES: { ...config.admins.TREINADORES, CAIQUE: e.target.value },
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-6 py-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">Modelos de Mensagem</h3>
                <Button onClick={addTemplate} size="sm" className="gap-1">
                  <Plus className="w-4 h-4" /> Novo Modelo
                </Button>
              </div>

              <div className="space-y-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="border p-4 rounded-lg bg-gray-50 relative group"
                  >
                    <div className="grid gap-3">
                      <div>
                        <Label>Nome do Atalho</Label>
                        <Input
                          value={template.label}
                          onChange={(e) => updateTemplate(template.id, "label", e.target.value)}
                          placeholder="Ex: 👋 Saudação"
                          className="font-medium"
                        />
                      </div>
                      <div>
                        <Label>Mensagem</Label>
                        <Textarea
                          value={template.text}
                          onChange={(e) => updateTemplate(template.id, "text", e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeTemplate(template.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {templates.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p>Nenhum modelo criado ainda.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <div className="mt-6 pt-6 border-t">
              <Button onClick={handleSave} className="w-full" disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                Salvar Todas Alterações
              </Button>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
