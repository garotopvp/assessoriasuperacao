import { logger } from "@/lib/logger";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Profile {
  user_id: string;
  email: string;
  nome_completo: string | null;
  cpf: string | null;
  telefone: string | null;
  data_nascimento: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Hook que mantém os perfis atualizados em tempo real
 * Subscreve mudanças na tabela profiles via Supabase Realtime
 */
export function useRealtimeProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Buscar dados iniciais
    const fetchProfiles = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setProfiles(data || []);
      } catch (error: unknown) {
        logger.error("Erro ao buscar perfis:", error);
        toast.error("Erro ao carregar perfis");
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();

    // Subscrever mudanças em tempo real
    const channel = supabase
      .channel("profiles-realtime")
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE
          schema: "public",
          table: "profiles",
        },
        (payload) => {
          logger.info("Mudança detectada:", payload);

          if (payload.eventType === "INSERT") {
            setProfiles((current) => [payload.new as Profile, ...current]);
            toast.success("Novo usuário cadastrado!");
          } else if (payload.eventType === "UPDATE") {
            setProfiles((current) =>
              current.map((profile) =>
                profile.user_id === (payload.new as Profile).user_id
                  ? (payload.new as Profile)
                  : profile
              )
            );
            toast.info("Perfil atualizado");
          } else if (payload.eventType === "DELETE") {
            setProfiles((current) =>
              current.filter((profile) => profile.user_id !== (payload.old as Profile).user_id)
            );
            toast.info("Usuário removido");
          }
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { profiles, loading, setProfiles };
}
