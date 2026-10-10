import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const PRICE_TO_PLAN: Record<string, string> = {
  price_1SigTlBcYUb3BZC7v3bkUI6W: "Anual",
  price_1SigTFBcYUb3BZC7ZYz7E57D: "Semestral",
  price_1SigT4BcYUb3BZC7CzZSwNrS: "Trimestral",
  price_1SigPSBcYUb3BZC7AQtll0GG: "Mensal",
};

const logDebug = async (client: any, message: string, details?: any) => {
  try {
    console.log(`[STRIPE-WEBHOOK] ${message}`, details || "");
    await client.from("debug_logs").insert({
      source: "stripe-webhook",
      message,
      details: details ? (typeof details === "string" ? { info: details } : details) : null,
    });
  } catch (err) {
    console.error("Erro ao salvar log de debug:", err);
  }
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

async function sendOrderEmail(
  supabaseUrl: string,
  serviceRoleKey: string,
  payload: {
    type: "confirmation" | "status_update";
    email: string;
    orderId: string;
    status: string;
    total: number;
    items?: Array<{ name: string; size?: string; price: number; quantity: number; image?: string }>;
    shippingAddress?: any;
  }
): Promise<void> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceRoleKey}` },
      body: JSON.stringify(payload),
    });
    if (!response.ok)
      logStep("Email send failed", { status: response.status, error: await response.text() });
    else logStep("Email sent successfully", { type: payload.type, email: payload.email });
  } catch (error) {
    logStep("Email send error", { error: error instanceof Error ? error.message : error });
  }
}

async function sendSubscriptionEmail(
  supabaseUrl: string,
  supabaseAnonKey: string,
  payload: {
    type: "payment_failed" | "subscription_canceled" | "subscription_renewed" | "welcome";
    email: string;
    customerName?: string;
    planName?: string;
    amount?: number;
    attemptCount?: number;
    nextRetryDate?: string;
    periodEnd?: string;
  }
): Promise<void> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-subscription-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseAnonKey}` },
      body: JSON.stringify(payload),
    });
    if (!response.ok)
      logStep("Subscription email send failed", {
        status: response.status,
        error: await response.text(),
      });
    else
      logStep("Subscription email sent successfully", { type: payload.type, email: payload.email });
  } catch (error) {
    logStep("Subscription email send error", {
      error: error instanceof Error ? error.message : error,
    });
  }
}

