import { logger } from "@/lib/logger";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface HeroImage {
  url: string;
  posicao: string;
}

const DEFAULT_IMAGES: Record<string, HeroImage> = {
  home: {
    url: "/images/hero-home.jpg",
    posicao: "center",
  },
  consultoria: {
    url: "https://images.unsplash.com/photo-1461896836934-afa09e5b7a3e?w=1920&q=80",
    posicao: "50% 50%",
  },
  roupas: {
    url: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=1920&q=80",
    posicao: "50% 50%",
  },
  conhecimento: {
    url: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1920&q=80",
    posicao: "center",
  },
};

// Memory cache para evitar refetch
const imageCache = new Map<string, HeroImage>();

// Pré-carrega a imagem no browser
function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
}

export function useHeroImage(pagina: string) {
  const [heroImage, setHeroImage] = useState<HeroImage | null>(() => {
    // Inicia com cache se disponível
    return imageCache.get(pagina) || null;
  });
  const [loading, setLoading] = useState(!imageCache.has(pagina));
  const [imageLoaded, setImageLoaded] = useState(false);

  const fetchHeroImage = useCallback(async () => {
    // Se já temos no cache, usa direto
    if (imageCache.has(pagina)) {
      const cached = imageCache.get(pagina)!;
      setHeroImage(cached);
      setLoading(false);
      setImageLoaded(true);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("hero_images")
        .select("url, posicao")
        .eq("pagina", pagina)
        .maybeSingle();

      if (error) throw error;

      let imageData: HeroImage;

      if (data && data.url) {
        imageData = {
          url: data.url,
          posicao: data.posicao || "center",
        };
      } else {
        imageData = DEFAULT_IMAGES[pagina] || DEFAULT_IMAGES.home;
      }

      // Pré-carrega a imagem antes de atualizar o state
      try {
        await preloadImage(imageData.url);
      } catch {
        // Se falhar ao carregar, usa fallback
        logger.warn("Failed to preload hero image, using as-is");
      }

      // Salva no cache
      imageCache.set(pagina, imageData);

      setHeroImage(imageData);
      setImageLoaded(true);
    } catch (err) {
      logger.error("Error fetching hero image:", err);
      const fallback = DEFAULT_IMAGES[pagina] || DEFAULT_IMAGES.home;
      setHeroImage(fallback);
      setImageLoaded(true);
    } finally {
      setLoading(false);
    }
  }, [pagina]);

  useEffect(() => {
    fetchHeroImage();
  }, [fetchHeroImage]);

  const finalImage = heroImage || DEFAULT_IMAGES[pagina] || DEFAULT_IMAGES.home;

  return {
    heroImage: finalImage,
    loading,
    imageLoaded,
  };
}

// Função para invalidar o cache de uma página específica ou todo o cache
export function clearHeroImageCache(pagina?: string) {
  if (pagina) {
    imageCache.delete(pagina);
    logger.info(`Cache cleared for page: ${pagina}`);
  } else {
    imageCache.clear();
    logger.info("All hero image cache cleared");
  }
}

// Função para pré-carregar hero images de outras páginas em background
export function prefetchHeroImages(paginas: string[]) {
  paginas.forEach(async (pagina) => {
    if (imageCache.has(pagina)) return;

    try {
      const { data } = await supabase
        .from("hero_images")
        .select("url, posicao")
        .eq("pagina", pagina)
        .maybeSingle();

      if (data?.url) {
        const imageData = {
          url: data.url,
          posicao: data.posicao || "50% 50%",
        };

        await preloadImage(imageData.url);
        imageCache.set(pagina, imageData);
      }
    } catch {
      // Silently fail for prefetch
    }
  });
}
