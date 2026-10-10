import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapeamento de planos para OpenPix
const PLAN_DETAILS: Record<string, { name: string; price: number }> = {
  anual: {
    name: "Plano Anual - Bora Correr",
    price: 131964, // R$ 1319.64 em centavos
  },
  semestral: {
    name: "Plano Semestral - Bora Correr",
    price: 77982, // R$ 779.82 em centavos
  },
  trimestral: {
    name: "Plano Trimestral - Bora Correr",
    price: 41991, // R$ 419.91 em centavos
  },
  mensal: {
    name: "Plano Mensal - Bora Correr",
    price: 14997, // R$ 149.97 em centavos
  },
  plano_teste: {
    name: "Plano Teste - Bora Correr",
    price: 997, // R$ 9.97
  },
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENPIX_APP_ID = Deno.env.get("OPENPIX_APP_ID");
    if (!OPENPIX_APP_ID) {
      throw new Error("OPENPIX_APP_ID not configured");
    }

    const { planId, customer, userId } = await req.json();

    if (!planId || !PLAN_DETAILS[planId]) {
      throw new Error("Plano inválido ou não encontrado");
    }

    const plan = PLAN_DETAILS[planId];

    // Use a structured correlationID to recover info in the webhook
    // Format: user_{userId}_plan_{planId}_{timestamp}
    const correlationID = `user_${userId}_plan_${planId}_${Date.now()}`;

    console.log(`Creating OpenPix charge for user ${userId}, plan ${planId}`);

    // Create Charge at OpenPix
    const response = await fetch("https://api.openpix.com.br/api/v1/charge", {
      method: "POST",
      headers: {
        Authorization: OPENPIX_APP_ID,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        correlationID,
        value: plan.price,
        comment: plan.name,
        customer: {
          name: customer.name,
          taxID: customer.taxID, // CPF/CNPJ
          email: customer.email,
          phone: customer.phone,
        },
        // Add metadata for later use in webhooks
        additionalInfo: [
          { key: "userId", value: userId },
          { key: "planId", value: planId },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenPix error:", data);
      throw new Error(data.error || "Erro ao gerar PIX");
    }

    return new Response(
      JSON.stringify({
        url: data.charge.paymentLinkUrl,
        qrCodeImage: data.charge.qrCodeImage,
        brCode: data.charge.brCode,
        correlationID: correlationID,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
