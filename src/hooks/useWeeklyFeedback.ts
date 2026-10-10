import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";
import { Tables } from "@/integrations/supabase/types";

export type WeeklyFeedback = Tables<"weekly_feedbacks">;

export function useWeeklyFeedback() {
  const { user } = useAuthContext();
  const [feedbacks, setFeedbacks] = useState<WeeklyFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedbacks = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("weekly_feedbacks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFeedbacks(data || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error("Erro ao carregar feedbacks: " + message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addFeedback = async (feedback: Omit<WeeklyFeedback, "id" | "user_id" | "created_at">) => {
    if (!user) {
      toast.error("Você precisa estar logado para enviar feedback.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("weekly_feedbacks")
        .insert([{ ...feedback, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      setFeedbacks((prev) => [data, ...prev]);
      toast.success("Feedback enviado com sucesso!");
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error("Erro ao enviar feedback: " + message);
      return null;
    }
  };

  const deleteFeedback = async (id: string) => {
    try {
      const { error } = await supabase.from("weekly_feedbacks").delete().eq("id", id);
      if (error) throw error;

      setFeedbacks((prev) => prev.filter((f) => f.id !== id));
      toast.success("Feedback removido.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error("Erro ao remover feedback: " + message);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  return {
    feedbacks,
    loading,
    addFeedback,
    deleteFeedback,
    refresh: fetchFeedbacks,
  };
}
