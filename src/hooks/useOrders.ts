import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useEffect } from "react";

import { Json } from "@/integrations/supabase/types";

export interface OrderItem {
  id: string;
  product_name: string;
  product_size: string | null;
  price: number;
  quantity: number;
  product_image: string | null;
}

export interface Order {
  id: string;
  stripe_session_id: string;
  stripe_payment_intent: string | null;
  customer_email: string;
  status: string;
  total: number;
  items: Json;
  shipping_address: Json | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  order_items?: OrderItem[];
}

export function useOrders() {
  const { user } = useAuthContext();

  const {
    data: orders,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["orders", user?.id, user?.email],
    queryFn: async (): Promise<Order[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items (*)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []) as Order[];
    },
    enabled: !!user,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetch]);

  return {
    orders: orders || [],
    loading: isLoading,
    error,
    refetch,
  };
}

export function useOrderBySessionId(sessionId: string | null) {
  const {
    data: order,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["order", sessionId],
    queryFn: async (): Promise<Order | null> => {
      if (!sessionId) return null;

      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items (*)
        `
        )
        .eq("stripe_session_id", sessionId)
        .maybeSingle();

      if (error) throw error;

      return data as Order | null;
    },
    enabled: !!sessionId,
    refetchInterval: (query) => {
      // Poll every 2 seconds if status is pending/awaiting_payment
      const status = query.state.data?.status;
      if (status === "pending" || status === "awaiting_payment") {
        return 2000;
      }
      return false;
    },
  });

  return {
    order,
    loading: isLoading,
    error,
    refetch,
  };
}