async function upsertSubscription(
  supabaseAdmin: any,
  subscription: any,
  customerEmail: string,
  customerName?: string
): Promise<void> {
  const priceId = subscription.items?.data?.[0]?.price?.id;
  const planName = priceId ? PRICE_TO_PLAN[priceId] || "Consultoria" : "Consultoria";
  const subscriptionData = {
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer as string,
    customer_email: customerEmail,
    customer_name: customerName || null,
    plan_name: planName,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabaseAdmin
    .from("subscriptions")
    .upsert(subscriptionData, { onConflict: "stripe_subscription_id" });
  if (error) logStep("Error upserting subscription", { error, subscriptionId: subscription.id });
  else
    logStep("Subscription upserted", {
      subscriptionId: subscription.id,
      status: subscription.status,
    });
}

async function getCustomerDetails(
  stripe: Stripe,
  customerId: string
): Promise<{ email: string; name?: string }> {
  const customer = (await stripe.customers.retrieve(customerId)) as any;
  if (customer.deleted) return { email: "" };
  return { email: customer.email || "", name: customer.name || undefined };
}

async function decrementStockForItems(
  supabaseClient: any,
  items: Array<{ name: string; size?: string; quantity: number }>
): Promise<void> {
  for (const item of items) {
    if (!item.size) {
      logStep("Skipping stock decrement - no size", { item: item.name });
      continue;
    }
    const productName = item.name.replace(/\s*-\s*Tam\.\s*\w+$/i, "").trim();
    const { data: products, error: findError } = await supabaseClient
      .from("products")
      .select("id, nome, estoque")
      .ilike("nome", `%${productName}%`)
      .limit(1);
    if (findError || !products || products.length === 0) {
      logStep("Product not found for stock decrement", { productName, error: findError });
      continue;
    }
    const product = products[0];
    const estoque = product.estoque as Record<string, number> | null;
    const currentStock = estoque?.[item.size] ?? 0;
    const newStock = Math.max(0, currentStock - (item.quantity || 1));
    const { error: updateError } = await supabaseClient
      .from("products")
      .update({
        estoque: { ...estoque, [item.size]: newStock },
        updated_at: new Date().toISOString(),
      })
      .eq("id", product.id);
    if (updateError)
      logStep("Failed to decrement stock", {
        productId: product.id,
        size: item.size,
        error: updateError,
      });
    else
      logStep("Stock decremented", {
        product: product.nome,
        size: item.size,
        from: currentStock,
        to: newStock,
      });
  }
}

async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const parts = signature.split(",");
    const timestamp = parts.find((p) => p.startsWith("t="))?.split("=")[1];
    const sig = parts.find((p) => p.startsWith("v1="))?.split("=")[1];
    if (!timestamp || !sig) {
      logStep("Invalid signature format");
      return false;
    }
    const tolerance = 300;
    const currentTime = Math.floor(Date.now() / 1000);
    if (Math.abs(currentTime - parseInt(timestamp)) > tolerance) {
      logStep("Timestamp outside tolerance", { timestamp, currentTime });
      return false;
    }
    const signedPayload = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
    const expectedSig = Array.from(new Uint8Array(signatureBytes))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return expectedSig === sig;
  } catch (error) {
    logStep("Signature verification error", error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      await logDebug(supabaseAdmin, "No signature provided");
      return new Response(JSON.stringify({ error: "No signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const body = await req.text();
    if (!STRIPE_WEBHOOK_SECRET) {
      await logDebug(supabaseAdmin, "STRIPE_WEBHOOK_SECRET not configured in environment");
      return new Response(JSON.stringify({ error: "Config error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const isValid = await verifyStripeSignature(body, signature, STRIPE_WEBHOOK_SECRET);
    if (!isValid) {
      await logDebug(supabaseAdmin, "Invalid signature detected", {
        signature: signature.substring(0, 20) + "...",
      });
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event = JSON.parse(body);
    await logDebug(supabaseAdmin, `Event received: ${event.type}`, { id: event.id });
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const session = event.data.object;

    switch (event.type) {
      case "checkout.session.completed": {
        await logDebug(supabaseAdmin, "Processing checkout.session.completed", {
          sessionId: session.id,
        });
        let status = "pending";
        if (session.payment_status === "paid") status = "paid";
        else if (
          session.payment_status === "unpaid" &&
          session.payment_method_types?.includes("pix")
        )
          status = "awaiting_payment";
        await logDebug(supabaseAdmin, `Initial status determined: ${status}`, {
          payment_status: session.payment_status,
        });

        const { data: existingOrder, error: orderFetchError } = await supabaseAdmin
          .from("orders")
          .select("id, items, status")
          .eq("stripe_session_id", session.id)
          .maybeSingle();
        if (orderFetchError)
          await logDebug(supabaseAdmin, "Error searching for existing order", {
            error: orderFetchError,
          });

        let orderId;
        let items: Array<{
          name: string;
          size?: string;
          price: number;
          quantity: number;
          image?: string;
        }> = [];
        let shippingAddress = null;

        if (existingOrder?.items && Array.isArray(existingOrder.items)) {
          items = existingOrder.items as any;
          await logDebug(supabaseAdmin, "Items retrieved from existing order", {
            count: items.length,
          });
        }
        if (session.metadata?.items) {
          try {
            items = JSON.parse(session.metadata.items);
          } catch {
            await logDebug(supabaseAdmin, "Failed to parse items from metadata");
          }
        }

        if (existingOrder) {
          orderId = existingOrder.id;
          const { error: updateError } = await supabaseAdmin
            .from("orders")
            .update({
              status,
              stripe_payment_intent: session.payment_intent,
              total_amount: session.amount_total ? session.amount_total / 100 : 0,
              total: session.amount_total ? session.amount_total / 100 : 0,
              payment_method: session.payment_method_types?.[0] || "card",
              payment_provider: "stripe",
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingOrder.id);
          if (updateError) {
            await logDebug(supabaseAdmin, "Error updating existing order", updateError);
            throw updateError;
          }
          await logDebug(supabaseAdmin, "Order status updated successfully");
        } else {
          if (session.metadata?.shipping_address) {
            try {
              shippingAddress = JSON.parse(session.metadata.shipping_address);
            } catch {
              await logDebug(supabaseAdmin, "Failed to parse shipping address");
            }
          }
          const total = session.amount_total ? session.amount_total / 100 : 0;
          const { data: order, error: orderError } = await supabaseAdmin
            .from("orders")
            .insert({
              stripe_session_id: session.id,
              stripe_payment_intent: session.payment_intent,
              customer_email: session.customer_email || session.customer_details?.email,
              user_id: session.metadata?.user_id || null,
              status,
              total,
              total_amount: total,
              items,
              shipping_address: shippingAddress,
              payment_method: session.payment_method_types?.[0] || "card",
              payment_provider: "stripe",
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();
          if (orderError) {
            await logDebug(supabaseAdmin, "Error inserting new order (fallback)", orderError);
            throw orderError;
          }
          orderId = order.id;
          if (items.length > 0) {
            const orderItems = items.map((item: any) => ({
              order_id: order.id,
              product_name: item.name,
              product_size: item.size || null,
              price: item.price,
              quantity: item.quantity,
              product_image: item.image || null,
            }));
            const { error: itemsError } = await supabaseAdmin
              .from("order_items")
              .insert(orderItems);
            if (itemsError)
              await logDebug(supabaseAdmin, "Error inserting order items", itemsError);
          }
        }

        const customerEmail =
          session.customer_email ||
          session.customer_details?.email ||
          "stripe-sem-email@boracorrerclub.com.br";
        if (orderId) {
          await sendOrderEmail(supabaseUrl, supabaseServiceKey, {
            type: "confirmation",
            email: customerEmail,
            orderId,
            status,
            total: session.amount_total ? session.amount_total / 100 : 0,
            items,
            shippingAddress: shippingAddress || undefined,
          });
        }
        if (status === "paid" && items.length > 0)
          await decrementStockForItems(supabaseAdmin, items);

        // ==========================================
        // INTEGRAÇÃO COM BOT SISRUN
        // Só aciona se: pagamento OK + é plano/consultoria + aluno NÃO tem conta no SisRUN
        // ==========================================
        if (
          status === "paid" &&
          (session.mode === "subscription" ||
            items.some(
              (i: any) =>
                i.name.toLowerCase().includes("plano") ||
                i.name.toLowerCase().includes("anual") ||
                i.name.toLowerCase().includes("mensal")
            ))
        ) {
          const sisrunWebhookUrl = Deno.env.get("SISRUN_WEBHOOK_URL");
          if (sisrunWebhookUrl) {
            try {
              const userIdSisrun = session.metadata?.user_id;
              if (userIdSisrun) {
                // Buscar perfil incluindo campo tem_conta_sisrun
                const { data: profile } = await supabaseAdmin
                  .from("profiles")
                  .select("nome_completo, telefone, cpf, tem_conta_sisrun")
                  .eq("user_id", userIdSisrun)
                  .maybeSingle();

                // Se já tem conta no SisRUN, pula o bot
                if (profile?.tem_conta_sisrun === true) {
                  await logDebug(
                    supabaseAdmin,
                    "✅ Aluno já possui conta no SisRUN. Bot não será acionado.",
                    { userId: userIdSisrun }
                  );
                } else {
                  // Não tem conta: aciona o bot para criar!
                  await logDebug(
                    supabaseAdmin,
                    "🤖 Aluno sem conta SisRUN. Acionando bot para criar cadastro...",
                    { userId: userIdSisrun }
                  );

                  const { data: anamnese } = await supabaseAdmin
                    .from("student_anamnesis")
                    .select("*")
                    .eq("user_id", userIdSisrun)
                    .maybeSingle();
                  const cpfFormatado = profile?.cpf?.replace(/\D/g, "");
                  const senhaDefault = cpfFormatado ? cpfFormatado.substring(0, 6) : "mudar123";

                  const sisrunPayload = {
                    nome: profile?.nome_completo || customerEmail.split("@")[0],
                    email: customerEmail,
                    telefone: profile?.telefone || "",
                    data_nascimento: anamnese?.data_nascimento || null,
                    senha: senhaDefault,
                    objetivo_principal: anamnese?.objetivo_principal || "Sem objetivo preenchido",
                    dias_treino: anamnese?.dias_favoraveis || [],
                    instagram: anamnese?.instagram || "",
                    user_id: userIdSisrun,
                  };

                  const sisrunRes = await fetch(sisrunWebhookUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(sisrunPayload),
                  });

                  if (!sisrunRes.ok) {
                    await logDebug(
                      supabaseAdmin,
                      "Erro HTTP ao acionar Robô SisRUN",
                      await sisrunRes.text()
                    );
                  } else {
                    await logDebug(
                      supabaseAdmin,
                      "Robô SisRUN acionado com sucesso!",
                      await sisrunRes.json()
                    );
                    // Marca que agora o aluno tem conta no SisRUN
                    await supabaseAdmin
                      .from("profiles")
                      .update({ tem_conta_sisrun: true })
                      .eq("user_id", userIdSisrun);
                  }
                }
              } else {
                await logDebug(
                  supabaseAdmin,
                  "Não foi possível acionar SisRUN: user_id não encontrado nos metadados"
                );
              }
            } catch (err: unknown) {
              const errMessage = err instanceof Error ? err.message : String(err);
              await logDebug(supabaseAdmin, "Exceção ao ligar para o Robô SisRUN", errMessage);
            }
          } else {
            await logDebug(
              supabaseAdmin,
              "Variável SISRUN_WEBHOOK_URL não configurada. Bot offline."
            );
          }
        }
        // ==========================================

        break;
      }

      case "checkout.session.async_payment_succeeded": {
        const { data: orderToUpdate } = await supabaseAdmin
          .from("orders")
          .select("id, customer_email, total, items")
          .eq("stripe_session_id", session.id)
          .single();
        const { error } = await supabaseAdmin
          .from("orders")
          .update({ status: "paid", updated_at: new Date().toISOString() })
          .eq("stripe_session_id", session.id);
        if (error) {
          await logDebug(supabaseAdmin, "Error updating order to paid (async)", error);
          throw error;
        }
        if (orderToUpdate?.items) {
          const items = Array.isArray(orderToUpdate.items) ? orderToUpdate.items : [];
          await decrementStockForItems(supabaseAdmin, items as any);
        }
        if (orderToUpdate?.customer_email)
          await sendOrderEmail(supabaseUrl, supabaseServiceKey, {
            type: "status_update",
            email: orderToUpdate.customer_email,
            orderId: orderToUpdate.id,
            status: "paid",
            total: orderToUpdate.total || 0,
          });
        break;
      }

      case "checkout.session.async_payment_failed": {
        const { data: failedOrder } = await supabaseAdmin
          .from("orders")
          .select("id, customer_email, total")
          .eq("stripe_session_id", session.id)
          .single();
        const { error } = await supabaseAdmin
          .from("orders")
          .update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("stripe_session_id", session.id);
        if (error) {
          await logDebug(supabaseAdmin, "Error updating order to failed (async)", error);
          throw error;
        }
        if (failedOrder?.customer_email)
          await sendOrderEmail(supabaseUrl, supabaseAnonKey, {
            type: "status_update",
            email: failedOrder.customer_email,
            orderId: failedOrder.id,
            status: "failed",
            total: failedOrder.total || 0,
          });
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object;
        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
          apiVersion: "2025-08-27.basil",
        });
        const customer = await getCustomerDetails(stripe, subscription.customer as string);
        await upsertSubscription(supabaseAdmin, subscription, customer.email, customer.name);
        if (customer.email) {
          const priceId = subscription.items?.data?.[0]?.price?.id;
          const planName = priceId ? PRICE_TO_PLAN[priceId] || "Consultoria" : "Consultoria";
          await sendSubscriptionEmail(supabaseUrl, supabaseAnonKey, {
            type: "welcome",
            email: customer.email,
            customerName: customer.name,
            planName,
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const previousAttributes = event.data.previous_attributes;
        const stripeUpdate = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
          apiVersion: "2025-08-27.basil",
        });
        const customerUpdate = await getCustomerDetails(
          stripeUpdate,
          subscription.customer as string
        );
        await upsertSubscription(
          supabaseAdmin,
          subscription,
          customerUpdate.email,
          customerUpdate.name
        );
        if (
          previousAttributes?.cancel_at_period_end === false &&
          subscription.cancel_at_period_end === true
        ) {
          if (customerUpdate.email) {
            const priceId = subscription.items?.data?.[0]?.price?.id;
            const planName = priceId ? PRICE_TO_PLAN[priceId] || "Consultoria" : "Consultoria";
            await sendSubscriptionEmail(supabaseUrl, supabaseAnonKey, {
              type: "subscription_canceled",
              email: customerUpdate.email,
              customerName: customerUpdate.name,
              planName,
              periodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
            });
          }
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        if (charge.payment_intent) {
          const { error: refundError } = await supabaseAdmin
            .from("orders")
            .update({ status: "refunded", updated_at: new Date().toISOString() })
            .eq("stripe_payment_intent", charge.payment_intent);
          if (refundError)
            await logDebug(supabaseAdmin, "Error updating order to refunded", refundError);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const { error: deleteError } = await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "canceled",
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);
        if (deleteError)
          await logDebug(supabaseAdmin, "Error updating subscription to canceled", deleteError);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        if (invoice.subscription) {
          const { error: updateError } = await supabaseAdmin
            .from("subscriptions")
            .update({
              status: "active",
              current_period_end: invoice.lines?.data?.[0]?.period?.end
                ? new Date(invoice.lines.data[0].period.end * 1000).toISOString()
                : undefined,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", invoice.subscription);
          if (updateError)
            await logDebug(supabaseAdmin, "Error updating subscription after payment", updateError);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        if (invoice.subscription) {
          await supabaseAdmin
            .from("subscriptions")
            .update({ status: "past_due", updated_at: new Date().toISOString() })
            .eq("stripe_subscription_id", invoice.subscription);
          const { data: subData } = await supabaseAdmin
            .from("subscriptions")
            .select("plan_name, customer_name")
            .eq("stripe_subscription_id", invoice.subscription)
            .single();
          if (invoice.customer_email) {
            await sendSubscriptionEmail(supabaseUrl, supabaseAnonKey, {
              type: "payment_failed",
              email: invoice.customer_email,
              customerName: subData?.customer_name,
              planName: subData?.plan_name || "Consultoria",
              amount: invoice.amount_due / 100,
              attemptCount: invoice.attempt_count,
              nextRetryDate: invoice.next_payment_attempt
                ? new Date(invoice.next_payment_attempt * 1000).toISOString()
                : undefined,
            });
          }
        }
        break;
      }

      default:
        await logDebug(supabaseAdmin, `Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await logDebug(supabaseAdmin, "Webhook FINAL error", { error: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
