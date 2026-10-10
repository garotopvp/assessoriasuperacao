import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-OPENPIX-ORDER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // ✅ VERIFICAR AUTENTICAÇÃO
    const authHeader = req.headers.get("Authorization");
    logStep("Auth header check", { hasAuth: !!authHeader });

    // Não bloquear se não tiver auth header, mas logar
    if (!authHeader) {
      logStep("WARNING: No Authorization header, but continuing");
    }

    const openPixAppId = Deno.env.get("OPENPIX_APP_ID");
    if (!openPixAppId) {
      logStep("ERROR: OPENPIX_APP_ID not set");
      throw new Error("OPENPIX_APP_ID is not set");
    }

    // Criar cliente Supabase com SERVICE ROLE logo no início
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    logStep("Supabase client created");

    const { items, userId, customer } = await req.json();
    logStep("Request body parsed", {
      itemsCount: items?.length,
      userId,
      customerEmail: customer?.email,
    });

    if (!items || items.length === 0) {
      throw new Error("Items are required");
    }

    // Encontrar o preço do produto no banco de dados para evitar adulteração de preço no lado do cliente
    const { data: productData, error: productError } = await supabaseClient
      .from("products")
      .select("id, preco")
      .in(
        "id",
        items.map((item) => item.id)
      );

    if (productError) throw new Error(`Erro ao buscar produtos: ${productError.message}`);

    // Calcular o valor total com base nos preços do banco de dados
    const totalValue = items.reduce((acc, item) => {
      const product = productData.find((p) => p.id === item.id);
      const price = product?.preco ?? 0;
      // Adicionando verificação para garantir que o preço seja tratado como um valor em "reais" e convertido para centavos.
      // Se o preço for um número pequeno (como 1.50), assume-se que está em reais.
      // Se for um número grande (como 150), assume-se que já está em centavos.
      // Esta lógica previne erros se o preço no banco de dados estiver como 1.50 em vez de 150.
      const priceInCents = price < 1000 ? price * 100 : price; // Heurística simples: preços acima de 1000 já estão provavelmente em centavos.
      return acc + priceInCents * item.quantity;
    }, 0);

    // O valor para a OpenPix deve ser em centavos, então dividimos por 100 para obter o valor em reais para salvar no nosso BD
    const totalValueInReais = totalValue / 100;

    if (totalValue <= 0) {
      return new Response(JSON.stringify({ error: "O valor do pedido deve ser maior que zero." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Total calculated", { totalValue });

    // Criar correlationID único
    const correlationID = `order_${userId}_${Date.now()}`;

    // Montar descrição dos itens
    const itemsDescription = items.map((item: any) => `${item.quantity}x ${item.name}`).join(", ");

    logStep("Creating OpenPix charge", { correlationID, value: totalValue });

    // Criar cobrança no OpenPix
    const openPixResponse = await fetch("https://api.openpix.com.br/api/v1/charge", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: openPixAppId,
      },
      body: JSON.stringify({
        correlationID,
        value: Math.round(totalValue), // totalValue já está em centavos
        comment: `Pedido Bora Correr Shop - ${itemsDescription}`,
        customer: {
          name: customer?.name || "Cliente",
          email: customer?.email || "",
          phone: customer?.phone || "",
          taxID: customer?.taxID || "",
        },
        additionalInfo: [
          { key: "userId", value: userId || "" },
          { key: "type", value: "shop_order" },
          { key: "itemsCount", value: items.length.toString() },
        ],
      }),
    });

    const openPixData = await openPixResponse.json();

    if (!openPixResponse.ok) {
      logStep("OpenPix API error", { status: openPixResponse.status, data: openPixData });
      throw new Error(openPixData.error || "Erro ao criar cobrança OpenPix");
    }

    logStep("OpenPix charge created", {
      correlationID,
      chargeId: openPixData.charge?.id,
    });

    logStep("Creating order in database");

    const { data: orderData, error: orderError } = await supabaseClient
      .from("orders")
      .insert([
        {
          user_id: userId,
          customer_email: customer?.email || "",
          customer_name: customer?.name || "Cliente",
          total: totalValueInReais,
          total_amount: totalValueInReais,
          status: "pending",
          payment_method: "pix",
          payment_provider: "openpix",
          correlation_id: correlationID,
          openpix_correlation_id: correlationID,
          items: items, // JSONB field for backup
        },
      ])
      .select();

    if (orderError) {
      console.error("Erro ao inserir o pedido:", orderError);
      return new Response(
        JSON.stringify({ error: `Erro ao criar o pedido: ${orderError.message}` }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    logStep("Order created in database", { orderId: orderData[0].id });

    return new Response(
      JSON.stringify({
        correlationID,
        brCode: openPixData.charge?.brCode,
        qrCodeImage: openPixData.charge?.qrCodeImage,
        orderId: orderData[0].id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
