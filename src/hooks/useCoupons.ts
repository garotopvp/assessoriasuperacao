import { logger } from "@/lib/logger";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DiscountCoupon } from "@/types/product";
import { toast } from "sonner";

export function useCoupons() {
  const [coupons, setCoupons] = useState<DiscountCoupon[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("discount_coupons")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error: any) {
      logger.error("Erro ao buscar cupons:", error);
      // Não mostra toast no fetch inicial para não poluir se for apenas permissão de leitura
      if (error.code !== "PGRST301") {
        // Exclui erro de permissão silencioso se for o caso
        console.error("Erro detalhado ao buscar cupons:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const createCoupon = async (coupon: Partial<DiscountCoupon>) => {
    try {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        throw new Error("Você precisa estar logado para criar cupons.");
      }

      const { data, error } = await supabase
        .from("discount_coupons")
        .insert([
          {
            ...coupon,
            created_by: userData.user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success("Cupom criado com sucesso!");
      await fetchCoupons();
      return data;
    } catch (error: any) {
      logger.error("Erro ao criar cupom:", error);
      console.error("Detalhes do erro:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });

      const msg = error.message || "Erro desconhecido ao criar cupom";
      if (error.code === "42501" || error.code === "PGRST301") {
        toast.error("Permissão negada: Você não tem permissão para criar cupons.");
      } else if (error.code === "23505") {
        toast.error("Erro: Já existe um cupom com este código.");
      } else {
        toast.error(`Erro ao criar cupom: ${msg}`);
      }
      throw error;
    }
  };

  const updateCoupon = async (id: string, updates: Partial<DiscountCoupon>) => {
    try {
      const { error } = await supabase.from("discount_coupons").update(updates).eq("id", id);

      if (error) throw error;

      toast.success("Cupom atualizado com sucesso!");
      await fetchCoupons();
    } catch (error: any) {
      logger.error("Erro ao atualizar cupom:", error);
      toast.error(`Erro ao atualizar cupom: ${error.message}`);
      throw error;
    }
  };

  const deleteCoupon = async (id: string) => {
    try {
      const { error } = await supabase.from("discount_coupons").delete().eq("id", id);

      if (error) throw error;

      toast.success("Cupom deletado com sucesso!");
      await fetchCoupons();
    } catch (error: any) {
      logger.error("Erro ao deletar cupom:", error);
      toast.error(`Erro ao deletar cupom: ${error.message}`);
      throw error;
    }
  };

  const validateCoupon = async (code: string): Promise<DiscountCoupon | null> => {
    try {
      const { data, error } = await supabase
        .from("discount_coupons")
        .select("*")
        .eq("code", code.toUpperCase())
        .eq("active", true)
        .maybeSingle(); // Use maybeSingle to avoid 406 error on multiple matches if unique constraint failed somehow

      if (error) {
        throw error;
      }

      if (!data) {
        // Cupom não encontrado (retornado null pelo maybeSingle)
        return null;
      }

      // Validar data de validade
      if (data.valid_until && new Date(data.valid_until) < new Date()) {
        toast.error("Cupom expirado");
        return null;
      }

      // Validar limite de usos
      if (data.max_uses && data.current_uses >= data.max_uses) {
        toast.error("Cupom atingiu o limite de usos");
        return null;
      }

      return data;
    } catch (error: any) {
      logger.error("Erro ao validar cupom:", error);
      // Não mostrar toast de erro genérico se for apenas não encontrado, o retorno null já trata isso
      return null;
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  return {
    coupons,
    loading,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    validateCoupon,
    refetch: fetchCoupons,
  };
}
