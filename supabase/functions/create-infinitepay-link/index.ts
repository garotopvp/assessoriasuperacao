import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Receiving InfinitePay proxy request:", JSON.stringify(body));

    const apiKey = Deno.env.get("INFINITEPAY_API_KEY");

    if (!apiKey) {
      console.error("Missing INFINITEPAY_API_KEY");
      return new Response(
        JSON.stringify({ error: "Configuração de API Key ausente no servidor" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const webhookUrl = `${supabaseUrl}/functions/v1/infinitepay-webhook`;

    // Add webhook_url to the payload
    const payload = {
      ...body,
      webhook_url: webhookUrl,
      metadata: {
        ...body.metadata,
        origin: "boracorrerclub-shop",
      },
    };

    console.log("Forwarding to InfinitePay with Webhook:", webhookUrl);

    const response = await fetch("https://api.infinitepay.io/invoices/public/checkout/links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    console.log("InfinitePay API Response status:", response.status);

    if (!response.ok) {
      console.error("InfinitePay API Error:", data);
      return new Response(JSON.stringify({ error: "Erro na API da InfinitePay", details: data }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Internal Server Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
