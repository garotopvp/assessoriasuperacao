import { supabase } from "@/integrations/supabase/client";

type LogLevel = "info" | "warning" | "error";
type LogCategory =
  | "system"
  | "user_action"
  | "edge_function"
  | "payment"
  | "notification"
  | "webhook";

interface SystemLogParams {
  action: string;
  category: LogCategory | string;
  level?: LogLevel;
  message: string;
  details?: any;
}

/**
 * Cria um log no sistema para manter o Audit Trail.
 * Utilizado por ações no painel admin ou no cliente autenticado.
 */
export async function createSystemLog({
  action,
  category,
  level = "info",
  message,
  details = {},
}: SystemLogParams) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("system_logs").insert({
      action,
      category,
      level,
      message,
      details,
      user_id: user?.id || null, // Vazia caso não tenha usuário logado
    });

    if (error) {
      console.error("[SystemLogger] Falha ao salvar log: ", error);
    }

    // Se for um erro crítico, alerta via WhatsApp ao Administrador
    // Usamos o edge function separado 'notify-system-alerts' "sirene".
    if (level === "error") {
      try {
        await supabase.functions.invoke("notify-system-alerts", {
          body: { action, category, message, details },
        });
      } catch (alertError) {
        console.error("[SystemLogger] Falha ao enviar SMS/WPP de alerta:", alertError);
      }
    }

    // Alerta de EMAIL e PUSH PushNotifications/Email Alerts -> Pagamentos Novos ou Novos Usuários
    if (category === "payment" || category === "user_action" || level === "error") {
       try {
         // Disparo via Email com Resend usando o edge function
         await supabase.functions.invoke("push-alert-email", {
           body: { action, category, message, details },
         });
       } catch (emailError) {
         console.error("[SystemLogger] Falha ao enviar email do log:", emailError);
       }
    }
  } catch (err) {
    console.error("[SystemLogger] Erro inesperado ao salvar log: ", err);
  }
}
