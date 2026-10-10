import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função auxiliar para logar no banco de dados
const logDebug = async (client: any, message: string, details?: any) => {
  try {
    console.log(`[DEBUG] ${message}`, details || "");
    await client.from("debug_logs").insert({
      source: "openpix-webhook",
      message,
      details: details ? JSON.stringify(details) : null,
    });
  } catch (err) {
    console.error("Erro ao salvar log de debug:", err);
  }
};

// Helper function to decrement stock
async function decrementStockForItems(
  supabaseClient: any,
  items: Array<{ name: string; size?: string; quantity: number }>
): Promise<void> {
  for (const item of items) {
    if (!item.size && !item.name.toLowerCase().includes("tam.")) {
      console.log(`[STOCK] Skipping stock decrement for ${item.name} - no size detected`);
      continue;
    }

    // Tentar extrair tamanho se não vier explícito
    const size = item.size || item.name.split("Tam. ")[1]?.trim();
    if (!size) {
      console.log(`[STOCK] Skipping - count not parse size from ${item.name}`);
      continue;
    }

    const productName = item.name.split(" - Tam.")[0].trim();

    const { data: products, error: findError } = await supabaseClient
      .from("products")
      .select("id, nome, estoque")
      .ilike("nome", `%${productName}%`)
      .limit(1);

    if (findError || !products || products.length === 0) {
      console.error(`[STOCK] Product not found: ${productName}`);
      continue;
    }

    const product = products[0];
    const estoque = product.estoque as Record<string, number> | null;
    const currentStock = estoque?.[size] ?? 0;
    const newStock = Math.max(0, currentStock - (item.quantity || 1));

    const { error: updateError } = await supabaseClient
      .from("products")
      .update({
        estoque: {
          ...estoque,
          [size]: newStock,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", product.id);

    if (updateError) {
      console.error(`[STOCK] Failed to update: ${product.nome} Size ${size}`, updateError);
    } else {
      console.log(
        `[STOCK] Decremented: ${product.nome} Size ${size} | ${currentStock} -> ${newStock}`
      );
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Criar client Admin para logs e operações
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const text = await req.text();

    // Logar recebimento bruto
    await logDebug(supabaseAdmin, "Webhook recebido (bruto)", { length: text.length });

    // Retornar 200 OK sempre, mesmo se o body estiver vazio
    if (!text) {
      await logDebug(supabaseAdmin, "Body vazio");
      return new Response(JSON.stringify({ status: "ok" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    let body;
    try {
      body = JSON.parse(text);
    } catch (parseError: any) {
      await logDebug(supabaseAdmin, "Erro ao parsear JSON", { error: parseError.message });
      throw parseError;
    }

    await logDebug(supabaseAdmin, "Webhook parseado", {
      event: body.event,
      correlationID: body.charge?.correlationID,
    });

    // Log completo do payload recebido
    await logDebug(supabaseAdmin, "PAYLOAD COMPLETO RECEBIDO", {
      body: JSON.stringify(body),
      event: body.event,
      chargeValue: body.charge?.value,
      chargeStatus: body.charge?.status,
      correlationID: body.charge?.correlationID,
    });

    // Se for ping ou não tiver evento, retornar ok
    if (!body.event || body.event === "PING") {
      return new Response(JSON.stringify({ status: "ok" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const event = body.event;
    const charge = body.charge;

    // Processar apenas eventos de pagamento confirmado
    if (event !== "OPENPIX:CHARGE_COMPLETED" && event !== "CHARGE_COMPLETED") {
      await logDebug(supabaseAdmin, "Evento ignorado", { event });
      return new Response(JSON.stringify({ status: "ignored", event }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Processar pagamento
    const correlationID = charge?.correlationID;
    if (!correlationID) {
      await logDebug(supabaseAdmin, "Sem correlationID");
      return new Response(JSON.stringify({ status: "ok", message: "No correlationID" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // --- LÓGICA DE ROTEAMENTO (Loja vs Assinatura) ---
    const parts = correlationID.split("_");
    const type = parts[0]; // 'order', 'user', 'subscription'

    // Verifica se é um pedido de loja (começa com order OU contém 'cart')
    const isOrder =
      type === "order" || parts[2] === "cart" || parts.some((p: string) => p === "cart");

    if (isOrder) {
      // === FLUXO DE PEDIDO DE LOJA ===
      await logDebug(supabaseAdmin, "Buscando pedido com correlation_id (Loja)", { correlationID });

      // 1. Tentar encontrar o pedido existente pelo correlation_id
      const { data: existingOrder, error: findError } = await supabaseAdmin
        .from("orders")
        .select("id, status, items, customer_email")
        .eq("correlation_id", correlationID)
        .maybeSingle();

      if (findError) {
        await logDebug(supabaseAdmin, "Erro ao buscar pedido por correlation_id", {
          error: findError,
        });
      }

      await logDebug(
        supabaseAdmin,
        existingOrder ? "Pedido encontrado!" : "Pedido não encontrado",
        {
          existingOrder: existingOrder
            ? {
                id: existingOrder.id,
                status: existingOrder.status,
                email: existingOrder.customer_email,
              }
            : null,
        }
      );

      let order;
      let orderError;

      if (existingOrder) {
        // Atualizar pedido existente
        await logDebug(supabaseAdmin, "Atualizando pedido existente", {
          orderId: existingOrder.id,
          oldStatus: existingOrder.status,
        });

        const updateData = {
          status: "paid",
          stripe_session_id: `openpix_${correlationID}`,
          stripe_payment_intent: charge.transactionID,
          total_amount: charge.value / 100,
          total: charge.value / 100,
          updated_at: new Date().toISOString(),
        };

        await logDebug(supabaseAdmin, "Dados que serão atualizados", { updateData });

        const result = await supabaseAdmin
          .from("orders")
          .update(updateData)
          .eq("id", existingOrder.id)
          .select()
          .single();

        order = result.data;
        orderError = result.error;

        if (orderError) {
          await logDebug(supabaseAdmin, "Erro ao atualizar pedido", {
            error: orderError,
            code: orderError.code,
          });
        } else {
          await logDebug(supabaseAdmin, "Pedido atualizado com sucesso!", {
            orderId: order.id,
            newStatus: order.status,
            updated_at: order.updated_at,
          });
        }
      } else {
        // Fallback: tentar pelo stripe_session_id antigo
        await logDebug(
          supabaseAdmin,
          "Pedido não encontrado via correlation_id, tentando fallback stripe_session_id"
        );

        const { data: fallbackOrder } = await supabaseAdmin
          .from("orders")
          .select("id, status, items")
          .eq("stripe_session_id", `openpix_${correlationID}`)
          .maybeSingle();

        if (fallbackOrder) {
          await logDebug(supabaseAdmin, "Pedido encontrado via fallback stripe_session_id", {
            orderId: fallbackOrder.id,
          });

          const result = await supabaseAdmin
            .from("orders")
            .update({
              status: "paid",
              stripe_payment_intent: charge.transactionID,
              total_amount: charge.value / 100,
              total: charge.value / 100,
              updated_at: new Date().toISOString(),
            })
            .eq("id", fallbackOrder.id)
            .select()
            .single();

          order = result.data;
          orderError = result.error;
        } else {
          // Fallback extremo: criar novo pedido
          await logDebug(
            supabaseAdmin,
            "Pedido não encontrado, criando novo registro (Fallback Extremo)",
            {
              correlationID,
            }
          );

          const result = await supabaseAdmin
            .from("orders")
            .upsert(
              {
                stripe_session_id: `openpix_${correlationID}`,
                correlation_id: correlationID,
                stripe_payment_intent: charge.transactionID,
                customer_email: charge.customer?.email || "pix-sem-email@boracorrerclub.com.br",
                status: "paid",
                total: charge.value / 100,
                total_amount: charge.value / 100,
                items: [
                  {
                    name: "Produto PIX",
                    price: charge.value / 100,
                    quantity: 1,
                    image: null,
                  },
                ],
                payment_method: "pix",
                payment_provider: "openpix",
                updated_at: new Date().toISOString(),
              },
              { onConflict: "stripe_session_id" }
            )
            .select()
            .single();

          order = result.data;
          orderError = result.error;
        }
      }

      if (orderError) {
        await logDebug(supabaseAdmin, "Erro crítico ao processar pedido", { error: orderError });
        throw orderError;
      }

      await logDebug(supabaseAdmin, "Pedido processado com sucesso!", { orderId: order.id });

      // 3. Decrementar estoque
      if (order.items && Array.isArray(order.items)) {
        await logDebug(supabaseAdmin, "Iniciando decremento de estoque", {
          itemsCount: order.items.length,
        });
        await decrementStockForItems(supabaseAdmin, order.items);
      }

      // Enviar Email de Confirmação
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      // Fallback para o email do pedido se não houver no charge
      const finalEmail =
        charge.customer?.email || order.customer_email || "pix-sem-email@boracorrerclub.com.br";

      if (supabaseUrl && serviceRoleKey) {
        try {
          await logDebug(supabaseAdmin, "Disparando função de email", {
            email: finalEmail,
            orderId: order.id,
          });

          const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({
              type: "confirmation",
              email: finalEmail,
              orderId: order.id,
              status: "paid",
              total: charge.value / 100,
              items: order.items || [
                {
                  name: "Produto PIX",
                  price: charge.value / 100,
                  quantity: 1,
                  image: null,
                },
              ],
            }),
          });

          if (!emailResponse.ok) {
            const errorText = await emailResponse.text();
            await logDebug(supabaseAdmin, "Erro na resposta da função de email", {
              status: emailResponse.status,
              error: errorText,
            });
          } else {
            await logDebug(supabaseAdmin, "Email de confirmação disparado com sucesso");
          }
        } catch (emailError: any) {
          await logDebug(supabaseAdmin, "Erro ao disparar função de email", {
            error: emailError.message,
          });
        }
      }

      return new Response(
        JSON.stringify({
          status: "success",
          type: "order",
          orderId: order.id,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      // === FLUXO DE ASSINATURA ===
      // correlationID: user_{userId}_plan_{planId}_{timestamp} ou subscription_{userId}_{planId}
      let userId = "";
      let planId = "";

      if (parts[0] === "user" && parts[2] === "plan") {
        userId = parts[1];
        planId = parts[3];
      } else if (parts[0] === "subscription") {
        userId = parts[1];
        planId = parts[2];
      }

      if (!userId) {
        await logDebug(supabaseAdmin, "UserId não encontrado/Formato inválido (Assinatura)", {
          correlationID,
        });
        return new Response(
          JSON.stringify({
            status: "ok",
            message: "Unknown correlationID format",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      await logDebug(supabaseAdmin, "Processando assinatura", {
        userId,
        planId,
        amount: charge.value,
      });

      // 1. Criar registro histórico em orders
      const { error: insertOrderError } = await supabaseAdmin.from("orders").upsert(
        {
          stripe_session_id: `openpix_${correlationID}`,
          customer_email: charge.customer?.email || "pix@openpix.com.br",
          user_id: userId,
          status: "paid",
          total: charge.value / 100,
          items: [
            {
              name: planId || "Plano Assinatura",
              price: charge.value / 100,
              quantity: 1,
            },
          ],
          updated_at: new Date().toISOString(),
        },
        { onConflict: "stripe_session_id" }
      );

      if (insertOrderError) {
        await logDebug(supabaseAdmin, "Erro ao criar histórico pedido assinatura", {
          error: insertOrderError,
        });
      }

      // 2. Atualizar status da assinatura do perfil
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({
          subscription_status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (profileError) {
        await logDebug(supabaseAdmin, "Erro ao atualizar perfil (assinatura)", {
          error: profileError,
        });
      }

      // 3. Criar/Atualizar assinatura recorrente
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("nome_completo, telefone")
        .eq("user_id", userId)
        .single();

      const planName = planId ? planId.charAt(0).toUpperCase() + planId.slice(1) : "Mensal";
      const nextBilling = new Date();

      // Calcular próxima data de cobrança
      if (planId === "anual") {
        nextBilling.setFullYear(nextBilling.getFullYear() + 1);
      } else if (planId === "semestral") {
        nextBilling.setMonth(nextBilling.getMonth() + 6);
      } else if (planId === "trimestral") {
        nextBilling.setMonth(nextBilling.getMonth() + 3);
      } else {
        nextBilling.setMonth(nextBilling.getMonth() + 1);
      }

      const { error: subError } = await supabaseAdmin.from("recurring_subscriptions").upsert(
        {
          user_id: userId,
          student_name: profile?.nome_completo || charge.customer?.name || "Aluno",
          student_email: charge.customer?.email || "",
          student_phone: profile?.telefone || charge.customer?.phone || "",
          plan_id: planId || "mensal",
          plan_name: `Plano ${planName}`,
          amount: charge.value / 100,
          status: "active",
          next_billing_date: nextBilling.toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      if (subError) {
        await logDebug(supabaseAdmin, "Erro ao criar assinatura recorrente", {
          error: subError,
        });
      }

      await logDebug(supabaseAdmin, "Assinatura processada com sucesso!", { userId });

      // Enviar Email de Boas-vindas/Confirmação
      const finalEmailSubscription =
        charge.customer?.email || "pix-sem-email@boracorrerclub.com.br";
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      if (supabaseUrl && serviceRoleKey) {
        try {
          await logDebug(supabaseAdmin, "Disparando welcome email", {
            email: finalEmailSubscription,
            userId,
          });

          const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-subscription-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({
              type: "welcome",
              email: finalEmailSubscription,
              customerName: profile?.nome_completo || charge.customer?.name || "Aluno",
              planName: `Plano ${planName}`,
              confirmationLink: null, // O próprio function gera se necessário
            }),
          });

          // --- NOVO: WHATSAPP ONBOARDING (ZAPI) ---
          const zapiToken = Deno.env.get("ZAPI_TOKEN");
          const zapiInstance = Deno.env.get("ZAPI_URL");
          const studentPhone = profile?.telefone || charge.customer?.phone;

          if (zapiToken && zapiInstance && studentPhone) {
            const welcomeMsg = `🚀 *BEM-VINDO AO BORA CORRER CLUB!* 🏃‍♂️💨\n\nOlá, ${profile?.nome_completo?.split(" ")[0] || "atleta"}! É um prazer ter você conosco no time.\n\nPara começar sua jornada 100%:\n1️⃣ *Assista o Tutorial:* Como usar suas planilhas: https://youtu.be/exemplo\n2️⃣ *Entre no Grupo:* Comunidade BCC: https://chat.whatsapp.com/exemplo\n3️⃣ *Baixe seu Guia:* Manual do Aluno PDF: https://boracorrerclub.com.br/kit-boas-vindas.pdf\n\nQualquer dúvida, é só chamar aqui. Bons treinos! 🚀`;

            await fetch(`${zapiInstance}/token/${zapiToken}/send-text`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ phone: studentPhone, message: welcomeMsg }),
            });
            await logDebug(supabaseAdmin, "Onboarding WhatsApp enviado com sucesso");
          }

          if (!emailResponse.ok) {
            const errorText = await emailResponse.text();
            await logDebug(supabaseAdmin, "Erro na resposta da função de welcome email", {
              status: emailResponse.status,
              error: errorText,
            });
          } else {
            await logDebug(supabaseAdmin, "Welcome email disparado com sucesso");
          }
        } catch (emailError: any) {
          await logDebug(supabaseAdmin, "Erro ao disparar função de welcome email", {
            error: emailError.message,
          });
        }
      }

      return new Response(
        JSON.stringify({
          status: "success",
          userId,
          planId,
          message: "Subscription processed successfully",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
  } catch (error: any) {
    // Logar erro final
    try {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );
      await logDebug(supabaseAdmin, "Erro geral não tratado", {
        error: error.message,
        stack: error.stack,
      });
    } catch (e) {
      console.error("Falha catastrófica ao logar erro final", e);
    }

    return new Response(
      JSON.stringify({
        status: "ok",
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  }
});
