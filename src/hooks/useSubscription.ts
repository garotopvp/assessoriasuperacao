import { logger } from "@/lib/logger";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

export interface SubscriptionData {
  id: string;
  plan_name: string;
  amount: number;
  status: "active" | "past_due" | "canceled" | "blocked" | "waiting_details" | "unpaid";
  next_billing_date: string;
  created_at: string;
  invoice_link?: string;
  subscribed: boolean;
  subscription_end?: string;
}

export interface RecurringSubscriptionRow {
  id: string;
  user_id: string | null;
  plan_name: string;
  amount: number;
  status: "active" | "past_due" | "canceled" | "blocked" | "waiting_details" | "unpaid";
  next_billing_date: string;
  created_at: string;
}

export interface SubscriptionInvoiceRow {
  payment_link: string;
  subscription_id: string;
  status: string;
  created_at: string;
}

export function useSubscription() {
  const { user } = useAuthContext();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkSubscription();
    } else {
      setLoading(false);
    }
  }, [user]);

  const checkSubscription = async () => {
    try {
      // Fetch the most recent subscription for the user
      // Using 'as any' for table name because it might be a view or missing from types
      const { data: sub, error } = await supabase
        .from("recurring_subscriptions" as any)
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        logger.error("Erro ao buscar assinatura:", error);
      }

      if (sub) {
        const subscriptionData = sub as unknown as RecurringSubscriptionRow;

        // Fetch latest pending invoice
        const { data: inv } = await supabase
          .from("subscription_invoices" as any)
          .select("payment_link")
          .eq("subscription_id", subscriptionData.id)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const invoiceData = inv as unknown as SubscriptionInvoiceRow | null;

        setSubscription({
          id: subscriptionData.id,
          plan_name: subscriptionData.plan_name,
          amount: subscriptionData.amount,
          status: subscriptionData.status,
          next_billing_date: subscriptionData.next_billing_date,
          created_at: subscriptionData.created_at,
          invoice_link: invoiceData?.payment_link,
          subscribed: ["active", "past_due", "canceled", "partnership"].includes(
            subscriptionData.status
          ),
          subscription_end: subscriptionData.next_billing_date,
        });
      } else {
        setSubscription(null);
      }
    } catch (error: unknown) {
      logger.error("Erro ao verificar assinatura:", error);
    } finally {
      setLoading(false);
    }
  };

  return { subscription, loading, refetch: checkSubscription };
}
