import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { correlationID } = await req.json();

    if (!correlationID) {
      return new Response(JSON.stringify({ error: "correlationID é obrigatório" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Buscar o charge na OpenPix usando correlation ID
    const OPENPIX_APP_ID = Deno.env.get("OPENPIX_APP_ID");

    if (!OPENPIX_APP_ID) {
      return new Response(JSON.stringify({ error: "OPENPIX_APP_ID não configurado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Buscar charge por correlationID
    const response = await fetch(
      `https://api.openpix.com.br/api/v1/charge?correlationID=${correlationID}`,
      {
        headers: {
          Authorization: OPENPIX_APP_ID,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: "Erro ao buscar charge na OpenPix",
          status: response.status,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: response.status,
        }
      );
    }

    const data = await response.json();
    const charge = data.charge;

    if (!charge) {
      return new Response(JSON.stringify({ error: "Charge não encontrado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Se o charge está pago, atualizar o pedido no banco
    if (charge.status === "COMPLETED" || charge.status === "PAID") {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

      const { data: order, error: updateError } = await supabaseAdmin
        .from("orders")
        .update({
          status: "paid",
          updated_at: new Date().toISOString(),
        })
        .eq("correlation_id", correlationID)
        .select()
        .single();

      if (updateError) {
        console.error("Erro ao atualizar pedido:", updateError);
        return new Response(
          JSON.stringify({
            error: "Erro ao atualizar pedido",
            details: updateError,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Pedido atualizado para 'paid'",
          order,
          charge: {
            status: charge.status,
            value: charge.value,
            correlationID: charge.correlationID,
          },
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Se ainda está pendente, retornar status atual
    return new Response(
      JSON.stringify({
        success: false,
        message: "Pagamento ainda pendente",
        charge: {
          status: charge.status,
          value: charge.value,
          correlationID: charge.correlationID,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
