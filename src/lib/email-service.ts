import { logger } from "@/lib/logger";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private readonly RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;

  /**
   * Envia email de boas-vindas para novos usuários
   */
  async sendWelcomeEmail(userEmail: string, userName: string) {
    const template: EmailTemplate = {
      to: userEmail,
      subject: "🏃 Bem-vindo ao Superação Assessoria!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981;">Bem-vindo ao Superação Assessoria, ${userName}!</h1>
          <p>Estamos muito felizes em ter você conosco!</p>
          <p>Aqui no Superação Assessoria, você terá acesso a:</p>
          <ul>
            <li>Conteúdo exclusivo sobre técnicas de corrida</li>
            <li>Consultoria especializada</li>
            <li>Produtos de alta qualidade</li>
            <li>Comunidade engajada de corredores</li>
          </ul>
          <p>Para começar, acesse sua conta e explore tudo que preparamos para você!</p>
          <a href="${window.location.origin}/login" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
            Acessar Minha Conta
          </a>
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            Bons treinos!<br/>
            Equipe Superação Assessoria
          </p>
        </div>
      `,
    };

    return this.sendEmail(template);
  }

  /**
   * Envia alerta de assinatura próxima ao vencimento
   */
  async sendSubscriptionExpiringEmail(userEmail: string, userName: string, expirationDate: Date) {
    const daysUntilExpiration = Math.ceil(
      (expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    const template: EmailTemplate = {
      to: userEmail,
      subject: "⚠️ Sua assinatura está próxima do vencimento",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f59e0b;">Atenção, ${userName}!</h1>
          <p>Sua assinatura do Superação Assessoria vence em <strong>${daysUntilExpiration} dias</strong>.</p>
          <p>Não perca o acesso a todo o conteúdo exclusivo que você ama!</p>
          <p>Renove agora e continue aproveitando:</p>
          <ul>
            <li>Todos os artigos e vídeos exclusivos</li>
            <li>Acesso à comunidade premium</li>
            <li>Descontos em produtos</li>
            <li>Consultoria especializada</li>
          </ul>
          <a href="${window.location.origin}/perfil" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
            Renovar Assinatura
          </a>
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            Equipe Superação Assessoria
          </p>
        </div>
      `,
    };

    return this.sendEmail(template);
  }

  /**
   * Envia notificação de falha no pagamento
   */
  async sendPaymentFailedEmail(userEmail: string, userName: string) {
    const template: EmailTemplate = {
      to: userEmail,
      subject: "❌ Problema com seu pagamento",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ef4444;">Ops! Tivemos um problema, ${userName}</h1>
          <p>Não conseguimos processar seu pagamento.</p>
          <p>Isso pode ter acontecido por diversos motivos:</p>
          <ul>
            <li>Cartão com saldo insuficiente</li>
            <li>Dados de pagamento desatualizados</li>
            <li>Problema temporário com a operadora</li>
          </ul>
          <p>Para continuar aproveitando todos os benefícios do Superação Assessoria, atualize seus dados de pagamento:</p>
          <a href="${window.location.origin}/perfil" style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
            Atualizar Forma de Pagamento
          </a>
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            Se precisar de ajuda, estamos aqui!<br/>
            Equipe Superação Assessoria
          </p>
        </div>
      `,
    };

    return this.sendEmail(template);
  }

  /**
   * Envia notificação de conta bloqueada
   */
  async sendAccountBlockedEmail(userEmail: string, userName: string, reason: string) {
    const template: EmailTemplate = {
      to: userEmail,
      subject: "🔒 Sua conta foi temporariamente bloqueada",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ef4444;">Conta Bloqueada</h1>
          <p>Olá, ${userName}.</p>
          <p>Sua conta foi temporariamente bloqueada pelo seguinte motivo:</p>
          <p style="background: #fee2e2; padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0;">
            <strong>${reason}</strong>
          </p>
          <p>Para resolver esta situação, entre em contato conosco:</p>
          <ul>
            <li>Email: contato@superacaoassessoria.com</li>
            <li>WhatsApp: (11) 99999-9999</li>
          </ul>
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            Equipe Superação Assessoria
          </p>
        </div>
      `,
    };

    return this.sendEmail(template);
  }

  /**
   * Envia confirmação de pedido
   */
  async sendOrderConfirmationEmail(
    userEmail: string,
    userName: string,
    orderNumber: string,
    totalAmount: number
  ) {
    const template: EmailTemplate = {
      to: userEmail,
      subject: `✅ Pedido #${orderNumber} confirmado!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981;">Pedido Confirmado!</h1>
          <p>Olá, ${userName}!</p>
          <p>Seu pedido <strong>#${orderNumber}</strong> foi confirmado com sucesso!</p>
          <p style="font-size: 24px; font-weight: bold; color: #10b981; margin: 20px 0;">
            Total: R$ ${(totalAmount / 100).toFixed(2)}
          </p>
          <p>Você pode acompanhar o status do seu pedido na sua conta:</p>
          <a href="${window.location.origin}/perfil" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
            Ver Meus Pedidos
          </a>
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            Obrigado pela sua compra!<br/>
            Equipe Superação Assessoria
          </p>
        </div>
      `,
    };

    return this.sendEmail(template);
  }

  /**
   * Método genérico para enviar emails via Edge Function
   */
  private async sendEmail(template: EmailTemplate) {
    try {
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: template,
      });

      if (error) {
        logger.error("Error sending email:", error);
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      logger.error("Exception sending email:", error);
      toast.error("Erro ao enviar email");
      return { success: false, error };
    }
  }
}

export const emailService = new EmailService();
