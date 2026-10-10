import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-signature",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[INFINITEPAY-WEBHOOK] ${step}${detailsStr}`);
};

// Helper function to decrement stock
async function decrementStockForItems(
  supabaseClient: any,
  items: Array<{ name: string; size?: string; quantity: number }>
) {
  for (const item of items) {
    if (!item.size) {
      logStep("Skipping stock decrement - no size", { item: item.name });
      continue;
    }

    const productName = item.name.replace(/\s*-\s*Tam\.\s*\w+$/i, "").trim();

    const { data: products, error: findError } = await supabaseClient
      .from("products")
      .select("id, nome, estoque")
      .ilike("nome", `%${productName}%`)
      .limit(1);

    if (findError || !products || products.length === 0) {
      logStep("Product not found for stock decrement", { productName, error: findError });
      continue;
    }

    const product = products[0];
    const estoque = product.estoque as Record<string, number> | null;
    const currentStock = estoque?.[item.size] ?? 0;
    const newStock = Math.max(0, currentStock - (item.quantity || 1));

    const { error: updateError } = await supabaseClient
      .from("products")
      .update({
        estoque: {
          ...estoque,
          [item.size]: newStock,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", product.id);

    if (updateError) {
      logStep("Failed to decrement stock", {
        productId: product.id,
        size: item.size,
        error: updateError,
      });
    } else {
      logStep("Stock decremented", {
        product: product.nome,
        size: item.size,
        from: currentStock,
        to: newStock,
      });
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const body = await req.text();
    const event = JSON.parse(body);

    logStep("Event received", { event: event.event, id: event.id });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Handle InfinitePay events (usually 'transaction.created', 'transaction.updated' or 'billing.paid' if via invoice)
    // The shop integration uses "Invoices" so we likely receive 'billing.paid' similar to Abacate
    if (event.event === "billing.paid") {
      logStep("Processing billing.paid event");

      const billingData = event.data?.billing || event.data;
      const paymentData = event.data?.payment;
      const billingId = billingData?.id || event.id;
      const customerEmail = billingData?.customer?.email;

      // Metadata passed during checkout creation
      const metadata = billingData?.metadata || {};

      let items = [];
      if (metadata.items) {
        try {
          items = JSON.parse(metadata.items);
        } catch (e) {
          logStep("Error parsing items metadata", e);
        }
      } else if (billingData.items) {
        // Sometimes items come directly in billing data
        items = billingData.items;
      }

      const total = paymentData?.amount ? paymentData.amount / 100 : 0;

      // Check if order exists (using similar logic to abacate webhook for consistency)
      const { data: existingOrder } = await supabaseAdmin
        .from("orders")
        .select("id, status")
        .eq("stripe_session_id", `infinitepay_${billingId}`)
        .maybeSingle();

      if (existingOrder) {
        if (existingOrder.status !== "paid") {
          await supabaseAdmin
            .from("orders")
            .update({ status: "paid", updated_at: new Date().toISOString() })
            .eq("id", existingOrder.id);
          logStep("Order updated to paid", { orderId: existingOrder.id });

          if (items.length > 0) await decrementStockForItems(supabaseAdmin, items);

          // Enviar email de confirmação para pedido existente
          if (customerEmail && supabaseUrl) {
            const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
            await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${serviceRoleKey}`,
              },
              body: JSON.stringify({
                type: "status_update",
                email: customerEmail,
                orderId: existingOrder.id,
                status: "paid",
                total,
                items: existingOrder.items || items,
              }),
            }).catch((e) => console.error("Erro ao enviar email (InfinitePay update):", e));
          }
        } else {
          logStep("Order already paid");
        }
      } else {
        // Create new order
        const { data: order, error: orderError } = await supabaseAdmin
          .from("orders")
          .insert({
            stripe_session_id: `infinitepay_${billingId}`, // Generic Prefix
            customer_email: customerEmail || "infinitepay@boracorrerclub.com.br",
            status: "paid",
            total,
            items,
            user_id: metadata.user_id || null,
          })
          .select()
          .single();

        if (orderError) {
          logStep("Error creating order", orderError);
        } else {
          logStep("New order created", { orderId: order.id });

          // Create Order Items
          if (items.length > 0) {
            const orderItems = items.map((item: any) => ({
              order_id: order.id,
              product_name: item.name || item.description,
              product_size: item.size || null,
              price: item.price,
              quantity: item.quantity || 1,
            }));

            await supabaseAdmin.from("order_items").insert(orderItems);
            await decrementStockForItems(supabaseAdmin, items);
          }

          // Enviar email de confirmação para novo pedido
          if (customerEmail && supabaseUrl) {
            const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
            await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${serviceRoleKey}`,
              },
              body: JSON.stringify({
                type: "confirmation",
                email: customerEmail,
                orderId: order.id,
                status: "paid",
                total,
                items,
              }),
            }).catch((e) => console.error("Erro ao enviar email (InfinitePay insert):", e));
          }
        }
      }
    } else {
      logStep("Unhandled event type", { type: event.event });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    logStep("Webhook error", { error: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
