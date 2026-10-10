import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2, PlusCircle } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useWorkouts } from "@/hooks/useWorkouts";
import { ptBR } from "date-fns/locale";

const formSchema = z.object({
  workout_date: z.date({
    required_error: "A data do treino é obrigatória.",
  }),
  workout_type: z.string({
    required_error: "Selecione o tipo de treino.",
  }),
  distance_km: z.coerce.number().min(0, { message: "Distância inválida" }).optional(),
  duration_minutes: z.coerce.number().min(1, { message: "Duração mínima de 1 minuto" }),
  rpe: z.array(z.number().min(0).max(10)).default([5]), // Slider returns array
  feedback_text: z.string().optional(),
});

export function WorkoutForm({ onSuccess }: { onSuccess?: () => void }) {
  const { addWorkout } = useWorkouts();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workout_date: new Date(),
      workout_type: "Corrida Leve",
      distance_km: 0,
      duration_minutes: 30,
      rpe: [5], // RPE médio
      feedback_text: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      // Calculate pace string if distance > 0
      let pace = "";
      if (values.distance_km && values.distance_km > 0 && values.duration_minutes > 0) {
        const paceDecimal = values.duration_minutes / values.distance_km;
        const paceMinutes = Math.floor(paceDecimal);
        const paceSeconds = Math.round((paceDecimal - paceMinutes) * 60);
        pace = `${paceMinutes}:${paceSeconds < 10 ? "0" : ""}${paceSeconds} min/km`;
      }

      const workoutData = {
        workout_date: format(values.workout_date, "yyyy-MM-dd"),
        workout_type: values.workout_type,
        distance_km: values.distance_km || 0,
        duration_minutes: values.duration_minutes,
        rpe: values.rpe[0],
        pace: pace,
        feedback_text: values.feedback_text || "",
      };

      await addWorkout(workoutData);
      form.reset();
      if (onSuccess) onSuccess();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 bg-card p-6 rounded-lg border shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="workout_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data do Treino</FormLabel>
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
                          format(field.value, "PPP", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
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

          <FormField
            control={form.control}
            name="workout_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Treino</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Corrida Leve">Corrida Leve</SelectItem>
                    <SelectItem value="Corrida Moderada">Corrida Moderada</SelectItem>
                    <SelectItem value="Corrida Forte">Corrida Forte</SelectItem>
                    <SelectItem value="Longo">Longo</SelectItem>
                    <SelectItem value="Tiro / Intervalado">Tiro / Intervalado</SelectItem>
                    <SelectItem value="Fartlek">Fartlek</SelectItem>
                    <SelectItem value="Regenerativo">Regenerativo</SelectItem>
                    <SelectItem value="Fortalecimento">Fortalecimento</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="distance_km"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Distância (km)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormDescription>Ex: 10.5 para 10km e 500m.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration_minutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duração (minutos)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormDescription>Tempo total do treino.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="rpe"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Esforço Percebido (RPE): {field.value}</FormLabel>
              <FormControl>
                <Slider
                  min={0}
                  max={10}
                  step={1}
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                  className="py-4"
                />
              </FormControl>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Muito Leve (0)</span>
                <span>Moderado (5)</span>
                <span>Exaustivo (10)</span>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="feedback_text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Feedback / Comentários</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Como você se sentiu? Alguma dor ou incômodo?"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <PlusCircle className="mr-2 h-4 w-4" />
              Registrar Treino
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
