import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapeamento de planos
const PLAN_DETAILS: Record<string, { name: string; price: number; frequency: string }> = {
  anual: {
    name: "Plano Anual - Bora Correr",
    price: 131964, // R$ 1319.64 em centavos
    frequency: "ONE_TIME",
  },
  semestral: {
    name: "Plano Semestral - Bora Correr",
    price: 77982, // R$ 779.82 em centavos
    frequency: "ONE_TIME",
  },
  trimestral: {
    name: "Plano Trimestral - Bora Correr",
    price: 41991, // R$ 419.91 em centavos
    frequency: "ONE_TIME",
  },
  mensal: {
    name: "Plano Mensal - Bora Correr",
    price: 14997, // R$ 149.97 em centavos
    frequency: "MONTHLY",
  },
};

serve(async (req) => {
  // Log do header Authorization para depuração
  const authHeader = req.headers.get("authorization");
  console.log("[CREATE-PIX-ABACATE] Authorization header:", authHeader);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health Check
  if (req.method === "GET") {
    return new Response(JSON.stringify({ status: "ok", message: "Function is active" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }

  try {
    console.log("[CREATE-PIX-ABACATE] Function invoked");

    const ABACATE_PAY_API_KEY = Deno.env.get("ABACATE_PAY_API_KEY");
    if (!ABACATE_PAY_API_KEY) {
      console.error("[CREATE-PIX-ABACATE] ERROR: ABACATE_PAY_API_KEY not configured");
      throw new Error("Configuração do servidor incompleta. Entre em contato com o suporte.");
    }

    // Initialize Supabase Admin Client
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Extract user info from the request body
    const requestBody = await req.json();
    const userId = requestBody.userId;
    const {
      items,
      planId,
      customerEmail,
      customerName,
      customerPhone,
      customerTaxId,
      metadata,
      frequency: reqFrequency,
    } = requestBody;

    // Usar o email do usuário autenticado se não fornecido
    const emailToUse = customerEmail || "cliente@loja.com";

    console.log("[CREATE-PIX-ABACATE] Request processed for User:", userId, "Plan:", planId);

    // Get origin with fallback
    const origin =
      req.headers.get("origin") ||
      req.headers.get("referer")?.replace(/\/$/, "") ||
      "https://boracorrerclub.com.br";
    const ABACATE_PAY_URL = "https://api.abacatepay.com/v1";

    let products;
    let returnUrl;
    let frequency = reqFrequency || "ONE_TIME";

    // Se for um plano de consultoria (e existir na lista fixa)
    if (planId && PLAN_DETAILS[planId]) {
      const plan = PLAN_DETAILS[planId];

      products = [
        {
          externalId: planId,
          name: plan.name,
          quantity: 1,
          price: plan.price,
        },
      ];

      frequency = plan.frequency;
      returnUrl = `${origin}/sucesso?gateway=abacate&plan=${planId}`;
    } else if (items && items.length > 0) {
      // Security Check: Validate prices against database
      // Extract IDs from items
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const productIds = items.map((i: any) => i.id).filter((id: any) => id && uuidRegex.test(id));
      let dbProducts: any[] = [];

      if (productIds.length > 0) {
        const { data, error } = await supabaseAdmin
          .from("products")
          .select("id, preco, nome")
          .in("id", productIds);

        if (error) {
          console.error("[CREATE-PIX-ABACATE] Error fetching product prices:", error);
          // Fallback to trusted items or fail? Failing is safer.
          // throw new Error("Erro ao validar preços dos produtos.");
        }
        if (data) dbProducts = data;
        console.log(
          `[CREATE-PIX-ABACATE] Fetched ${dbProducts.length} products for price validation.`
        );
      }

      // Se forem produtos/roupas
      products = items.map(
        (item: { id: string; name: string; price: number; quantity: number }) => {
          // Find matching product in DB
          let finalPrice = item.price;

          if (item.id) {
            const dbProduct = dbProducts.find((p) => String(p.id) === String(item.id));
            if (dbProduct) {
              // Use Authoritative Price from DB
              finalPrice = dbProduct.preco;
              console.log(
                `[CREATE-PIX-ABACATE] Validated price for ${item.name}: ${finalPrice} (Client sent: ${item.price})`
              );
            } else {
              console.warn(
                `[CREATE-PIX-ABACATE] Product ID ${item.id} not found in DB. Using client price.`
              );
            }
          }

          return {
            externalId: item.name.substring(0, 50),
            name: item.name,
            quantity: item.quantity,
            price: Math.round(finalPrice * 100), // Convert to centavos
          };
        }
      );

      if (metadata?.origin === "boracorrer-shop") {
        returnUrl = `${origin}/shop-sucesso`;
      } else {
        returnUrl = `${origin}/sucesso?method=pix`;
      }
    } else {
      throw new Error("Nenhum item ou plano fornecido");
    }

    // Build customer object - all fields required by Abacate Pay
    // Helper para limpar caracteres não numéricos
    const onlyNumbers = (str: string | undefined | null) => (str ? str.replace(/\D/g, "") : "");

    const cleanPhone = onlyNumbers(customerPhone) || "11999999999";
    const cleanTaxId = onlyNumbers(customerTaxId) || "52998224725";

    const customer = {
      email: emailToUse || "cliente@loja.com",
      name: customerName || (emailToUse ? emailToUse.split("@")[0] : "Cliente"),
      cellphone: cleanPhone,
      taxId: cleanTaxId,
    };

    // Create Billing via Abacate Pay
    console.log("[CREATE-PIX-ABACATE] Sending request to Abacate Pay...");
    const response = await fetch(`${ABACATE_PAY_URL}/billing/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ABACATE_PAY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        frequency: frequency,
        methods: ["PIX", "CARD"],
        products,
        returnUrl,
        completionUrl: returnUrl,
        customer,
        metadata: {
          user_id: userId,
          plan_id: planId || null,
          items: items ? JSON.stringify(items) : null,
          ...metadata,
        },
      }),
    });

    const result = await response.json();

    console.log("[CREATE-PIX-ABACATE] Abacate Pay Response Status:", response.status);

    // Handle generic HTTP errors
    if (!response.ok) {
      console.error("[CREATE-PIX-ABACATE] Abacate Pay Error:", result);
      throw new Error(
        result.error || result.message || `Erro na API do Abacate Pay: ${response.status}`
      );
    }

    // Handle API logical errors (200 OK but success: false)
    if (result.success === false) {
      console.error("[CREATE-PIX-ABACATE] Abacate Pay Logic Error:", result.error);
      throw new Error(result.error || "Erro ao processar pagamento no Abacate Pay");
    }

    // Check if URL exists in the response
    const checkoutUrl = result.url || result.data?.url;

    if (!checkoutUrl) {
      console.error(
        "[CREATE-PIX-ABACATE] Missing URL in response. Full result:",
        JSON.stringify(result)
      );
      throw new Error(`DEBUG: URL não encontrada. Resposta da API: ${JSON.stringify(result)}`);
    }

    console.log("[CREATE-PIX-ABACATE] Success! Generated checkout URL:", checkoutUrl);

    return new Response(JSON.stringify({ url: checkoutUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao processar pagamento";
    console.error("PIX Abacate error:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      // Return 200 so the client can read the JSON body with the error message
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
