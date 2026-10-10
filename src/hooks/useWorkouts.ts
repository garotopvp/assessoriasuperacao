import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";
import { Tables } from "@/integrations/supabase/types";

export type WorkoutLog = Tables<"workout_logs">;

export function useWorkouts() {
  const { user } = useAuthContext();
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkouts = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("workout_date", { ascending: false });

      if (error) throw error;
      setWorkouts(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar treinos: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addWorkout = async (
    workout: Omit<WorkoutLog, "id" | "user_id" | "created_at" | "updated_at">
  ) => {
    if (!user) {
      toast.error("Você precisa estar logado para salvar um treino.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("workout_logs")
        .insert([{ ...workout, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      setWorkouts((prev) => [data, ...prev]);
      toast.success("Treino salvo com sucesso!");
      return data;
    } catch (error: any) {
      toast.error("Erro ao salvar treino: " + error.message);
      return null;
    }
  };

  const deleteWorkout = async (id: string) => {
    try {
      const { error } = await supabase.from("workout_logs").delete().eq("id", id);
      if (error) throw error;

      setWorkouts((prev) => prev.filter((w) => w.id !== id));
      toast.success("Treino removido.");
    } catch (error: any) {
      toast.error("Erro ao remover treino: " + error.message);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  return {
    workouts,
    loading,
    addWorkout,
    deleteWorkout,
    refresh: fetchWorkouts,
  };
}
