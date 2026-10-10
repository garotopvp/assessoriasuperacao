const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_DETAILS: Record<string, { name: string; price: number; frequency: string }> = {
  anual: {
    name: "Plano Anual - Bora Correr",
    price: 131964, // R$ 1319.64
    frequency: "ONE_TIME",
  },
  semestral: {
    name: "Plano Semestral - Bora Correr",
    price: 77982, // R$ 779.82
    frequency: "ONE_TIME",
  },
  trimestral: {
    name: "Plano Trimestral - Bora Correr",
    price: 41991, // R$ 419.91
    frequency: "ONE_TIME",
  },
  mensal: {
    name: "Plano Mensal - Bora Correr",
    price: 14997, // R$ 149.97
    frequency: "MONTHLY",
  },
};

// Use Deno.serve which is built-in
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check for browser debugging
  if (req.method === "GET") {
    return new Response(JSON.stringify({ status: "ok", message: "Function is accessible" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    console.log("Function 'create-abacate-checkout' invoked via POST");

    const ABACATE_PAY_API_KEY = Deno.env.get("ABACATE_PAY_API_KEY");
    if (!ABACATE_PAY_API_KEY) {
      console.error("Missing ABACATE_PAY_API_KEY");
      throw new Error("Server configuration error: Missing API Key");
    }

    const { planId, customerEmail, customerName, customerPhone, customerTaxId, userId } =
      await req.json();
    console.log("Request payload:", { planId, customerEmail, userId });

    const plan = PLAN_DETAILS[planId];
    if (!plan) {
      console.error("Invalid planId:", planId);
      throw new Error(`Plano inválido: ${planId}`);
    }

    const origin =
      req.headers.get("origin") ||
      req.headers.get("referer")?.replace(/\/$/, "") ||
      "https://boracorrerclub.com.br";
    const ABACATE_PAY_URL = "https://api.abacatepay.com/v1";

    const customer = {
      email: customerEmail || "cliente@loja.com",
      name: customerName || (customerEmail ? customerEmail.split("@")[0] : "Cliente"),
      cellphone: customerPhone || "11999999999",
      taxId: customerTaxId || "12345678909",
    };

    const billingBody = {
      frequency: plan.frequency,
      methods: ["PIX", "CREDIT_CARD"],
      products: [
        {
          externalId: planId,
          name: plan.name,
          quantity: 1,
          price: plan.price,
        },
      ],
      returnUrl: `${origin}/sucesso?gateway=abacate&plan=${planId}`,
      completionUrl: `${origin}/sucesso?gateway=abacate&plan=${planId}`,
      customer,
      metadata: {
        user_id: userId || null,
        plan_id: planId,
      },
    };

    console.log("Sending to Abacate Pay:", JSON.stringify(billingBody));

    const response = await fetch(`${ABACATE_PAY_URL}/billing/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ABACATE_PAY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(billingBody),
    });

    const result = await response.json();
    console.log("Abacate Pay Response:", result);

    if (!response.ok) {
      console.error("Abacate Pay Error Response:", result);
      // Return 200 even on error so client can see the message
      return new Response(
        JSON.stringify({ error: result.error || result.message || "Erro no gateway Abacate Pay" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        url: result.data?.url || result.url,
        id: result.data?.id || result.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Function error:", error);
    // Return 200 with error details
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
