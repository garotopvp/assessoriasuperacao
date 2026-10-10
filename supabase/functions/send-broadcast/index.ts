import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const zapiToken = Deno.env.get("ZAPI_TOKEN")!;
const zapiInstance = Deno.env.get("ZAPI_INSTANCE")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function sendZapiMessage(phone: string, message: string) {
  const url = `https://api.z-api.io/instances/${zapiInstance}/token/${zapiToken}/send-text`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, message }),
  });

  return response.ok;
}

serve(async (req) => {
  try {
    const { campaign_id, message, phones } = await req.json();

    if (!campaign_id || !message || !phones || phones.length === 0) {
      return new Response(JSON.stringify({ error: "Missing parameters" }), { status: 400 });
    }

    let sentCount = 0;
    let deliveredCount = 0;

    // Enviar mensagens com delay para evitar bloqueio
    for (const phone of phones) {
      try {
        const success = await sendZapiMessage(phone, message);

        if (success) {
          sentCount++;
          deliveredCount++;

          // Atualizar status do destinatário
          await supabase
            .from("broadcast_recipients")
            .update({
              status: "SENT",
              sent_at: new Date().toISOString(),
            })
            .eq("campaign_id", campaign_id)
            .eq("student_phone", phone);
        } else {
          // Marcar como falha
          await supabase
            .from("broadcast_recipients")
            .update({
              status: "FAILED",
              error_message: "Failed to send",
            })
            .eq("campaign_id", campaign_id)
            .eq("student_phone", phone);
        }

        // Delay de 2 segundos entre mensagens
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error sending to ${phone}:`, error);

        await supabase
          .from("broadcast_recipients")
          .update({
            status: "FAILED",
            error_message: error.message,
          })
          .eq("campaign_id", campaign_id)
          .eq("student_phone", phone);
      }
    }

    // Atualizar campanha
    await supabase
      .from("broadcast_campaigns")
      .update({
        status: "COMPLETED",
        sent_count: sentCount,
        delivered_count: deliveredCount,
        completed_at: new Date().toISOString(),
      })
      .eq("id", campaign_id);

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        delivered: deliveredCount,
        total: phones.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
