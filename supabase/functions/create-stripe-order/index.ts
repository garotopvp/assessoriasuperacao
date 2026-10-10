import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { checkRateLimit } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Calcular taxa do Stripe (3.99% + R$ 0.40)
const calculateStripeFee = (amount: number): number => {
  return amount * 0.0399 + 0.4;
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-STRIPE-ORDER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const authKey = supabaseAnonKey || supabaseServiceRoleKey;
    if (!supabaseUrl || !authKey || !supabaseServiceRoleKey) {
      throw new Error("Supabase credentials not configured");
    }

    const { items, userId, customer, includeStripeFee = true, cancelUrl } = await req.json();
    logStep("Request body parsed", { itemsCount: items?.length, userId });

    if (!items || items.length === 0) {
      throw new Error("Items are required");
    }

    // Rate limiting - máximo 10 pedidos por minuto
    try {
      await checkRateLimit(userId, "create-order", {
        points: 10,
        duration: 60,
        blockDuration: 300,
      });
    } catch (rateLimitError) {
      logStep("Rate limit exceeded", { userId });
      return new Response(JSON.stringify({ error: rateLimitError.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 429,
      });
    }

    // Calcular valor total
    const baseAmount = items.reduce((sum: number, item: any) => {
      return sum + item.price * item.quantity;
    }, 0);

    const stripeFee = includeStripeFee ? calculateStripeFee(baseAmount) : 0;
    const finalAmount = baseAmount + stripeFee;

    logStep("Amounts calculated", {
      baseAmount: baseAmount.toFixed(2),
      stripeFee: stripeFee.toFixed(2),
      finalAmount: finalAmount.toFixed(2),
    });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      maxNetworkRetries: 2,
    });

    // Create Supabase client
    const supabaseClient = createClient(supabaseUrl, authKey);

    // Get user info
    const authHeader = req.headers.get("Authorization");
    let userEmail: string | undefined;
    let customerId: string | undefined;

    if (!authHeader) {
      logStep("Missing Authorization header");
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !data.user?.email) {
      logStep("Invalid user token", { error: authError });
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    userEmail = data.user.email;
    logStep("User authenticated", { email: userEmail });

    // Check if Stripe customer exists
    if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Found existing Stripe customer", { customerId });
      }
    }

    // Criar line items para o Stripe
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: "brl",
        unit_amount: Math.round(item.price * 100), // Centavos
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : undefined,
          metadata: {
            size: item.size || "",
          },
        },
      },
      quantity: item.quantity,
    }));

    // Adicionar taxa como item separado se necessário
    if (includeStripeFee && stripeFee > 0) {
      lineItems.push({
        price_data: {
          currency: "brl",
          unit_amount: Math.round(stripeFee * 100),
          product_data: {
            name: "Taxa de processamento Stripe",
            description: "3,99% + R$ 0,40",
          },
        },
        quantity: 1,
      });
    }

    const origin = req.headers.get("origin") || "https://boracorrerclub.com";

    const sanitizeRedirect = (target?: string, fallback?: string) => {
      if (!target) return fallback;
      try {
        const url = new URL(target);
        if (url.origin !== origin) {
          logStep("Rejecting redirect outside origin", { target, origin });
          return fallback;
        }
        return url.toString();
      } catch {
        logStep("Invalid redirect URL", { target });
        return fallback;
      }
    };

    const finalCancelUrl = sanitizeRedirect(cancelUrl, `${origin}/loja`) ?? `${origin}/loja`;

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail || customer?.email,
      line_items: lineItems,
      payment_method_types: ["card"],
      mode: "payment",
      success_url: `${origin}/shop-sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: finalCancelUrl,
      metadata: {
        user_id: userId || "",
        type: "shop_order",
        base_amount: baseAmount.toString(),
        stripe_fee: stripeFee.toFixed(2),
        final_amount: finalAmount.toFixed(2),
        items: JSON.stringify(
          items.map((i: any) => ({
            name: i.name,
            size: i.size,
            quantity: i.quantity,
            price: i.price,
          }))
        ),
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // Criar order no banco de dados
    const supabaseAdminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: order, error: orderError } = await supabaseAdminClient
      .from("orders")
      .insert({
        user_id: userId,
        customer_email: userEmail,
        status: "pending",
        payment_method: "card",
        total: finalAmount,
        total_amount: finalAmount,
        items: items,
        stripe_session_id: session.id,
        payment_provider: "stripe",
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (orderError) {
      logStep("Database error", { error: orderError });
    } else {
      logStep("Order created in database", { orderId: order.id });
    }

    return new Response(
      JSON.stringify({
        url: session.url,
        sessionId: session.id,
        orderId: order?.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
