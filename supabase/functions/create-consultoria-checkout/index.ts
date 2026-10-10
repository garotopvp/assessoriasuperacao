import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapeamento de planos para price_id do Stripe
const PLAN_PRICES: Record<string, { priceId: string; name: string }> = {
  anual: {
    priceId: "price_1SigTlBcYUb3BZC7v3bkUI6W",
    name: "Plano Anual - Bora Correr",
  },
  semestral: {
    priceId: "price_1SigTFBcYUb3BZC7ZYz7E57D",
    name: "Plano Semestral - Bora Correr",
  },
  trimestral: {
    priceId: "price_1SigT4BcYUb3BZC7CzZSwNrS",
    name: "Plano Trimestral - Bora Correr",
  },
  mensal: {
    priceId: "price_1SigPSBcYUb3BZC7AQtll0GG",
    name: "Plano Mensal - Bora Correr",
  },
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-CONSULTORIA-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Get request body
    const { planId } = await req.json();
    logStep("Request body parsed", { planId });

    // Validate plan
    const plan = PLAN_PRICES[planId];
    if (!plan) {
      throw new Error(`Invalid plan: ${planId}`);
    }
    logStep("Plan validated", { planId, priceId: plan.priceId });

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Try to get authenticated user (optional)
    const authHeader = req.headers.get("Authorization");
    let userEmail: string | undefined;
    let customerId: string | undefined;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      if (data.user?.email) {
        userEmail = data.user.email;
        logStep("User authenticated", { email: userEmail });
      }
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists in Stripe
    if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Found existing Stripe customer", { customerId });
      }
    }

    // Get origin for redirect URLs
    const origin = req.headers.get("origin") || "https://charm-creator-nest.lovable.app";

    // Create Stripe Checkout Session for subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      payment_method_types: ["card", "boleto"], // Pix is often enabled via Boleto or explicit 'pix' if activated in Dashboard. Using standard Brazil methods.
      mode: "subscription",
      success_url: `${origin}/sucesso?plan=${planId}`,
      cancel_url: `${origin}/consultoria`,
      metadata: {
        plan_id: planId,
        plan_name: plan.name,
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
