import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-signature",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[ABACATE-WEBHOOK] ${step}${detailsStr}`);
};

// Helper function to send order emails
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
  }
): Promise<void> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      logStep("Email send failed", { status: response.status, error });
    } else {
      logStep("Email sent successfully", { type: payload.type, email: payload.email });
    }
  } catch (error) {
    logStep("Email send error", { error: error instanceof Error ? error.message : error });
  }
}

// Helper function to decrement stock
async function decrementStockForItems(
  supabaseClient: any,
  items: Array<{ name: string; size?: string; quantity: number }>
): Promise<void> {
  for (const item of items) {
    if (!item.size) {
      logStep("Skipping stock decrement - no size", { item: item.name });
      continue;
    }

    // Extract product name (remove " - Tam. X" suffix if present)
    const productName = item.name.replace(/\s*-\s*Tam\.\s*\w+$/i, "").trim();

    // Find the product by name
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

    // Update stock
    const { error: updateError } = await supabaseClient
      .from("products")
      .update({
        estoque: {
          ...estoque,
          [item.size]: newStock,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", product.id);

    if (updateError) {
      logStep("Failed to decrement stock", {
        productId: product.id,
        size: item.size,
        error: updateError,
      });
    } else {
      logStep("Stock decremented", {
        product: product.nome,
        size: item.size,
        from: currentStock,
        to: newStock,
      });
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const body = await req.text();
    const event = JSON.parse(body);

    logStep("Event received", { event: event.event, id: event.id, devMode: event.devMode });

    // Get Supabase config
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Initialize Supabase client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Handle billing.paid event
    if (event.event === "billing.paid") {
      logStep("Processing billing.paid event");

      const billingData = event.data?.billing || event.data;
      const paymentData = event.data?.payment;

      // Extract billing ID
      const billingId = billingData?.id || event.id;

      // Extract customer email
      const customerEmail = billingData?.customer?.email || billingData?.email || null;

      // Extract metadata
      const metadata = billingData?.metadata || {};
      const userId = metadata.user_id || null;

      // Parse items from metadata
      let items: Array<{
        name: string;
        size?: string;
        price: number;
        quantity: number;
        image?: string;
      }> = [];
      if (metadata.items) {
        try {
          items = JSON.parse(metadata.items);
        } catch {
          logStep("Failed to parse items from metadata");
        }
      }

      // Calculate total (payment amount is in cents)
      const total = paymentData?.amount ? paymentData.amount / 100 : 0;

      // Check if order already exists for this billing
      const { data: existingOrder } = await supabaseAdmin
        .from("orders")
        .select("id, status")
        .eq("stripe_session_id", `abacate_${billingId}`)
        .maybeSingle();

      if (existingOrder) {
        // Update existing order to paid
        if (existingOrder.status !== "paid") {
          const { error: updateError } = await supabaseAdmin
            .from("orders")
            .update({
              status: "paid",
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingOrder.id);

          if (updateError) {
            logStep("Error updating order to paid", updateError);
            throw updateError;
          }

          logStep("Order updated to paid", { orderId: existingOrder.id });

          // Decrement stock
          if (items.length > 0) {
            await decrementStockForItems(supabaseAdmin, items);
          }

          // Send email notification
          const finalEmail = customerEmail || "abacate-sem-email@boracorrerclub.com.br";
          await sendOrderEmail(supabaseUrl, supabaseServiceKey, {
            type: "status_update",
            email: finalEmail,
            orderId: existingOrder.id,
            status: "paid",
            total,
          });
        } else {
          logStep("Order already paid, skipping", { orderId: existingOrder.id });
        }
      } else {
        // Create new order
        const { data: order, error: orderError } = await supabaseAdmin
          .from("orders")
          .insert({
            stripe_session_id: `abacate_${billingId}`,
            stripe_payment_intent: null,
            customer_email: customerEmail || "pix@abacatepay.com",
            user_id: userId,
            status: "paid",
            total,
            items,
            shipping_address: null,
          })
          .select()
          .single();

        if (orderError) {
          logStep("Error creating order", orderError);
          throw orderError;
        }

        logStep("Order created", { orderId: order.id, status: "paid" });

        // Insert order items
        if (items.length > 0) {
          const orderItems = items.map((item) => ({
            order_id: order.id,
            product_name: item.name,
            product_size: item.size || null,
            price: item.price,
            quantity: item.quantity || 1,
            product_image: item.image || null,
          }));

          const { error: itemsError } = await supabaseAdmin.from("order_items").insert(orderItems);

          if (itemsError) {
            logStep("Error inserting order items", itemsError);
          } else {
            logStep("Order items created", { count: orderItems.length });
          }

          // Decrement stock
          await decrementStockForItems(supabaseAdmin, items);
        }

        // Send confirmation email
        const finalEmail = customerEmail || "abacate-sem-email@boracorrerclub.com.br";
        await sendOrderEmail(supabaseUrl, supabaseServiceKey, {
          type: "confirmation",
          email: finalEmail,
          orderId: order.id,
          status: "paid",
          total,
          items,
        });
      }

      // NOVO: Processar pagamento de fatura recorrente
      const invoiceId = metadata.invoice_id || metadata.invoiceId;
      if (invoiceId) {
        logStep("Processing recurring invoice payment", { invoiceId });

        // Atualizar fatura para paga
        const { data: invoice, error: invoiceError } = await supabaseAdmin
          .from("subscription_invoices")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
          })
          .eq("id", invoiceId)
          .select("*, recurring_subscriptions(*)")
          .single();

        if (invoiceError) {
          logStep("Error updating invoice", invoiceError);
        } else {
          logStep("Invoice marked as paid", { invoiceId });

          // Desbloquear acesso do usuário
          if (invoice.recurring_subscriptions) {
            const subscription = invoice.recurring_subscriptions;

            await supabaseAdmin
              .from("profiles")
              .update({
                subscription_status: "active",
                blocked_at: null,
              })
              .eq("user_id", subscription.user_id);

            logStep("User access unblocked", { userId: subscription.user_id });

            // --- NOVO: WHATSAPP ONBOARDING (ZAPI) ---
            const zapiToken = Deno.env.get("ZAPI_TOKEN");
            const zapiInstance = Deno.env.get("ZAPI_URL");
            const studentPhone = subscription.student_phone;

            if (zapiToken && zapiInstance && studentPhone) {
              const welcomeMsg = `🚀 *BEM-VINDO AO BORA CORRER CLUB!* 🏃‍♂️💨\n\nOlá, ${subscription.student_name.split(" ")[0]}! É um prazer ter você conosco no time.\n\nPara começar sua jornada 100%:\n1️⃣ *Assista o Tutorial:* Como usar suas planilhas: https://youtu.be/exemplo\n2️⃣ *Entre no Grupo:* Comunidade BCC: https://chat.whatsapp.com/exemplo\n3️⃣ *Baixe seu Guia:* Manual do Aluno PDF: https://boracorrerclub.com.br/kit-boas-vindas.pdf\n\nQualquer dúvida, é só chamar aqui. Bons treinos! 🚀`;

              await fetch(`${zapiInstance}/token/${zapiToken}/send-text`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: studentPhone, message: welcomeMsg }),
              });
              logStep("WhatsApp onboarding sent");
            }

            // Gerar próxima fatura (30 dias)
            const nextDueDate = new Date();
            nextDueDate.setDate(nextDueDate.getDate() + 35); // 30 dias + 5 dias de vencimento

            const { data: nextInvoice, error: nextInvoiceError } = await supabaseAdmin
              .from("subscription_invoices")
              .insert({
                subscription_id: subscription.id,
                amount: subscription.amount,
                due_date: nextDueDate.toISOString(),
                status: "pending",
              })
              .select()
              .single();

            if (!nextInvoiceError && nextInvoice) {
              logStep("Next invoice created", { invoiceId: nextInvoice.id });

              // Gerar link de pagamento para próxima fatura
              // TODO: Chamar create-pix-abacate para gerar link
              // TODO: Enviar email com próxima fatura
            }
          }
        }
      }
    } else {
      logStep("Unhandled event type", { event: event.event });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("Webhook error", { error: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
