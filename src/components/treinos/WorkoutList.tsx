import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Trash2, Ruler, Clock, Activity, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useWorkouts } from "@/hooks/useWorkouts";
import { cn } from "@/lib/utils";

export function WorkoutList() {
  const { workouts, loading, deleteWorkout } = useWorkouts();

  // Helper para cor do RPE
  const getRpeColor = (rpe: number | null) => {
    if (!rpe) return "bg-gray-100 text-gray-800";
    if (rpe <= 3) return "bg-green-100 text-green-800";
    if (rpe <= 6) return "bg-yellow-100 text-yellow-800";
    if (rpe <= 8) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (workouts.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg bg-accent/20">
        <CalendarDays className="mx-auto h-12 w-12 opacity-50 mb-4" />
        <h3 className="text-lg font-medium mb-1">Nenhum treino registrado</h3>
        <p>Comece a registrar seus treinos para acompanhar sua evolução!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {workouts.map((workout) => (
        <Card
          key={workout.id}
          className="relative group overflow-hidden transition-all hover:shadow-md border-border/60"
        >
          <CardHeader className="pb-3 bg-muted/40">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <CardTitle className="text-base font-bold text-primary">
                  {workout.workout_type}
                </CardTitle>
                <CardDescription className="flex items-center gap-1 text-xs">
                  <CalendarDays className="h-3 w-3" />
                  {format(new Date(workout.workout_date), "EEEE, d 'de' MMMM", { locale: ptBR })}
                </CardDescription>
              </div>
              <div
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
                  getRpeColor(workout.rpe)
                )}
              >
                RPE {workout.rpe ?? "-"}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-background border rounded p-2 flex flex-col items-center justify-center">
                <span className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-1">
                  <Ruler className="h-3 w-3" /> Distância
                </span>
                <span className="font-mono font-bold text-lg">
                  {workout.distance_km ? `${workout.distance_km}` : "-"}{" "}
                  <span className="text-xs font-normal text-muted-foreground">km</span>
                </span>
              </div>
              <div className="bg-background border rounded p-2 flex flex-col items-center justify-center">
                <span className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-1">
                  <Clock className="h-3 w-3" /> Duração
                </span>
                <span className="font-mono font-bold text-lg">
                  {workout.duration_minutes}{" "}
                  <span className="text-xs font-normal text-muted-foreground">min</span>
                </span>
              </div>
            </div>

            {workout.pace && (
              <div className="text-center text-xs text-muted-foreground">
                Pace Médio:{" "}
                <span className="font-mono font-medium text-foreground">{workout.pace}</span>
              </div>
            )}

            {workout.feedback_text && (
              <div className="relative mt-2 p-3 bg-muted/30 rounded-md text-xs italic text-muted-foreground border-l-2 border-primary/50">
                "{workout.feedback_text}"
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-0 flex justify-end pb-3 pr-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
              onClick={() => {
                if (confirm("Tem certeza que deseja excluir este registro?")) {
                  deleteWorkout(workout.id);
                }
              }}
              title="Excluir treino"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
