import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plan } from "@/types/product";

export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .order("position", { ascending: true }); // Assume 'position' exists, otherwise use 'created_at'

      if (error) throw error;

      // Map database fields to Plan interface if names differ slightly
      const mappedPlans: Plan[] = (data || []).map((p: any) => ({
        id: p.id,
        nome: p.name,
        preco: parseFloat(p.price),
        precoMensal: p.monthly_price,
        descricao: p.description,
        economia: p.savings,
        features: p.features || [],
        destaque: p.highlight,
        cta: p.cta,
        hidden: p.hidden,
      }));

      setPlans(mappedPlans);
    } catch (error: any) {
      console.error("Erro ao buscar planos:", error);
      toast.error("Erro ao carregar planos");
    } finally {
      setLoading(false);
    }
  };

  const updatePlan = async (id: string, updates: Partial<Plan>) => {
    try {
      const dbUpdates: any = {};
      if (updates.nome) dbUpdates.name = updates.nome;
      if (updates.preco !== undefined) dbUpdates.price = updates.preco;
      if (updates.precoMensal) dbUpdates.monthly_price = updates.precoMensal;
      if (updates.descricao) dbUpdates.description = updates.descricao;
      if (updates.economia !== undefined) dbUpdates.savings = updates.economia;
      if (updates.features) dbUpdates.features = updates.features;
      if (updates.destaque !== undefined) dbUpdates.highlight = updates.destaque;
      if (updates.cta) dbUpdates.cta = updates.cta;
      if (updates.hidden !== undefined) dbUpdates.hidden = updates.hidden;

      const { error } = await supabase.from("plans").update(dbUpdates).eq("id", id);

      if (error) throw error;

      toast.success("Plano atualizado com sucesso!");
      await fetchPlans();
    } catch (error: any) {
      console.error("Erro ao atualizar plano:", error);
      toast.error("Erro ao salvar alterações");
      throw error;
    }
  };

  const createPlan = async (plan: Omit<Plan, "id"> & { id: string }) => {
    try {
      const dbPlan = {
        id: plan.id, // ID manual (slug)
        name: plan.nome,
        price: plan.preco,
        monthly_price: plan.precoMensal,
        description: plan.descricao,
        savings: plan.economia,
        features: plan.features,
        highlight: plan.destaque,
        cta: plan.cta,
        hidden: plan.hidden,
        position: 99, // Default position
      };

      const { error } = await supabase.from("plans").upsert([dbPlan], { onConflict: "id" });

      if (error) throw error;

      toast.success(`Plano ${plan.nome} processado com sucesso!`);
      await fetchPlans();
    } catch (error: any) {
      console.error("Erro ao criar/atualizar plano:", error);
      toast.error(`Erro ao processar plano ${plan.nome}`);
      throw error;
    }
  };

  const deletePlan = async (id: string) => {
    try {
      const { error } = await supabase.from("plans").delete().eq("id", id);

      if (error) throw error;

      toast.success("Plano excluído com sucesso!");
      await fetchPlans();
    } catch (error: any) {
      console.error("Erro ao excluir plano:", error);
      toast.error("Erro ao excluir plano");
      throw error;
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return { plans, loading, fetchPlans, updatePlan, createPlan, deletePlan };
}
