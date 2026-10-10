import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { items, successUrl, cancelUrl, customerEmail, metadata, userId, shippingAddress } =
      await req.json();

    // Build request body
    const params = new URLSearchParams({
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    // Payment method - card only (PIX is handled by Abacate Pay)
    params.append("payment_method_types[0]", "card");

    // Add line items with dynamic pricing
    items.forEach(
      (item: { name: string; price: number; quantity: number; image?: string }, index: number) => {
        params.append(`line_items[${index}][price_data][currency]`, "brl");
        params.append(
          `line_items[${index}][price_data][unit_amount]`,
          String(Math.round(item.price * 100))
        ); // Convert to centavos
        params.append(`line_items[${index}][price_data][product_data][name]`, item.name);
        if (item.image) {
          params.append(`line_items[${index}][price_data][product_data][images][0]`, item.image);
        }
        params.append(`line_items[${index}][quantity]`, String(item.quantity));
      }
    );

    // Optional: Add customer email for prefill
    if (customerEmail) {
      params.append("customer_email", customerEmail);
    }

    // Add items to metadata for webhook processing
    const itemsForMetadata = items.map(
      (item: { name: string; price: number; quantity: number; image?: string; size?: string }) => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image || null,
        size: item.size || null,
      })
    );
    params.append("metadata[items]", JSON.stringify(itemsForMetadata));

    // Add user_id if available
    if (userId) {
      params.append("metadata[user_id]", userId);
    }

    // Add shipping address if available
    if (shippingAddress) {
      params.append("metadata[shipping_address]", JSON.stringify(shippingAddress));
    }

    // Optional: Add custom metadata
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        params.append(`metadata[${key}]`, String(value));
      });
    }

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session = await response.json();

    if (!response.ok) {
      console.error("Stripe error:", session);
      throw new Error(session.error?.message || "Failed to create checkout session");
    }

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    console.error("Checkout error:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
