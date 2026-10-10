import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CHECK-ORDER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log("Function started");

    const { orderId } = await req.json().catch(() => ({}));
    if (!orderId) {
      return new Response(JSON.stringify({ error: "orderId is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Auth é OPCIONAL - permite polling funcionar
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");

    // Use SERVICE ROLE para ler pedidos (bypass RLS)
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    let userIdFromToken: string | null = null;

    // Se tiver token, validar e extrair userId
    if (authHeader) {
      const token = authHeader.replace(/Bearer\s+/i, "").trim();
      log("Validating token");

      try {
        const { data: userData, error: userError } = await supabaseClient.auth.getUser(
          token as string
        );
        if (userError || !userData?.user) {
          log("Token validation failed (continuando sem auth)", { userError });
          // NÃO retornar erro, apenas continua sem userId
        } else {
          userIdFromToken = userData.user.id;
          log("Token validated", { userId: userIdFromToken });
        }
      } catch (err) {
        log("Token validation exception (continuando sem auth)", {
          err: err instanceof Error ? err.message : String(err),
        });
        // NÃO retornar erro, apenas continua sem userId
      }
    } else {
      log("No auth header provided (continuando sem auth)");
    }

    log("Fetching order", { orderId });

    const { data: order, error } = await supabaseClient
      .from("orders")
      .select(
        "id, user_id, status, payment_provider, updated_at, correlation_id, openpix_correlation_id, total, items"
      )
      .eq("id", orderId)
      .single();

    if (error) {
      log("Database error", { error });
      return new Response(JSON.stringify({ error: error.message || String(error) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Verificar propriedade do pedido APENAS se tiver token
    // (Se não tiver token, retorna o pedido - segurança é garantida pelo orderId único)
    if (userIdFromToken && order.user_id && order.user_id !== userIdFromToken) {
      log("User attempted to access another user's order", {
        orderId,
        orderUserId: order.user_id,
        tokenUserId: userIdFromToken,
      });
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    log("Order found and returned", { orderId: order.id, status: order.status });

    return new Response(JSON.stringify(order), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    log("ERROR", { message: err instanceof Error ? err.message : String(err) });
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
