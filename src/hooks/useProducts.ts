import { logger } from "@/lib/logger";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  nome: string;
  preco: number;
  descricao: string | null;
  detalhes: string | null;
  tamanhos: string[];
  imagem_principal: string | null;
  imagens: string[];
  estoque: Record<string, number> | null;
}

// Fallback products if API fails
const fallbackProducts: Product[] = [
  {
    id: "1",
    nome: "Regata Basic Run",
    preco: 100,
    descricao: "Regata leve para treinos",
    detalhes: "Tecido técnico com tecnologia UV 50+",
    tamanhos: ["P", "M", "G", "GG"],
    imagem_principal: "https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=600&q=80",
    imagens: [],
    estoque: { P: 10, M: 10, G: 10, GG: 10 },
  },
  {
    id: "2",
    nome: "Boné Essential Cap",
    preco: 100,
    descricao: "Boné para corrida",
    detalhes: "Proteção solar e ventilação",
    tamanhos: ["UNICO"],
    imagem_principal: "https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=600&q=80",
    imagens: [],
    estoque: { UNICO: 10 },
  },
  {
    id: "3",
    nome: "Top Essential Fit",
    preco: 79.9,
    descricao: "Sustentação, estilo e proteção",
    detalhes: "Modelagem compressiva inteligente",
    tamanhos: ["P", "M", "G", "GG"],
    imagem_principal: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&q=80",
    imagens: [],
    estoque: { P: 10, M: 10, G: 10, GG: 10 },
  },
  {
    id: "4",
    nome: "T-Shirt Essential Core",
    preco: 100,
    descricao: "Camiseta técnica",
    detalhes: "Tecido com termorregulação avançada",
    tamanhos: ["P", "M", "G", "GG"],
    imagem_principal: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
    imagens: [],
    estoque: { P: 10, M: 10, G: 10, GG: 10 },
  },
  {
    id: "5",
    nome: "T-Shirt Essential Fit",
    preco: 100,
    descricao: "Camiseta de performance",
    detalhes: "Design moderno e confortável",
    tamanhos: ["P", "M", "G", "GG"],
    imagem_principal: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&q=80",
    imagens: [],
    estoque: { P: 10, M: 10, G: 10, GG: 10 },
  },
  {
    id: "6",
    nome: "Manga Longa Run",
    preco: 120,
    descricao: "Proteção UV para longões",
    detalhes: "Tecido leve e respirável",
    tamanhos: ["P", "M", "G", "GG", "XXG"],
    imagem_principal: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80",
    imagens: [],
    estoque: { P: 10, M: 10, G: 10, GG: 10, XXG: 10 },
  },
];

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProducts() {
      try {
        // Query directly from Supabase client
        const { data, error: queryError } = await supabase
          .from("products")
          .select("*")
          .eq("ativo", true)
          .order("ordem", { ascending: true });

        if (queryError) {
          throw queryError;
        }

        if (data && data.length > 0) {
          // Transform API response to match our Product interface
          const transformedProducts: Product[] = data.map((p) => ({
            id: p.id,
            nome: p.nome,
            preco: typeof p.preco === "string" ? parseFloat(p.preco) : p.preco,
            descricao: p.descricao,
            detalhes: p.detalhes,
            tamanhos: p.tamanhos || ["P", "M", "G", "GG"],
            imagem_principal: p.imagem_principal,
            imagens: p.imagens || [],
            estoque: p.estoque as Record<string, number> | null,
          }));
          setProducts(transformedProducts);
        } else {
          setProducts(fallbackProducts);
        }
      } catch (err) {
        logger.error("Failed to fetch products:", err);
        setProducts(fallbackProducts);
        setError("Using fallback products");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  return { products, loading, error };
}
