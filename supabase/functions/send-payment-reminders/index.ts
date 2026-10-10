import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper para verificar se hoje é o N-ésimo dia útil do mês
function isNthBusinessDay(date: Date, nth: number): boolean {
  const dayOfWeekToday = date.getDay();
  if (dayOfWeekToday === 0 || dayOfWeekToday === 6) return false; // Fim de semana nunca é dia de envio

  const year = date.getFullYear();
  const month = date.getMonth();
  let businessDaysCount = 0;

  for (let d = 1; d <= date.getDate(); d++) {
    const current = new Date(year, month, d);
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Segunda (1) a Sexta (5)
      businessDaysCount++;
    }
  }

  return businessDaysCount === nth;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const ZAPI_URL = Deno.env.get("ZAPI_URL");
    const ZAPI_CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN");
    const adminToken = Deno.env.get("ZAPI_ADMIN_TOKEN");

    // Verificar se a cobrança automática está ativa nas configurações
    const { data: billingSettings, error: settingsError } = await supabaseClient
      .from("support_settings")
      .select("value")
      .eq("key", "billing_config")
      .single();

    const isAutoBillingEnabled = billingSettings?.value?.auto_billing_enabled !== false; // Default true

    if (!isAutoBillingEnabled) {
      console.log("Cobrança automática desativada (via configurações).");
      return new Response(
        JSON.stringify({ message: "Pular: Cobrança automática desativada pelo administrador." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const today = new Date();

    // Regra: Enviar no 5º e no 10º dia útil
    const is5th = isNthBusinessDay(today, 5);
    const is10th = isNthBusinessDay(today, 10);

    if (!is5th && !is10th) {
      console.log("Hoje não é dia de envio (apenas 5º e 10º dia útil).");
      return new Response(
        JSON.stringify({ message: "Pular: Hoje não é o 5º nem o 10º dia útil do mês." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Iniciando disparos do ${is5th ? "5º" : "10º"} dia útil...`);

    // Buscar faturas pendentes ou vencidas (apenas para assinaturas com cobrança auto ativa)
    const { data: invoices, error: invoiceError } = await supabaseClient
      .from("subscription_invoices")
      .select(
        `
                *,
                recurring_subscriptions!inner (*)
            `
      )
      .in("status", ["pending", "overdue"])
      .eq("recurring_subscriptions.auto_billing_enabled", true);

    if (invoiceError) throw invoiceError;

    console.log(`Encontradas ${invoices?.length || 0} faturas para cobrar.`);

    const results = [];

    for (const invoice of invoices || []) {
      try {
        const subscription = invoice.recurring_subscriptions;
        if (!subscription || !subscription.student_phone) continue;

        const phone = subscription.student_phone.replace(/\D/g, "");
        const formattedPhone = phone.length <= 11 ? `55${phone}` : phone;
        const firstName = subscription.student_name
          ? subscription.student_name.split(" ")[0]
          : "Corredor";

        const message = `Olá ${firstName}, tudo bem? 🏃‍♂️\n\nPassando para te lembrar que a sua mensalidade da assessoria está pendente.\n\nPara facilitar, você pode realizar o pagamento direto pelo link abaixo (PIX ou Cartão):\n\n🔗 ${invoice.payment_link || "https://www.boracorrerclub.com.br/minha-assinatura"}\n\nQualquer dúvida, estamos à disposição! 🚀`;

        let success = false;
        if (ZAPI_URL && (ZAPI_CLIENT_TOKEN || adminToken)) {
          let finalUrl = ZAPI_URL;
          if (!finalUrl.includes("/send-text")) {
            if (!finalUrl.endsWith("/")) finalUrl += "/";
            if (!finalUrl.includes("/token/")) {
              finalUrl += `token/${ZAPI_CLIENT_TOKEN}/`;
            }
            finalUrl += "send-text";
          }

          const response = await fetch(finalUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Client-Token": adminToken || ZAPI_CLIENT_TOKEN || "",
            },
            body: JSON.stringify({ phone: formattedPhone, message }),
          });

          success = response.ok;
        }

        if (success) {
          // Atualizar faturas
          await supabaseClient
            .from("subscription_invoices")
            .update({
              last_reminder_at: new Date().toISOString(),
              reminder_count: (invoice.reminder_count || 0) + 1,
            })
            .eq("id", invoice.id);
        }

        results.push({
          invoiceId: invoice.id,
          student: subscription.student_name,
          success,
        });

        // Pequeno delay para evitar flood
        await new Promise((r) => setTimeout(r, 1000));
      } catch (error) {
        console.error(`Erro na fatura ${invoice.id}:`, error);
        results.push({ invoiceId: invoice.id, success: false, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        dayType: is5th ? "5th_business_day" : "10th_business_day",
        processed: results.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending reminders:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
