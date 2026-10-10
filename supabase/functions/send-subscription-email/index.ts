import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Brand colors
const BRAND = {
  primary: "#E91E63", // electric-pink
  primaryDark: "#C2185B",
  dark: "#0D0D0D", // obsidian
  darkLight: "#1A1A1A",
  white: "#FFFFFF",
  gray: "#6B7280",
  grayLight: "#F3F4F6",
  success: "#22C55E",
  warning: "#EAB308",
  error: "#EF4444",
};

interface SubscriptionEmailRequest {
  type:
    | "payment_failed"
    | "subscription_canceled"
    | "subscription_renewed"
    | "welcome"
    | "payment_invite";
  email: string;
  customerName?: string;
  planName?: string;
  amount?: number;
  attemptCount?: number;
  nextRetryDate?: string;
  periodEnd?: string;
  portalUrl?: string;
  confirmationLink?: string;
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SEND-SUBSCRIPTION-EMAIL] ${step}${detailsStr}`);
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

function generatePaymentFailedEmail(data: SubscriptionEmailRequest): string {
  const customerName = data.customerName || "Atleta";
  const planName = data.planName || "sua assinatura";
  const amount = data.amount ? formatCurrency(data.amount) : "";
  const attemptInfo =
    data.attemptCount && data.attemptCount > 1
      ? `Esta é a ${data.attemptCount}ª tentativa de cobrança.`
      : "";
  const nextRetryInfo = data.nextRetryDate
    ? `Próxima tentativa: ${new Date(data.nextRetryDate).toLocaleDateString("pt-BR")}`
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Problema com seu pagamento</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: ${BRAND.dark};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${BRAND.dark}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: ${BRAND.darkLight}; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND.error} 0%, #B91C1C 100%); padding: 40px 30px; text-align: center;">
              <div style="margin-bottom: 12px;">
                <span style="font-size: 40px;">⚠️</span>
              </div>
              <h1 style="color: ${BRAND.white}; margin: 0; font-size: 22px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                Problema com seu Pagamento
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: ${BRAND.white}; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
                Olá, <strong style="color: ${BRAND.primary};">${customerName}</strong>!
              </p>
              
              <p style="color: ${BRAND.white}; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
                Não conseguimos processar o pagamento da sua assinatura <strong style="color: ${BRAND.primary};">${planName}</strong>${amount ? ` no valor de <strong style="color: ${BRAND.primary};">${amount}</strong>` : ""}.
              </p>
              
              ${attemptInfo ? `<p style="color: ${BRAND.error}; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0; font-weight: 600;">${attemptInfo}</p>` : ""}
              ${nextRetryInfo ? `<p style="color: ${BRAND.gray}; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">${nextRetryInfo}</p>` : ""}
              
              <div style="background-color: ${BRAND.error}15; border-left: 4px solid ${BRAND.error}; padding: 20px; margin: 25px 0; border-radius: 0 12px 12px 0;">
                <p style="color: ${BRAND.error}; font-size: 14px; margin: 0; font-weight: 600;">
                  Para evitar a interrupção do seu acesso ao método, atualize seu método de pagamento.
                </p>
              </div>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${data.portalUrl || "https://charm-creator-nest.lovable.app/minha-assinatura"}" 
                   style="display: inline-block; background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryDark} 100%); color: ${BRAND.white}; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                  Atualizar Pagamento
                </a>
              </div>
              
              <p style="color: ${BRAND.gray}; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0; text-align: center;">
                Precisa de ajuda? Fale conosco pelo WhatsApp.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: ${BRAND.dark}; padding: 25px 30px; text-align: center; border-top: 1px solid #2A2A2A;">
              <p style="color: ${BRAND.gray}; font-size: 11px; margin: 0; letter-spacing: 0.5px;">
                © ${new Date().getFullYear()} BORA CORRER CLUB. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function generateSubscriptionCanceledEmail(data: SubscriptionEmailRequest): string {
  const customerName = data.customerName || "Atleta";
  const planName = data.planName || "sua assinatura";
  const periodEnd = data.periodEnd ? new Date(data.periodEnd).toLocaleDateString("pt-BR") : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Assinatura Cancelada</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: ${BRAND.dark};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${BRAND.dark}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: ${BRAND.darkLight}; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND.gray} 0%, #4B5563 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: ${BRAND.white}; margin: 0; font-size: 22px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                Assinatura Cancelada
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: ${BRAND.white}; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
                Olá, <strong style="color: ${BRAND.primary};">${customerName}</strong>!
              </p>
              
              <p style="color: ${BRAND.white}; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
                Confirmamos o cancelamento da sua assinatura <strong style="color: ${BRAND.primary};">${planName}</strong>.
              </p>
              
              ${
                periodEnd
                  ? `
              <div style="background-color: ${BRAND.dark}; padding: 24px; margin: 25px 0; border-radius: 12px; text-align: center; border: 1px solid #2A2A2A;">
                <p style="color: ${BRAND.gray}; font-size: 13px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Seu acesso permanece ativo até</p>
                <p style="color: ${BRAND.primary}; font-size: 24px; margin: 0; font-weight: 800;">${periodEnd}</p>
              </div>
              `
                  : ""
              }
              
              <p style="color: ${BRAND.white}; font-size: 16px; line-height: 1.7; margin: 20px 0;">
                Sentiremos sua falta na equipe! 💪 Se mudar de ideia, você pode reativar sua assinatura a qualquer momento.
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://charm-creator-nest.lovable.app/consultoria" 
                   style="display: inline-block; background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryDark} 100%); color: ${BRAND.white}; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                  Voltar para o Método
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: ${BRAND.dark}; padding: 25px 30px; text-align: center; border-top: 1px solid #2A2A2A;">
              <p style="color: ${BRAND.gray}; font-size: 11px; margin: 0; letter-spacing: 0.5px;">
                © ${new Date().getFullYear()} BORA CORRER CLUB. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function generateWelcomeEmail(data: SubscriptionEmailRequest): string {
  const customerName = data.customerName || "Atleta";
  // @ts-ignore
  const confirmationLink = (data as any).confirmationLink;
  const confirmationButton = confirmationLink
    ? `<div class="button-container" style="margin-top: 35px; margin-bottom: 10px;">
        <a href="${confirmationLink}" class="button" style="background-color: #E91E63; color: #fff; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; display: inline-block; transition: all 0.3s ease; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">Confirmar meu cadastro &rarr;</a>
      </div>
      <p style="text-align:center; font-size:13px; color:#888; margin-top:8px;">Se o botão não funcionar, copie e cole este link no navegador:<br><span style=\"word-break:break-all;\">${confirmationLink}</span></p>`
    : "";
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bem-vindo ao Bora Correr Club</title>
    <style>
        body { margin: 0; padding: 0; background-color: #F8F9FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #333333; -webkit-font-smoothing: antialiased; }
        table { border-spacing: 0; width: 100%; }
        td { padding: 0; }
        img { border: 0; display: block; max-width: 100%; }
        .email-wrapper { padding: 40px 10px; }
        .email-container { max-width: 580px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); overflow: hidden; }
        .header { background-color: #FFFFFF; padding: 30px 40px 20px 40px; text-align: center; border-bottom: 1px solid #F0F0F0; }
        .header img { margin: 0 auto; max-width: 160px; height: auto; }
        .hero-image { width: 100%; text-align: center; background-color: #FAFAFA; border-bottom: 1px solid #EEEEEE; }
        .hero-image img { width: 100%; max-width: 100%; height: auto; display: block; }
        .content { padding: 30px 40px 40px 40px; line-height: 1.7; font-size: 16px; color: #4A4A4A; text-align: left; }
        h1 { color: #111111; font-size: 26px; font-weight: 700; margin: 0 0 24px 0; text-align: center; letter-spacing: -0.5px; }
        p { margin: 0 0 20px 0; }
        strong { color: #000000; font-weight: 600; }
        .features-table { margin: 25px 0; width: 100%; background-color: #FAFAFA; border-radius: 12px; padding: 20px; }
        .feature-row { padding: 8px 0; font-size: 15px; }
        .check-icon { color: #FF5722; font-weight: bold; padding-right: 10px; font-size: 18px; }
        .button-container { text-align: center; margin-top: 35px; margin-bottom: 10px; }
        .button { background-color: #111111; color: #FFFFFF; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; display: inline-block; transition: all 0.3s ease; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); }
        .button:hover { background-color: #333333; transform: translateY(-2px); }
        .footer { background-color: #FFFFFF; padding: 30px 40px; text-align: center; border-top: 1px solid #F0F0F0; }
        .footer p { font-size: 13px; color: #999999; margin: 5px 0; line-height: 1.5; }
        .footer a { color: #999999; text-decoration: underline; }
        .social-icons { margin-bottom: 15px; font-size: 20px; opacity: 0.6; letter-spacing: 10px; }
        @media screen and (max-width: 600px) { .content, .header, .footer { padding: 30px 20px; } .email-container { width: 100% !important; border-radius: 0; } .email-wrapper { padding: 0; } }
    </style>
</head>
<body>
    <table role="presentation">
        <tr>
            <td align="center" class="email-wrapper">
                <div class="email-container">
                    <div class="header" style="font-size: 22px; font-weight: bold; color: #111; letter-spacing: 1px; text-align: center; padding-top: 30px; padding-bottom: 20px;">
                      Bora Correr Club
                    </div>
                    <div class="hero-image">
                        <img src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHQzbzlqNHFkNjdhdDIzanY2bTR3Y3Y3aDdtdjZlOWRjcTJ3Mmt0YyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3UkqVq3F50bVCi9URl/giphy.gif" alt="Meme Welcome Brooklyn 99" width="100%">
                    </div>
                    <div class="content">
                        <h1>Bem-vindo ao Clube! 👊</h1>
                        <p>Fala, <strong>${customerName}</strong>!</p>
                        <p>Agora é oficial: <strong>estamos fechados!</strong> Você acaba de entrar para a área exclusiva do <em>Bora Correr Club</em>.</p>
                        <p>Aqui não tem enrolação. Este é o seu QG para garantir a melhor roupa e treinos:</p>
                        <table class="features-table" role="presentation">
                            <tr>
                                <td class="feature-row"><span class="check-icon">👕</span> <strong>Camisetas Oficiais:</strong> Estilo e performance na pista.</td>
                            </tr>
                            <tr>
                                <td class="feature-row"><span class="check-icon">📅</span> <strong>Planos de Assinatura:</strong> Evolua com nossos treinos.</td>
                            </tr>
                            <tr>
                                <td class="feature-row"><span class="check-icon">🔥</span> <strong>Descontos Exclusivos:</strong> Só para quem é do Club.</td>
                            </tr>
                        </table>
                        <p>Dê uma olhada na loja agora e já garanta o seu kit de boas-vindas.</p>
                        <div class="button-container">
                          <a href="#" class="button">Ver Loja e Planos &rarr;</a>
                        </div>
                        ${confirmationButton}
                    </div>
                    <div class="footer">
                        <div class="social-icons">📷 🛒 🏃‍♂️</div>
                        <p><strong>Bora Correr Club</strong> • Vista a camisa.</p>
                        <p>Dúvidas sobre seu pedido ou plano? Responda este e-mail.</p>
                        <p><a href="#">Minha Conta</a> • <a href="#">Descadastrar</a></p>
                    </div>
                </div>
            </td>
        </tr>
    </table>
</body>
</html>
  `;
}

function generateRenewalEmail(data: SubscriptionEmailRequest): string {
  const customerName = data.customerName || "Atleta";
  const planName = data.planName || "Consultoria";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Assinatura Renovada</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: ${BRAND.dark};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${BRAND.dark}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: ${BRAND.darkLight}; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND.success} 0%, #059669 100%); padding: 40px 30px; text-align: center;">
              <div style="margin-bottom: 12px;">
                <span style="font-size: 40px;">✅</span>
              </div>
              <h1 style="color: ${BRAND.white}; margin: 0; font-size: 22px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                Assinatura Renovada!
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: ${BRAND.white}; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
                Olá, <strong style="color: ${BRAND.primary};">${customerName}</strong>! 💪
              </p>
              
              <p style="color: ${BRAND.white}; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
                Sua assinatura do plano <strong style="color: ${BRAND.primary};">${planName}</strong> foi renovada com sucesso! Continue evoluindo com a gente.
              </p>
              
              <div style="background: ${BRAND.success}15; border: 1px solid ${BRAND.success}30; padding: 20px; border-radius: 12px; margin: 24px 0; text-align: center;">
                <p style="margin: 0; color: ${BRAND.success}; font-weight: 600;">
                  🎯 Seu acesso ao método continua ativo!
                </p>
              </div>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://charm-creator-nest.lovable.app/minha-assinatura" 
                   style="display: inline-block; background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryDark} 100%); color: ${BRAND.white}; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                  Ver Minha Assinatura
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: ${BRAND.dark}; padding: 25px 30px; text-align: center; border-top: 1px solid #2A2A2A;">
              <p style="color: ${BRAND.gray}; font-size: 11px; margin: 0; letter-spacing: 0.5px;">
                © ${new Date().getFullYear()} BORA CORRER CLUB. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function generatePaymentInviteEmail(data: SubscriptionEmailRequest): string {
  const customerName = data.customerName || "Atleta";
  const planName = data.planName || "Especial";
  const amount = data.amount ? formatCurrency(data.amount) : "R$ 9,97";
  // @ts-ignore
  const paymentLink = (data as any).paymentLink;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Convite Especial</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: ${BRAND.dark};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${BRAND.dark}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: ${BRAND.darkLight}; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryDark} 100%); padding: 40px 30px; text-align: center;">
              <div style="margin-bottom: 12px;">
                <span style="font-size: 40px;">🎟️</span>
              </div>
              <h1 style="color: ${BRAND.white}; margin: 0; font-size: 22px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                Convite Exclusivo
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: ${BRAND.white}; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
                Opa, <strong style="color: ${BRAND.primary};">${customerName}</strong>! 👋
              </p>
              
              <p style="color: ${BRAND.white}; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
                Preparamos tudo para você começar a treinar com a gente. Aqui está o seu link direto para ativar o plano <strong style="color: ${BRAND.primary};">${planName}</strong>.
              </p>

              <div style="background-color: ${BRAND.dark}; padding: 20px; border-radius: 12px; margin: 25px 0; border: 1px solid #333;">
                <p style="color: ${BRAND.gray}; font-size: 13px; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 1px;">Valor do Investimento</p>
                <p style="color: ${BRAND.white}; font-size: 24px; font-weight: 700; margin: 0;">${amount} <span style="font-size: 14px; font-weight: 400; color: ${BRAND.gray};">/mês</span></p>
              </div>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${paymentLink}" 
                   style="display: inline-block; background: linear-gradient(135deg, ${BRAND.success} 0%, #16a34a 100%); color: ${BRAND.white}; text-decoration: none; padding: 18px 40px; border-radius: 50px; font-weight: 700; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3);">
                  Garanta Sua Vaga Agora &rarr;
                </a>
              </div>
              
              <p style="color: ${BRAND.gray}; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0; text-align: center;">
                Se o botão não funcionar, acesse: <br/>
                <a href="${paymentLink}" style="color: ${BRAND.primary}; word-break: break-all;">${paymentLink}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: ${BRAND.dark}; padding: 25px 30px; text-align: center; border-top: 1px solid #2A2A2A;">
              <p style="color: ${BRAND.gray}; font-size: 11px; margin: 0; letter-spacing: 0.5px;">
                © ${new Date().getFullYear()} BORA CORRER CLUB. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: SubscriptionEmailRequest = await req.json();
    logStep("Processing email request", { type: data.type, email: data.email });

    if (!data.email || !data.type) {
      throw new Error("Email and type are required");
    }

    let subject: string;
    let html: string;

    switch (data.type) {
      case "payment_failed":
        subject = "⚠️ Bora Correr Club - Problema com seu pagamento";
        html = generatePaymentFailedEmail(data);
        break;
      case "subscription_canceled":
        subject = "Bora Correr Club - Confirmação de cancelamento";
        html = generateSubscriptionCanceledEmail(data);
        break;
      case "welcome":
        subject = "🏃 Bem-vindo ao Bora Correr Club!";

        // Se não houver link de confirmação, tentar gerar um
        if (!data.confirmationLink && supabaseAdmin) {
          logStep("Generating confirmation link for", data.email);
          const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: "signup",
            email: data.email,
            options: {
              redirectTo: `${req.headers.get("origin") || "https://boracorrerclub.com.br"}/confirmado`,
            },
          });

          if (linkError) {
            logStep("Error generating link", linkError);
          } else {
            data.confirmationLink = linkData.properties.action_link;
            logStep("Link generated successfully");
          }
        }

        html = generateWelcomeEmail(data);
        break;
      case "subscription_renewed":
        subject = "✅ Bora Correr Club - Assinatura renovada com sucesso";
        html = generateRenewalEmail(data);
        break;
      case "payment_invite":
        subject = "🎟️ Convite Especial - Bora Correr Club";
        html = generatePaymentInviteEmail(data);
        break;
      default:
        throw new Error(`Unknown email type: ${data.type}`);
    }

    const emailResponse = await resend.emails.send({
      from: "Bora Correr Club <pedidos@boracorrerclub.com.br>",
      to: [data.email],
      subject,
      html,
    });

    // Enviar cópia para o admin
    if (
      data.type === "welcome" ||
      data.type === "subscription_renewed" ||
      data.type === "payment_failed"
    ) {
      await resend.emails.send({
        from: "Bora Correr Club <pedidos@boracorrerclub.com.br>",
        to: ["boracorrerclub@gmail.com"],
        subject: `[ADMIN] ${subject} - ${data.email}`,
        html: html, // Usando o mesmo HTML por enquanto
      });
      logStep("Admin notification sent");
    }

    logStep("Email sent successfully", { response: emailResponse });

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("Error sending email", { error: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
