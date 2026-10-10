import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Gerando faturas mensais...");

    // Buscar assinaturas ativas que precisam de nova fatura
    const today = new Date();
    const { data: subscriptions, error: subError } = await supabaseClient
      .from("recurring_subscriptions")
      .select("*")
      .eq("status", "active")
      .lte("next_billing_date", today.toISOString());

    if (subError) throw subError;

    console.log(`Encontradas ${subscriptions?.length || 0} assinaturas para faturar`);

    const results = [];

    for (const subscription of subscriptions || []) {
      try {
        // Verificar se já existe fatura pendente
        const { data: existingInvoice } = await supabaseClient
          .from("subscription_invoices")
          .select("id")
          .eq("subscription_id", subscription.id)
          .eq("status", "pending")
          .single();

        if (existingInvoice) {
          console.log(`Assinatura ${subscription.id} já tem fatura pendente`);
          continue;
        }

        // Criar nova fatura
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 5); // Vencimento em 5 dias

        const { data: invoice, error: invoiceError } = await supabaseClient
          .from("subscription_invoices")
          .insert({
            subscription_id: subscription.id,
            amount: subscription.amount,
            due_date: dueDate.toISOString(),
            status: "pending",
          })
          .select()
          .single();

        if (invoiceError) throw invoiceError;

        // Gerar link de pagamento via Abacate Pay
        const abacateResponse = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/create-pix-abacate`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              items: [
                {
                  name: subscription.plan_name || "Mensalidade",
                  price: subscription.amount,
                  quantity: 1,
                },
              ],
              customerEmail: subscription.student_email,
              customerName: subscription.student_name,
              customerPhone: subscription.student_phone,
              userId: subscription.user_id,
              invoiceId: invoice.id,
            }),
          }
        );

        const abacateData = await abacateResponse.json();

        if (!abacateResponse.ok) {
          throw new Error(abacateData.error || "Erro ao gerar link");
        }

        // Atualizar fatura com link
        await supabaseClient
          .from("subscription_invoices")
          .update({
            payment_link: abacateData.url,
            abacate_payment_id: abacateData.paymentId,
            sent_at: new Date().toISOString(),
          })
          .eq("id", invoice.id);

        // Atualizar próxima data de cobrança
        const nextBilling = new Date();
        nextBilling.setDate(nextBilling.getDate() + 30);

        await supabaseClient
          .from("recurring_subscriptions")
          .update({
            next_billing_date: nextBilling.toISOString(),
          })
          .eq("id", subscription.id);

        // TODO: Enviar email com fatura

        results.push({
          subscriptionId: subscription.id,
          invoiceId: invoice.id,
          success: true,
        });

        console.log(`Fatura criada para assinatura ${subscription.id}`);
      } catch (error) {
        console.error(`Erro ao processar assinatura ${subscription.id}:`, error);
        results.push({
          subscriptionId: subscription.id,
          success: false,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating invoices:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
