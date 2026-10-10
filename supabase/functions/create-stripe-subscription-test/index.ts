import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== TEST FUNCTION STARTED ===");

    // Check auth header
    const authHeader = req.headers.get("Authorization");
    console.log("Auth header present:", !!authHeader);
    console.log("Auth header value:", authHeader?.substring(0, 20) + "...");

    // Check body
    const body = await req.json();
    console.log("Request body:", JSON.stringify(body));

    // Check env vars
    const hasStripeKey = !!Deno.env.get("STRIPE_SECRET_KEY");
    const hasSupabaseUrl = !!Deno.env.get("SUPABASE_URL");
    const hasSupabaseKey = !!Deno.env.get("SUPABASE_ANON_KEY");

    console.log("Environment check:", {
      hasStripeKey,
      hasSupabaseUrl,
      hasSupabaseKey,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Test function OK",
        authPresent: !!authHeader,
        bodyReceived: body,
        envVars: {
          hasStripeKey,
          hasSupabaseUrl,
          hasSupabaseKey,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("ERROR:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
