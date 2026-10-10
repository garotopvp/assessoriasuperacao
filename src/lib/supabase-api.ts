import { logger } from "@/lib/logger";
import { supabase } from "@/integrations/supabase/client";

// Re-export Product type from useProducts
export type { Product } from "@/hooks/useProducts";

export async function fetchHeroImage(
  pagina: string
): Promise<{ url: string | null; position: string }> {
  try {
    const { data, error } = await supabase
      .from("hero_images")
      .select("url, posicao")
      .eq("pagina", pagina)
      .single();

    if (error) {
      logger.error("Error fetching hero image:", error);
      return { url: null, position: "center center" };
    }

    return { url: data?.url || null, position: data?.posicao || "center center" };
  } catch (err) {
    logger.error("Error fetching hero image:", err);
    return { url: null, position: "center center" };
  }
}
