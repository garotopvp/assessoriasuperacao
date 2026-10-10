import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";
import { format, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarIcon,
  Loader2,
  Send,
  AlertTriangle,
  Smile,
  Meh,
  Frown,
  ThumbsUp,
  Activity,
  UserX,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useWeeklyFeedback } from "@/hooks/useWeeklyFeedback";

const formSchema = z
  .object({
    week_start_date: z.date({
      required_error: "A data de início da semana é obrigatória.",
    }),
    intensity_level: z.coerce.number().min(1).max(5),
    adherence_level: z.coerce.number().min(1).max(4),
    feeling_level: z.coerce.number().min(1).max(5),

    // New fields
    missed_workout_reason: z.string().optional(),
    pain_discomfort: z.boolean().default(false),
    pain_intensity: z.number().min(0).max(10).optional(),
    pain_area: z.array(z.string()).optional(),
    pain_details: z.string().optional(),

    comments: z.string().optional(),
    improvement_suggestions: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.pain_discomfort) {
        if (!data.pain_area || data.pain_area.length === 0) return false;
        if (data.pain_intensity === undefined) return false;
      }
      return true;
    },
    {
      message: "Por favor, indique a área e a intensidade da dor.",
      path: ["pain_area"],
    }
  );

const PAIN_AREAS = [
  "Joelho",
  "Tornozelo",
  "Pé",
  "Canela",
  "Panturrilha",
  "Quadril",
  "Lombar",
  "Costas",
  "Ombro",
  "Outro",
];

const INTENSITY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Muito Leve", color: "bg-green-100 text-green-700 hover:bg-green-200" },
  2: { label: "Leve", color: "bg-teal-100 text-teal-700 hover:bg-teal-200" },
  3: { label: "Moderada", color: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" },
  4: { label: "Forte", color: "bg-orange-100 text-orange-700 hover:bg-orange-200" },
  5: { label: "Muito Forte", color: "bg-red-100 text-red-700 hover:bg-red-200" },
};

const FEELING_ICONS: Record<number, { icon: LucideIcon; label: string; color: string }> = {
  5: { icon: Smile, label: "Excelente", color: "text-green-500" },
  4: { icon: ThumbsUp, label: "Muito Bom", color: "text-teal-500" },
  3: { icon: Meh, label: "Normal", color: "text-yellow-500" },
  2: { icon: Frown, label: "Cansado", color: "text-orange-500" },
  1: { icon: Activity, label: "Exausto", color: "text-red-500" },
};

const ADHERENCE_OPTIONS = [
  { value: 4, label: "Todos os treinos", description: "100% concluído" },
  { value: 3, label: "Maioria", description: "~75% concluído" },
  { value: 2, label: "Metade", description: "~50% concluído" },
  { value: 1, label: "Poucos / Nenhum", description: "< 25% concluído" },
];

const MISSED_REASONS = [
  "Trabalho / Estudos",
  "Doença / Gripe",
  "Lesão / Dor",
  "Cansaço / Falta de sono",
  "Preguiça / Desmotivação",
  "Viagem",
  "Tempo / Chuva",
];

