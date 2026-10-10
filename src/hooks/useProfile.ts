import { logger } from "@/lib/logger";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

export interface Profile {
  id: string;
  user_id: string;
  nome_completo: string | null;
  telefone: string | null;
  cpf: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  avatar_url: string | null;
  terms_accepted_at: string | null;
  squad_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuthContext();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;
        setProfile(data as unknown as Profile);
      } catch (err) {
        logger.error("Error fetching profile:", err);
        setError("Erro ao carregar perfil");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { success: false, error: "Usuário não autenticado" };

    try {
      // Use upsert to create profile if it doesn't exist
      const { data, error } = await supabase
        .from("profiles")
        .upsert({ ...updates, user_id: user.id }, { onConflict: "user_id" })
        .select()
        .single();

      if (error) throw error;

      setProfile(data as unknown as Profile);
      return { success: true };
    } catch (err) {
      logger.error("Error updating profile:", err);
      return { success: false, error: "Erro ao atualizar perfil" };
    }
  };

  return { profile, loading, error, updateProfile };
}
