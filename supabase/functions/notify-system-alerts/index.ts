import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, message, category, details } = await req.json();

    const ZAPI_URL = Deno.env.get("ZAPI_URL");
    const ZAPI_CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN");
    const ZAPI_ADMIN_TOKEN = Deno.env.get("ZAPI_ADMIN_TOKEN");

    // Número do Admin(s) para receber alerta "Sirene" (O usuário pode ajustar depois, pegando do ENV)
    const ADMIN_PHONE = Deno.env.get("ADMIN_ALERT_PHONE") || "5519999999999"; // Coloque o numero correto no Supabase Vault

    if (!ZAPI_URL || !ZAPI_CLIENT_TOKEN) {
      throw new Error("Z-API Credentials missing");
    }

    const alertMessage = `🚨 *BCC ALERTA DO SISTEMA* 🚨\n\n*Ação:* ${action}\n*Categoria:* ${category}\n*Falha:* ${message}\n\nEntre no painel administrativo para verificar os Logs ou fale com o suporte técnico.`;

    const waResponse = await fetch(`${ZAPI_URL}/token/${ZAPI_CLIENT_TOKEN}/send-text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Token": ZAPI_ADMIN_TOKEN || ZAPI_CLIENT_TOKEN,
      },
      body: JSON.stringify({
        phone: ADMIN_PHONE,
        message: alertMessage,
      }),
    });

    const result = await waResponse.json().catch(() => ({}));

    return new Response(JSON.stringify({ success: true, delivered: waResponse.ok, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in notify-system-alerts:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