export function WeeklyFeedbackForm({ onSuccess }: { onSuccess?: () => void }) {
  const { addFeedback } = useWeeklyFeedback();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      week_start_date: startOfWeek(new Date(), { weekStartsOn: 1 }),
      intensity_level: 3,
      adherence_level: 4,
      feeling_level: 3,
      missed_workout_reason: undefined,
      pain_discomfort: false,
      pain_intensity: 0,
      pain_area: [],
      pain_details: "",
      comments: "",
      improvement_suggestions: "",
    },
  });

  const hasPain = form.watch("pain_discomfort");
  const adherence = form.watch("adherence_level");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      await addFeedback({
        week_start_date: format(values.week_start_date, "yyyy-MM-dd"),
        intensity_level: values.intensity_level,
        adherence_level: values.adherence_level,
        feeling_level: values.feeling_level,

        missed_workout_reason:
          values.adherence_level <= 2 ? values.missed_workout_reason || null : null,

        pain_discomfort: values.pain_discomfort,
        pain_intensity: values.pain_discomfort ? values.pain_intensity : null,
        pain_area: values.pain_discomfort ? values.pain_area : null,
        pain_details: values.pain_discomfort ? values.pain_details || null : null,

        comments: values.comments || null,
        improvement_suggestions: values.improvement_suggestions || null,
      });
      form.reset();
      if (onSuccess) onSuccess();
    } finally {
      setIsSubmitting(false);
    }
  }

  const togglePainArea = (area: string) => {
    const current = form.getValues("pain_area") || [];
    const index = current.indexOf(area);
    if (index > -1) {
      form.setValue(
        "pain_area",
        current.filter((a) => a !== area)
      );
    } else {
      form.setValue("pain_area", [...current, area]);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 bg-card px-2 py-4 md:p-6">
        {/* Date Selection */}
        <FormField
          control={form.control}
          name="week_start_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Semana de Referência (Início)</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        `Semana de ${format(field.value, "dd 'de' MMMM", { locale: ptBR })}`
                      ) : (
                        <span>Selecione a semana</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Adherence */}
        <FormField
          control={form.control}
          name="adherence_level"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Frequência (Aderência)</FormLabel>
              <FormControl>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {ADHERENCE_OPTIONS.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => field.onChange(option.value)}
                      className={cn(
                        "cursor-pointer rounded-lg border-2 p-3 hover:border-primary/50 transition-all text-center flex flex-col items-center justify-center gap-1",
                        field.value === option.value
                          ? "border-primary bg-primary/5"
                          : "border-muted"
                      )}
                    >
                      <span className="font-semibold text-sm">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </div>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Missed Workout Reason (Dynamic) */}
        {adherence <= 2 && (
          <FormField
            control={form.control}
            name="missed_workout_reason"
            render={({ field }) => (
              <FormItem className="animate-in fade-in slide-in-from-top-4 duration-300">
                <FormLabel>O que te impediu de treinar?</FormLabel>
                <div className="flex flex-wrap gap-2 mt-2">
                  {MISSED_REASONS.map((reason) => (
                    <Badge
                      key={reason}
                      variant={field.value === reason ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer text-sm py-1 px-3",
                        field.value === reason
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      )}
                      onClick={() => field.onChange(reason)}
                    >
                      {reason}
                    </Badge>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Intensity */}
          <FormField
            control={form.control}
            name="intensity_level"
            render={({ field }) => (
              <FormItem className="space-y-4">
                <FormLabel>Intensidade Geral</FormLabel>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-medium text-muted-foreground">Muito Leve</span>
                    <span className="text-sm font-bold text-primary">
                      {INTENSITY_LABELS[field.value]?.label}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">Muito Forte</span>
                  </div>
                  <Slider
                    defaultValue={[field.value]}
                    min={1}
                    max={5}
                    step={1}
                    onValueChange={(vals) => field.onChange(vals[0])}
                    className="py-2"
                  />
                  <div className="flex justify-between gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <div
                        key={val}
                        className={cn(
                          "h-2 flex-1 rounded-full transition-all",
                          val <= field.value
                            ? INTENSITY_LABELS[val].color.split(" ")[0]
                            : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Feeling */}
          <FormField
            control={form.control}
            name="feeling_level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bem-estar Físico</FormLabel>
                <div className="flex justify-between gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((val) => {
                    const { icon: Icon, label, color } = FEELING_ICONS[val];
                    const isSelected = field.value === val;
                    return (
                      <div
                        key={val}
                        onClick={() => field.onChange(val)}
                        className={cn(
                          "flex flex-col items-center gap-1 cursor-pointer transition-all group",
                          isSelected ? "scale-110" : "opacity-60 hover:opacity-100"
                        )}
                      >
                        <div
                          className={cn(
                            "p-3 rounded-full border-2 transition-all",
                            isSelected
                              ? `border-current ${color} bg-accent/20`
                              : "border-transparent bg-muted group-hover:bg-accent"
                          )}
                        >
                          <Icon className={cn("w-6 h-6", isSelected && color)} />
                        </div>
                        <span
                          className={cn("text-[10px] font-medium text-center", isSelected && color)}
                        >
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Pain Section */}
        <div className="space-y-4 pt-4 border-t">
          <FormField
            control={form.control}
            name="pain_discomfort"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-muted/20">
                <div className="space-y-0.5">
                  <FormLabel className="text-base font-semibold flex items-center gap-2">
                    <UserX className="w-4 h-4" /> Dor ou Desconforto?
                  </FormLabel>
                  <FormDescription>
                    Marque se sentiu dores anormais ou lesões nesta semana.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          {hasPain && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300 pl-4 border-l-2 border-destructive/30">
              {/* Pain Area (Body Chips) */}
              <FormField
                control={form.control}
                name="pain_area"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-destructive font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" /> Onde dói?
                    </FormLabel>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {PAIN_AREAS.map((area) => {
                        const selected = form.watch("pain_area")?.includes(area);
                        return (
                          <Badge
                            key={area}
                            variant={selected ? "destructive" : "outline"}
                            className={cn(
                              "cursor-pointer text-sm py-1 px-3 hover:bg-destructive/10 hover:text-destructive hover:border-destructive",
                              selected && "hover:bg-destructive hover:text-white"
                            )}
                            onClick={() => togglePainArea(area)}
                          >
                            {area}
                          </Badge>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Pain Intensity Slider */}
              <FormField
                control={form.control}
                name="pain_intensity"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between mb-2">
                      <FormLabel>Nível de Dor (0-10)</FormLabel>
                      <span className="font-bold text-destructive">{field.value}</span>
                    </div>
                    <Slider
                      defaultValue={[field.value || 0]}
                      max={10}
                      step={1}
                      onValueChange={(vals) => field.onChange(vals[0])}
                      className="[&_.range]:bg-destructive"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>Sem dor</span>
                      <span>Insuportável</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Pain Details */}
              <FormField
                control={form.control}
                name="pain_details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detalhes (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva melhor o que sente..."
                        className="resize-none h-20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        <FormField
          control={form.control}
          name="improvement_suggestions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sugestões de Melhoria (Opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tem algo que poderíamos melhorar no app ou nos treinos?"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="comments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Outras Observações</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Algo mais que queira compartilhar? (Como foi a alimentação, sono, etc)"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          size="lg"
          className="w-full text-base font-semibold shadow-lg hover:shadow-primary/20 transition-all"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Send className="mr-2 h-5 w-5" />
              Enviar Feedback
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
