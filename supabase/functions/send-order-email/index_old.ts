import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Brand colors - Minimalista Clean
const BRAND = {
  primary: "#10b981", // emerald-500
  primaryDark: "#059669", // emerald-600
  dark: "#18181b", // zinc-900
  darkLight: "#27272a", // zinc-800
  white: "#FFFFFF",
  gray: "#71717a", // zinc-500
  grayLight: "#f4f4f5", // zinc-100
  grayBg: "#fafafa", // zinc-50
  success: "#10b981", // emerald-500
  warning: "#eab308",
  error: "#ef4444",
  black: "#09090b", // zinc-950
};

interface OrderItem {
  name: string;
  size?: string;
  price: number;
  quantity: number;
  image?: string;
}

interface ShippingAddress {
  name: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

interface OrderEmailRequest {
  type: "confirmation" | "status_update";
  email: string;
  orderId: string;
  status: string;
  total: number;
  items?: OrderItem[];
  shippingAddress?: ShippingAddress;
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SEND-ORDER-EMAIL] ${step}${detailsStr}`);
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    paid: "✅ Pagamento Confirmado",
    pending: "⏳ Aguardando Pagamento",
    awaiting_payment: "⏳ Aguardando Pagamento PIX",
    failed: "❌ Pagamento Falhou",
    shipped: "📦 Pedido Enviado",
    delivered: "🎉 Pedido Entregue",
  };
  return statusMap[status] || status;
};

const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    paid: BRAND.success,
    pending: BRAND.warning,
    awaiting_payment: BRAND.warning,
    failed: BRAND.error,
    shipped: BRAND.primary,
    delivered: BRAND.success,
  };
  return colorMap[status] || BRAND.gray;
};

const generateItemsHtml = (items: OrderItem[]): string => {
  return items
    .map(
      (item) => `
      <tr>
        <td style="padding: 16px; border-bottom: 1px solid #2A2A2A;">
          <div style="display: flex; align-items: center; gap: 12px;">
            ${
              item.image
                ? `
              <img src="${item.image}" alt="${item.name}" 
                   style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; background: ${BRAND.dark};" />
            `
                : `
              <div style="width: 60px; height: 60px; background: ${BRAND.dark}; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 24px;">📦</span>
              </div>
            `
            }
            <div>
              <strong style="color: ${BRAND.white}; display: block; margin-bottom: 4px;">${item.name}</strong>
              ${item.size ? `<span style="color: ${BRAND.gray}; font-size: 13px;">Tamanho: ${item.size}</span>` : ""}
            </div>
          </div>
        </td>
        <td style="padding: 16px; border-bottom: 1px solid #2A2A2A; text-align: center; color: ${BRAND.white};">${item.quantity}</td>
        <td style="padding: 16px; border-bottom: 1px solid #2A2A2A; text-align: right; color: ${BRAND.primary}; font-weight: 600;">${formatCurrency(item.price)}</td>
      </tr>
    `
    )
    .join("");
};

const generateAddressHtml = (address: ShippingAddress): string => {
  return `
    <div style="background: ${BRAND.darkLight}; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid ${BRAND.primary};">
      <h3 style="margin: 0 0 12px 0; color: ${BRAND.primary}; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">📍 Endereço de Entrega</h3>
      <p style="margin: 0; color: ${BRAND.white}; line-height: 1.6;">
        ${address.name}<br>
        ${address.street}, ${address.number}${address.complement ? ` - ${address.complement}` : ""}<br>
        ${address.neighborhood}<br>
        ${address.city} - ${address.state}<br>
        <span style="color: ${BRAND.gray};">CEP: ${address.zipCode}</span>
      </p>
    </div>
  `;
};

const generateConfirmationEmail = (data: OrderEmailRequest): string => {
  const itemsHtml = data.items ? generateItemsHtml(data.items) : "";
  const addressHtml = data.shippingAddress ? generateAddressHtml(data.shippingAddress) : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: ${BRAND.dark};">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, ${BRAND.dark} 0%, ${BRAND.darkLight} 100%); padding: 40px 30px; border-radius: 16px 16px 0 0; text-align: center; border-bottom: 3px solid ${BRAND.primary};">
          <div style="margin-bottom: 16px;">
            <span style="font-size: 48px;">🏃</span>
          </div>
          <h1 style="color: ${BRAND.white}; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">BORA CORRER CLUB</h1>
          <p style="color: ${BRAND.primary}; margin: 8px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Confirmação de Pedido</p>
        </div>
        
        <!-- Content -->
        <div style="background: ${BRAND.darkLight}; padding: 40px 30px; border-radius: 0 0 16px 16px;">
          
          <!-- Status Badge -->
          <div style="text-align: center; margin-bottom: 32px;">
            <span style="display: inline-block; background: ${getStatusColor(data.status)}20; color: ${getStatusColor(data.status)}; padding: 12px 24px; border-radius: 30px; font-weight: 700; font-size: 14px; border: 1px solid ${getStatusColor(data.status)}40;">
              ${getStatusText(data.status)}
            </span>
          </div>
          
          <!-- Order Info -->
          <p style="color: ${BRAND.white}; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0;">
            Olá! Recebemos seu pedido <strong style="color: ${BRAND.primary};">#${data.orderId.slice(-8).toUpperCase()}</strong>.
            ${data.status === "paid" ? "<br><br>✅ Seu pagamento foi confirmado e estamos preparando seu pedido!" : ""}
            ${data.status === "awaiting_payment" ? "<br><br>⏳ Aguardando a confirmação do pagamento PIX." : ""}
          </p>
          
          <!-- Items Table -->
          ${
            data.items && data.items.length > 0
              ? `
          <h2 style="color: ${BRAND.primary}; font-size: 14px; margin: 32px 0 16px 0; text-transform: uppercase; letter-spacing: 1px;">Itens do Pedido</h2>
          <table style="width: 100%; border-collapse: collapse; background: ${BRAND.dark}; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background: ${BRAND.dark};">
                <th style="padding: 14px 16px; text-align: left; color: ${BRAND.gray}; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Produto</th>
                <th style="padding: 14px 16px; text-align: center; color: ${BRAND.gray}; font-weight: 600; font-size: 12px; text-transform: uppercase;">Qtd</th>
                <th style="padding: 14px 16px; text-align: right; color: ${BRAND.gray}; font-weight: 600; font-size: 12px; text-transform: uppercase;">Preço</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr style="background: ${BRAND.primary}10;">
                <td colspan="2" style="padding: 20px 16px; text-align: right; font-weight: 700; color: ${BRAND.white}; text-transform: uppercase; font-size: 13px;">Total:</td>
                <td style="padding: 20px 16px; text-align: right; font-weight: 800; color: ${BRAND.primary}; font-size: 20px;">${formatCurrency(data.total)}</td>
              </tr>
            </tfoot>
          </table>
          `
              : ""
          }
          
          ${addressHtml}
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="https://charm-creator-nest.lovable.app/perfil" 
               style="display: inline-block; background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryDark} 100%); color: ${BRAND.white}; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
              Ver Meus Pedidos
            </a>
          </div>
          
          <!-- Footer -->
          <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #2A2A2A; text-align: center;">
            <p style="color: ${BRAND.gray}; font-size: 13px; margin: 0;">
              Dúvidas? Entre em contato via WhatsApp<br>
              <a href="https://wa.me/5511999999999" style="color: ${BRAND.primary}; text-decoration: none; font-weight: 600;">+55 11 99999-9999</a>
            </p>
          </div>
        </div>
        
        <!-- Copyright -->
        <p style="text-align: center; color: ${BRAND.gray}; font-size: 11px; margin-top: 24px; letter-spacing: 0.5px;">
          © ${new Date().getFullYear()} BORA CORRER CLUB. Todos os direitos reservados.
        </p>
      </div>
    </body>
    </html>
  `;
};

