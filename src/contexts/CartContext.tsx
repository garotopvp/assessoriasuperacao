import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { CartItem, Product } from "@/types/product";
import { toast } from "sonner";

interface CartContextType {
  cart: CartItem[];
  isCartOpen: boolean;
  addToCart: (product: Product, tamanho: string, quantidade?: number) => void;
  removeFromCart: (itemId: number) => void;
  updateQuantity: (itemId: number, quantidade: number) => void;
  clearCart: () => void;
  toggleCart: (open?: boolean) => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("carrinho");
    if (saved) {
      // Migração: adiciona quantidade = 1 se não existir
      const parsed = JSON.parse(saved);
      return parsed.map((item: any) => ({
        ...item,
        quantidade: item.quantidade || 1,
      }));
    }
    return [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("carrinho", JSON.stringify(cart));
  }, [cart]);

  const addToCart = React.useCallback(
    (product: Product, tamanho: string, quantidade: number = 1) => {
      // Verifica se já existe item com mesmo produto e tamanho
      const existingIndex = cart.findIndex(
        (item) => item.produtoId === product.id && item.tamanho === tamanho
      );

      if (existingIndex >= 0) {
        // Atualiza quantidade do item existente
        setCart((prev) =>
          prev.map((item, index) =>
            index === existingIndex ? { ...item, quantidade: item.quantidade + quantidade } : item
          )
        );
        toast.success(`Quantidade atualizada: ${cart[existingIndex].quantidade + quantidade}x`);
      } else {
        // Adiciona novo item
        const newItem: CartItem = {
          id: Date.now(),
          produtoId: product.id,
          nome: product.nome,
          preco: product.preco,
          tamanho,
          imagem: product.imagem_principal || product.imagem,
          imagem_principal: product.imagem_principal,
          quantidade,
        };
        setCart((prev) => [...prev, newItem]);
        toast.success("Produto adicionado ao carrinho!");
      }
      setIsCartOpen(true);
    },
    [cart]
  );

  const removeFromCart = React.useCallback((itemId: number) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
    toast.info("Produto removido do carrinho");
  }, []);

  const updateQuantity = React.useCallback(
    (itemId: number, quantidade: number) => {
      if (quantidade < 1) {
        removeFromCart(itemId);
        return;
      }
      setCart((prev) => prev.map((item) => (item.id === itemId ? { ...item, quantidade } : item)));
    },
    [removeFromCart]
  );

  const clearCart = React.useCallback(() => {
    setCart([]);
    toast.info("Carrinho limpo");
  }, []);

  const toggleCart = React.useCallback((open?: boolean) => {
    setIsCartOpen((prev) => open ?? !prev);
  }, []);

  const cartTotal = cart.reduce((sum, item) => sum + item.preco * item.quantidade, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantidade, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleCart,
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
