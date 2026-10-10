// Edge Function para configurar Cron Jobs de forma segura
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Configurando Cron Jobs...");

    const { error } = await supabaseClient.rpc("setup_cron_jobs", {
      service_key: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    });

    if (error) {
      console.error("Erro RPC:", error);
      throw error;
    }

    console.log("Cron Jobs configurados com sucesso!");

    return new Response(JSON.stringify({ success: true, message: "Cron Jobs configurados!" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
