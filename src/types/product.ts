export interface Product {
  id: number;
  nome: string;
  preco: number;
  imagem: string;
  imagem_principal?: string;
  descricao: string;
  tamanhos: string[];
}

export interface CartItem {
  id: number;
  produtoId: number;
  nome: string;
  preco: number;
  tamanho: string;
  imagem: string;
  imagem_principal?: string;
  quantidade: number;
}

export interface Plan {
  id: string;
  nome: string;
  preco: number;
  precoMensal: string;
  descricao: string;
  economia?: string;
  features: string[];
  destaque?: boolean;
  cta: string;
  hidden?: boolean;
}

export interface DiscountCoupon {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_discount_amount?: number;
  valid_from: string;
  valid_until: string | null;
  max_uses: number | null;
  current_uses: number;
  active: boolean;
  applicable_plans?: string[];
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}
