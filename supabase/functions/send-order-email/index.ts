import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BRAND = {
  primary: "#10b981",
  black: "#09090b",
  white: "#FFFFFF",
  gray: "#71717a",
  grayLight: "#a1a1aa",
  grayBg: "#fafafa",
  grayBorder: "#f4f4f5",
  grayBorder2: "#e4e4e7",
  grayBorder3: "#d4d4d8",
};

interface OrderItem {
  name: string;
  size?: string;
  price: number;
  quantity: number;
  image?: string;
}

interface OrderEmailRequest {
  type: "confirmation" | "status_update";
  email: string;
  orderId: string;
  status: string;
  total: number;
  items?: OrderItem[];
  isAdmin?: boolean;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
};

const generateConfirmationEmail = (data: OrderEmailRequest): string => {
  const itemsHtml =
    data.items && data.items.length > 0
      ? data.items
          .map(
            (item) => `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 14px;">
                <div style="width: 60px; height: 60px; background: ${BRAND.white}; border-radius: 14px; display: flex; align-items: center; justify-content: center; border: 1px solid ${BRAND.grayBorder2}; overflow: hidden;">
                    ${
                      item.image
                        ? `<img src="${item.image}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;" />`
                        : `<span style="font-size: 24px;">👕</span>`
                    }
                </div>
                <div>
                    <p style="font-weight: 800; color: ${BRAND.black}; font-size: 13px; margin: 0; line-height: 1.3;">${item.name || "Produto"}</p>
                    <p style="font-size: 11px; color: ${BRAND.gray}; margin: 4px 0 0 0; font-weight: 500;">TAM: ${item.size || "Único"} • QTD: ${item.quantity || 1}</p>
                </div>
            </div>
            <p style="font-weight: 800; color: ${BRAND.black}; font-size: 14px; margin: 0;">${formatCurrency(item.price)}</p>
        </div>
      `
          )
          .join("")
      : `<p style="color: ${BRAND.gray}; font-size: 14px; text-align: center;">Itens do pedido não especificados</p>`;

  const ctaUrl = data.isAdmin
    ? "https://www.boracorrerclub.com.br/admin?tab=pedidos"
    : "https://www.boracorrerclub.com.br/perfil?tab=pedidos";
  const ctaText = data.isAdmin ? "VER NO ADMIN →" : "VER MEUS PEDIDOS →";

  const orderIdRaw = data.orderId || "---";
  const orderIdShort =
    orderIdRaw.length > 8 ? orderIdRaw.slice(-8).toUpperCase() : orderIdRaw.toUpperCase();

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${BRAND.grayBg};">
    <div style="padding: 40px 16px;">
        <div style="max-width: 480px; margin: 0 auto; background: ${BRAND.white}; border-radius: 40px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.08); overflow: hidden; border: 1px solid ${BRAND.grayBorder};">
            <div style="background: ${BRAND.white}; padding: 56px 0 32px 0; text-align: center;">
                <div style="display: inline-block;">
                    <h1 style="font-size: 38px; font-weight: 900; font-style: italic; letter-spacing: -2px; color: ${BRAND.black}; margin: 0; line-height: 1;">BC</h1>
                    <p style="font-size: 11px; font-weight: 800; letter-spacing: 5px; text-transform: uppercase; color: ${BRAND.black}; margin: 0; text-align: center;">CLUB</p>
                </div>
            </div>
            <div style="padding: 0 40px 40px 40px; text-align: center;">
                <div style="display: inline-flex; align-items: center; padding: 8px 18px; background: ${BRAND.primary}; color: ${BRAND.white}; border-radius: 9999px; margin-bottom: 24px;">
                    <span style="font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 2px;">✓ Pedido Confirmado</span>
                </div>
                <h2 style="font-size: 22px; font-weight: 900; color: ${BRAND.black}; margin: 0 0 12px 0; letter-spacing: -0.8px;">Seu pedido foi recebido! 🤝</h2>
                <p style="color: ${BRAND.gray}; font-size: 14px; margin: 0; line-height: 1.6; max-width: 320px; margin: 0 auto;">
                    Olá! O pedido <span style="color: ${BRAND.black}; font-weight: 700;">#${orderIdShort}</span> já está no nosso sistema. 
                </p>
            </div>
            <div style="margin: 0 32px; padding: 28px; background: ${BRAND.grayBg}; border-radius: 28px; border: 1px solid ${BRAND.grayBorder2};">
                ${itemsHtml}
                <div style="margin-top: 24px; padding-top: 20px; border-top: 1px dashed ${BRAND.grayBorder3}; display: flex; justify-content: space-between; align-items: flex-end;">
                    <span style="font-size: 10px; font-weight: 700; color: ${BRAND.grayLight}; text-transform: uppercase; letter-spacing: 3px;">Total Pago</span>
                    <span style="font-size: 26px; font-weight: 950; color: ${BRAND.black}; letter-spacing: -1.5px;">${formatCurrency(data.total)}</span>
                </div>
            </div>
            <div style="padding: 40px;">
                <a href="${ctaUrl}" style="display: block; width: 100%; background: ${BRAND.black}; color: ${BRAND.white}; font-weight: 900; padding: 22px; border-radius: 20px; text-decoration: none; text-align: center; text-transform: uppercase; letter-spacing: 1px; font-size: 13px; margin-bottom: 32px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">${ctaText}</a>
                <div style="text-align: center; padding-top: 24px; border-top: 1px solid ${BRAND.grayBorder};">
                    <p style="font-size: 10px; color: ${BRAND.grayLight}; font-weight: 700; text-transform: uppercase; letter-spacing: 3px; margin: 0 0 16px 0;">Alguma dúvida? Me chama no Whats</p>
                    <a href="https://wa.me/5513996890611" target="_blank" style="display: inline-flex; align-items: center; gap: 8px; color: ${BRAND.black}; font-weight: 800; text-decoration: none; font-size: 16px;">
                        <span>+55 13 99689-0611</span>
                    </a>
                </div>
            </div>
            <div style="background: ${BRAND.grayBg}; padding: 32px; text-align: center;">
                <p style="font-size: 9px; color: ${BRAND.grayLight}; font-weight: 800; text-transform: uppercase; letter-spacing: 5px; margin: 0;">BORA CORRER CLUB</p>
            </div>
        </div>
    </div>
</body>
</html>
  `;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  const log = async (msg: string, details: any = null) => {
    console.log(`[SEND-ORDER-EMAIL] ${msg}`, details);
    try {
      await supabaseAdmin.from("debug_logs").insert({
        source: "send-order-email",
        message: msg,
        details: details ? JSON.parse(JSON.stringify(details)) : null,
      });
    } catch (err) {
      console.error("Failed to insert log into debug_logs:", err);
    }
  };

  try {
    await log("Function started");

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY is not configured");

    const text = await req.text();
    if (!text) throw new Error("Empty request body");

    let data: OrderEmailRequest;
    try {
      data = JSON.parse(text);
    } catch (err) {
      throw new Error(`Invalid JSON payload: ${err.message}`);
    }

    await log("Payload parsed", { type: data.type, email: data.email, orderId: data.orderId });

    const resend = new Resend(resendKey);
    const orderIdShort = data.orderId
      ? data.orderId.length > 8
        ? data.orderId.slice(-8).toUpperCase()
        : data.orderId.toUpperCase()
      : "---";
    const subject = `🏃 Bora Correr Club - Pedido #${orderIdShort} Confirmado!`;
    const html = generateConfirmationEmail(data);

    // Verified sender address
    const fromAddress = "Bora Correr Club <pedidos@boracorrerclub.com.br>";

    // Send to customer IF email is provided and not a placeholder
    const isPlaceholderEmail = data.email === "pix-sem-email@boracorrerclub.com.br" || !data.email;
    let customerRes = null;

    if (!isPlaceholderEmail) {
      await log("Sending email to customer", { from: fromAddress, to: data.email });
      customerRes = await resend.emails.send({
        from: fromAddress,
        to: [data.email],
        subject,
        html,
      });

      if (customerRes.error) {
        await log("Resend customer error", customerRes.error);
      } else {
        await log("Customer email sent successfully", { id: customerRes.data?.id });
      }
    } else {
      await log("Skipping customer email (missing or placeholder)");
    }

    // Admin copy - ALWAYS SEND
    const adminEmails = [
      "pedidos@boracorrerclub.com.br",
      "boracorrerclub@gmail.com",
      "contato@boracorrerclub.com.br",
    ];
    const adminSubject = isPlaceholderEmail
      ? `[Urgente - Sem Email] ${subject}`
      : `[ADMIN] ${subject}`;

    await log("Sending copy to admin", { from: fromAddress, to: adminEmails });

    const adminRes = await resend.emails.send({
      from: fromAddress,
      to: adminEmails,
      subject: adminSubject,
      html: generateConfirmationEmail({ ...data, isAdmin: true }),
    });

    if (adminRes.error) {
      await log("Resend admin error", adminRes.error);
    } else {
      await log("Admin copy sent successfully", { id: adminRes.data?.id });
    }

    return new Response(
      JSON.stringify({
        success: true,
        customer: customerRes,
        admin: adminRes,
        customerEmailSkipped: isPlaceholderEmail,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    await log("CRITICAL ERROR", { error: err.message });
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
