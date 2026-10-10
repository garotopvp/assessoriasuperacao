import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { checkRateLimit } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_PRICES: Record<string, { amount: number; name: string }> = {
  anual: { amount: 1319.64, name: "Plano Anual - Bora Correr" },
  semestral: { amount: 779.82, name: "Plano Semestral - Bora Correr" },
  trimestral: { amount: 419.91, name: "Plano Trimestral - Bora Correr" },
  mensal: { amount: 149.97, name: "Plano Mensal - Bora Correr" },
  plano_teste: { amount: 9.97, name: "Plano Teste - Bora Correr" },
};

const calculateStripeFee = (amount: number): number => {
  if (amount <= 0) return 0;
  return amount * 0.0399 + 0.4;
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-STRIPE-SUBSCRIPTION] ${step}${detailsStr}`);
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

    const {
      planId,
      userId,
      includeStripeFee = true,
      cancelUrl,
      couponCode,
      isRecurring = false,
    } = await req.json();
    logStep("Request body parsed", { planId, userId, couponCode, isRecurring });

    if (!planId || !userId) {
      throw new Error("planId and userId are required");
    }

    // Rate limiting
    try {
      await checkRateLimit(userId, "create-subscription", {
        points: 5,
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

    const plan = PLAN_PRICES[planId];
    if (!plan) throw new Error(`Invalid plan: ${planId}`);

    let baseAmount = plan.amount;

    // Inicializar Supabase Client
    const supabaseClient = createClient(supabaseUrl, authKey);

    logStep("Processing coupon", { couponCode });

    // Logic de Cupom
    let discountApplied = 0;
    let appliedCouponCode = null;

    if (couponCode) {
      // Buscar cupom usando Service Role key para bypass RLS se necessário,
      // mas aqui só precisamos ler.
      // O authKey já é suficiente.
      const { data: coupon, error: couponError } = await supabaseClient
        .from("discount_coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase())
        .eq("active", true)
        .maybeSingle();

      if (couponError) {
        logStep("Error fetching coupon", { error: couponError });
      } else if (coupon) {
        const now = new Date();
        const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;
        const isExpired = validUntil && validUntil < now;
        const isMaxUsesReached = coupon.max_uses && coupon.current_uses >= coupon.max_uses;
        const isPlanApplicable =
          !coupon.applicable_plans ||
          coupon.applicable_plans.length === 0 ||
          coupon.applicable_plans.includes(planId);

        if (!isExpired && !isMaxUsesReached && isPlanApplicable) {
          if (coupon.discount_type === "percentage") {
            let discount = (baseAmount * coupon.discount_value) / 100;
            if (coupon.max_discount_amount) {
              discount = Math.min(discount, coupon.max_discount_amount);
            }
            discountApplied = discount;
          } else {
            discountApplied = Math.min(coupon.discount_value, baseAmount);
          }

          baseAmount = Math.max(0, baseAmount - discountApplied);
          appliedCouponCode = coupon.code;
          logStep("Coupon applied", {
            code: couponCode,
            discount: discountApplied,
            newBaseAmount: baseAmount,
          });
        } else {
          logStep("Coupon invalid condition", { isExpired, isMaxUsesReached, isPlanApplicable });
        }
      } else {
        logStep("Coupon not found", { code: couponCode });
      }
    }

    const stripeFee = includeStripeFee ? calculateStripeFee(baseAmount) : 0;
    const finalAmount = baseAmount + stripeFee;

    logStep("Amounts calculated", {
      baseAmount: baseAmount.toFixed(2),
      stripeFee: stripeFee.toFixed(2),
      finalAmount: finalAmount.toFixed(2),
      discount: discountApplied.toFixed(2),
    });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      maxNetworkRetries: 2,
    });

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

    // Create price
    const amountInCents = Math.round(finalAmount * 100);
    const priceConfig: any = {
      unit_amount: amountInCents,
      currency: "brl",
      product_data: {
        name:
          plan.name +
          (includeStripeFee ? " (com taxa)" : "") +
          (appliedCouponCode ? ` - Desconto ${appliedCouponCode}` : ""),
      },
    };

    if (isRecurring) {
      let interval = "month";
      let interval_count = 1;
      if (planId === "trimestral") interval_count = 3;
      if (planId === "semestral") interval_count = 6;
      if (planId === "anual") interval = "year";

      priceConfig.recurring = { interval, interval_count };
    }

    const price = await stripe.prices.create(priceConfig);

    logStep("Price created", { priceId: price.id });

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

    const defaultCancelUrl = `${origin}/escolher-pagamento?planId=${planId}&amount=${baseAmount}&description=${encodeURIComponent(plan.name)}`;
    const finalCancelUrl = sanitizeRedirect(cancelUrl, defaultCancelUrl) ?? defaultCancelUrl;

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [{ price: price.id, quantity: 1 }],
      payment_method_types: ["card"],
      mode: isRecurring ? "subscription" : "payment",
      success_url: `${origin}/sucesso?plan=${planId}`,
      cancel_url: finalCancelUrl,
      metadata: {
        plan_id: planId,
        plan_name: plan.name,
        user_id: userId,
        base_amount: baseAmount.toString(),
        stripe_fee: stripeFee.toFixed(2),
        final_amount: finalAmount.toFixed(2),
        is_subscription: "true",
        coupon_code: appliedCouponCode || "",
        discount_amount: discountApplied.toString(),
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(
      JSON.stringify({
        url: session.url,
        sessionId: session.id,
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