const generateStatusUpdateEmail = (data: OrderEmailRequest): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: ${BRAND.dark};">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, ${BRAND.dark} 0%, ${BRAND.darkLight} 100%); padding: 40px 30px; border-radius: 16px 16px 0 0; text-align: center; border-bottom: 3px solid ${BRAND.primary};">
          <div style="margin-bottom: 16px;">
            <span style="font-size: 48px;">🏃</span>
          </div>
          <h1 style="color: ${BRAND.white}; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">BORA CORRER CLUB</h1>
          <p style="color: ${BRAND.primary}; margin: 8px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Atualização do Pedido</p>
        </div>
        
        <!-- Content -->
        <div style="background: ${BRAND.darkLight}; padding: 40px 30px; border-radius: 0 0 16px 16px;">
          
          <!-- Status Badge -->
          <div style="text-align: center; margin-bottom: 32px;">
            <span style="display: inline-block; background: ${getStatusColor(data.status)}20; color: ${getStatusColor(data.status)}; padding: 16px 32px; border-radius: 30px; font-weight: 700; font-size: 16px; border: 1px solid ${getStatusColor(data.status)}40;">
              ${getStatusText(data.status)}
            </span>
          </div>
          
          <p style="color: ${BRAND.white}; font-size: 16px; line-height: 1.7; text-align: center; margin: 0 0 24px 0;">
            Seu pedido <strong style="color: ${BRAND.primary};">#${data.orderId.slice(-8).toUpperCase()}</strong> foi atualizado.
          </p>
          
          ${
            data.status === "paid"
              ? `
          <div style="background: ${BRAND.success}15; border: 1px solid ${BRAND.success}30; padding: 20px; border-radius: 12px; margin: 24px 0; text-align: center;">
            <p style="margin: 0; color: ${BRAND.success}; font-weight: 600;">
              🎉 Pagamento confirmado! Estamos preparando seu pedido para envio.
            </p>
          </div>
          `
              : ""
          }
          
          ${
            data.status === "failed"
              ? `
          <div style="background: ${BRAND.error}15; border: 1px solid ${BRAND.error}30; padding: 20px; border-radius: 12px; margin: 24px 0; text-align: center;">
            <p style="margin: 0; color: ${BRAND.error}; font-weight: 600;">
              Infelizmente houve um problema com seu pagamento. Por favor, tente novamente ou entre em contato.
            </p>
          </div>
          `
              : ""
          }
          
          <div style="text-align: center; margin: 24px 0;">
            <p style="color: ${BRAND.gray}; font-size: 14px; margin: 0;">
              Total do pedido: <strong style="color: ${BRAND.primary}; font-size: 18px;">${formatCurrency(data.total)}</strong>
            </p>
          </div>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="https://charm-creator-nest.lovable.app/perfil" 
               style="display: inline-block; background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryDark} 100%); color: ${BRAND.white}; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
              Acompanhar Pedido
            </a>
          </div>
          
          <!-- Footer -->
          <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #2A2A2A; text-align: center;">
            <p style="color: ${BRAND.gray}; font-size: 13px; margin: 0;">
              Dúvidas? Entre em contato via WhatsApp<br>
              <a href="https://wa.me/5511999999999" style="color: ${BRAND.primary}; text-decoration: none; font-weight: 600;">+55 11 99999-9999</a>
            </p>
          </div>
        </div>
        
        <!-- Copyright -->
        <p style="text-align: center; color: ${BRAND.gray}; font-size: 11px; margin-top: 24px; letter-spacing: 0.5px;">
          © ${new Date().getFullYear()} MÉTODO DIEGO PAZ. Todos os direitos reservados.
        </p>
      </div>
    </body>
    </html>
  `;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const data: OrderEmailRequest = await req.json();
    logStep("Request received", { type: data.type, email: data.email, orderId: data.orderId });

    if (!data.email || !data.orderId || !data.type) {
      throw new Error("Missing required fields: email, orderId, type");
    }

    const subject =
      data.type === "confirmation"
        ? `🏃 Bora Correr Club - Pedido #${data.orderId.slice(-8).toUpperCase()} Recebido!`
        : `🏃 Bora Correr Club - Atualização do Pedido #${data.orderId.slice(-8).toUpperCase()}`;

    const html =
      data.type === "confirmation"
        ? generateConfirmationEmail(data)
        : generateStatusUpdateEmail(data);

    logStep("Sending email", { subject });

    const emailResponse = await resend.emails.send({
      from: "Bora Correr Club <pedidos@boracorrerclub.com.br>",
      to: [data.email],
      bcc: ["financeiro@boracorrerclub.com.br"], // Cópia para o financeiro
      subject,
      html,
    });

    logStep("Email sent successfully", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
