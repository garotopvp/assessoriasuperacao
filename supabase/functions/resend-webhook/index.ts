import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const log = async (message: string, details?: any) => {
  console.log(`[RESEND-WEBHOOK] ${message}`, details ? JSON.stringify(details) : "");
  try {
    await supabaseAdmin.from("debug_logs").insert({
      function_name: "resend-webhook",
      log_message: message,
      details: details,
      level: "info",
    });
  } catch (err) {
    console.error("Error logging to DB:", err);
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    await log("Received webhook payload", payload);

    // O payload do Resend pode ser um array de eventos ou um único evento
    const events = Array.isArray(payload) ? payload : [payload];

    for (const event of events) {
      if (!event.type) continue;

      const { type, data } = event;
      const { email_id, to } = data || {};

      await log(`Processing event: ${type}`, { email_id, to });

      // Aqui podemos atualizar uma tabela de emails (se existir) ou apenas logar
      // Por enquanto, vamos registrar na tabela de logs que o cliente interagiu
      await log(`Email event tracked: ${type}`, {
        email: to,
        event_type: type,
        timestamp: new Date().toISOString(),
      });

      // Se quiser salvar em uma tabela específica de rastreamento no futuro:
      /*
      if (email_id) {
         await supabaseAdmin.from('email_tracking').upsert({
             email_id,
             recipient: to,
             status: type, // 'delivered', 'opened', 'clicked'
             updated_at: new Date().toISOString()
         })
      }
      */
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    await log("Error processing webhook", { error: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
