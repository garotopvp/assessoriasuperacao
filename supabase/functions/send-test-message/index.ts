import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { phone, message } = await req.json();

    const ZAPI_URL = Deno.env.get("ZAPI_URL");
    let ZAPI_CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN");
    const adminToken = Deno.env.get("ZAPI_ADMIN_TOKEN");

    if (!ZAPI_URL) {
      throw new Error("ZAPI_URL_MISSING");
    }

    // fallback on token and instance from older formats just in case
    const zapiToken = Deno.env.get("ZAPI_TOKEN");
    const zapiInstance = Deno.env.get("ZAPI_INSTANCE");
    const zapiInstanceId = Deno.env.get("ZAPI_INSTANCE_ID");

    let finalUrl = ZAPI_URL;
    if (!finalUrl.includes("/send-text")) {
      // It might be just the base URL
      if (!finalUrl.endsWith("/")) finalUrl += "/";
      if (!finalUrl.includes("/token/")) {
        finalUrl += `token/${ZAPI_CLIENT_TOKEN || zapiToken}/`;
      }
      finalUrl += "send-text";
    }

    // Se ZAPI_URL já contiver /token/, precisamos ter certeza que aponta para /send-text
    if (finalUrl.includes("/token/") && !finalUrl.includes("/send-text")) {
      finalUrl += "/send-text";
    }

    // Make request
    const response = await fetch(finalUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Token": adminToken || ZAPI_CLIENT_TOKEN || "",
      },
      body: JSON.stringify({ phone, message }),
    });

    const body = await response.text();
    return new Response(
      JSON.stringify({
        status: response.status,
        url: finalUrl,
        clientToken: adminToken || ZAPI_CLIENT_TOKEN,
        zapiBody: body,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
