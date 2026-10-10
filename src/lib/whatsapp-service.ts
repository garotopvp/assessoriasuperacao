import { logger } from "@/lib/logger";

interface ZApiConfig {
  instanceId: string;
  token: string;
}

class WhatsAppService {
  private readonly baseUrl = import.meta.env.VITE_ZAPI_URL || "https://api.z-api.io/instances";

  /**
   * Envia uma mensagem de texto via Z-API
   */
  async sendText(phone: string, message: string) {
    if (!phone) {
      logger.error("WhatsAppService: Telefone não fornecido");
      return { success: false, error: "Telefone não fornecido" };
    }

    // Limpa o número (remove caracteres não numéricos)
    const cleanPhone = phone.replace(/\D/g, "");

    // Adiciona o DDI 55 se não tiver
    const formattedPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;

    try {
      const response = await fetch(`${this.baseUrl}/send-text`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Client-Token":
            import.meta.env.VITE_ZAPI_CLIENT_TOKEN || "F8a6bcfbdfe6c47c8aa89fa250b564bd0S",
        },
        body: JSON.stringify({
          phone: formattedPhone,
          message: message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error("WhatsAppService: Erro ao enviar mensagem", data);
        return { success: false, error: data };
      }

      logger.info("WhatsAppService: Mensagem enviada com sucesso", data);
      return { success: true, data };
    } catch (error) {
      logger.error("WhatsAppService: Exceção ao enviar mensagem", error);
      return { success: false, error };
    }
  }

  /**
   * Envia um link de pagamento/cobrança
   */
  async sendPaymentReminder(phone: string, userName: string, amount: number, paymentLink: string) {
    const message = `Olá ${userName}! 👋\n\nIdentificamos que sua mensalidade do *Superação Assessoria* está pendente.\n\n💰 Valor: *R$ ${(amount / 100).toFixed(2)}*\n🔗 Link para pagamento: ${paymentLink}\n\nSe precisar de ajuda, é só chamar! 🏃‍♂️🚀`;
    return this.sendText(phone, message);
  }

  /**
   * Envia aviso de feedback pendente
   */
  async sendFeedbackReminder(phone: string, userName: string) {
    const message = `Fala, ${userName}! 🏃‍♂️\n\nEstamos passando para lembrar do seu *Feedback Semanal*.\n\nSua opinião é fundamental para ajustarmos seus treinos da próxima semana! 🎯\n\nPreencha rapidinho aqui: https://superacaoassessoria.com/feedback\n\nSuperação! 🚀`;
    return this.sendText(phone, message);
  }
}

export const whatsappService = new WhatsAppService();
