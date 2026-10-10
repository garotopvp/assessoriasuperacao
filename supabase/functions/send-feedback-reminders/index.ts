import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { format, startOfWeek } from "https://esm.sh/date-fns@2.30.0";
import { ptBR } from "https://esm.sh/date-fns@2.30.0/locale";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const ZAPI_URL = Deno.env.get("ZAPI_URL");
    const ZAPI_CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN");

    const logSystemEvent = async (
      action: string,
      level: string,
      message: string,
      details: any = {}
    ) => {
      try {
        await supabaseClient.from("system_logs").insert({
          action,
          category: "notification",
          level,
          message,
          details,
        });
      } catch (e) {
        console.error("Failed to insert system log:", e);
      }
    };

    console.log("Checking pending feedbacks...");
    await logSystemEvent(
      "start_feedback_reminders",
      "info",
      "Iniciando verificação e envio de feedbacks pendentes",
      {
        time: new Date().toISOString(),
      }
    );

    // 1. Get current week start (Monday)
    const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekStartStr = format(currentWeekStart, "yyyy-MM-dd");

    // 2. Get all students (not admin) and filter out CANCELED ones
    const { data: profiles, error: profilesError } = await supabaseClient
      .from("profiles")
      .select(
        `
                user_id, 
                nome_completo, 
                email, 
                telefone,
                recurring_subscriptions!inner (status)
            `
      )
      .eq("is_admin", false)
      .neq("recurring_subscriptions.status", "canceled");

    if (profilesError) throw profilesError;

    // 3. Get feedbacks submitted THIS week
    const { data: feedbacks, error: feedbacksError } = await supabaseClient
      .from("weekly_feedbacks")
      .select("user_id")
      .gte("week_start_date", weekStartStr);

    if (feedbacksError) throw feedbacksError;

    let pendingStudents = [];
    const {
      testEmail,
      userIds,
      channels = ["email", "whatsapp"],
    } = await req.json().catch(() => ({}));

    if (testEmail) {
      console.log(`Sending test email to ${testEmail}`);
      const emails = testEmail.split(",").map((e) => e.trim());
      pendingStudents = emails.map((email) => ({
        user_id: "test-user",
        nome_completo: "Atleta",
        email: email,
      }));
    } else {
      // 4. Identify pending students
      const submittedUserIds = new Set(feedbacks?.map((f) => f.user_id));
      pendingStudents = profiles?.filter((profile) => !submittedUserIds.has(profile.user_id)) || [];

      // If specific userIds are provided, filter to those
      if (userIds && Array.isArray(userIds)) {
        pendingStudents = pendingStudents.filter((student) => userIds.includes(student.user_id));
        console.log(
          `Targeted sending to ${pendingStudents.length} students based on provided userIds.`
        );
      } else {
        console.log(
          `Found ${pendingStudents.length} pending feedbacks out of ${profiles?.length} students.`
        );
      }
    }

    if (channels.includes("whatsapp")) {
      console.log(
        `WhatsApp channel requested. ZAPI_URL: ${ZAPI_URL ? "configured" : "MISSING"}, ZAPI_TOKEN: ${ZAPI_CLIENT_TOKEN ? "configured" : "MISSING"}`
      );
    }

    const results = [];

    // 5. Send reminders
    for (const student of pendingStudents) {
      const firstName = student.nome_completo?.split(" ")[0] || "Atleta";
      const result: any = { user_id: student.user_id, email: student.email };

      // 5.1 Enviar Email - DESATIVADO POR SOLICITAÇÃO (Apenas WPP)
      // if (student.email && channels.includes("email")) { ... }

      // 5.2 Enviar WhatsApp via Z-API
      if (channels.includes("whatsapp")) {
        if (!ZAPI_URL || !ZAPI_CLIENT_TOKEN) {
          result.whatsapp_error = "Z-API credentials not configured in environment";
        } else if (student.user_id) {
          try {
            let skip = false;
            let currentCount = 0;

            // Bypass anti-spam if userIds were specifically provided (manual trigger)
            const isManualTrigger =
              userIds && Array.isArray(userIds) && userIds.includes(student.user_id);

            if (!testEmail && student.user_id !== "test-user") {
              const { count, error: countError } = await supabaseClient
                .from("feedback_reminders_log")
                .select("id", { count: "exact", head: true })
                .eq("user_id", student.user_id)
                .eq("channel", "whatsapp")
                .eq("week_start_date", weekStartStr);

              if (!countError && count !== null) {
                currentCount = count;
              }

              // LIMITAÇÃO: Apenas 1 lembrete por semana (Sábado)
              // Se já tiver enviado 1 ou mais vezes na semana, pula.
              if (!isManualTrigger && currentCount >= 1) {
                console.log(
                  `Skipping WhatsApp for ${student.user_id} - already sent reminder this week`
                );
                result.whatsapp_skipped = true;
                skip = true;
              }
            }

            if (!skip) {
              const telefone = student.telefone;
              if (telefone) {
                const cleanPhone = telefone.replace(/\D/g, "");
                const formattedPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;

                // MENSAGEM ÚNICA (Padrão de Sábado)
                const gifUrl = "https://i.giphy.com/media/I7x42QTuanC8BZBKuB/giphy.mp4";
                const finalMsg = `Fala, ${firstName}! 🏃‍♂️\n\nPassando para lembrar do seu *Feedback Semanal*.\n\nSua opinião é fundamental para o professor ajustar seus treinos da próxima semana! 🎯\n\n🔗 Clique aqui: https://boracorrerclub.com.br/feedback\n\nBora pra cima! 🚀`;

                const adminToken = Deno.env.get("ZAPI_ADMIN_TOKEN");
                const clientToken = ZAPI_CLIENT_TOKEN;

                // Enviar como GIF animado (requer endpoint send-gif e arquivo mp4)
                const waResponse = await fetch(`${ZAPI_URL}/token/${clientToken}/send-gif`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Client-Token": adminToken || clientToken,
                  },
                  body: JSON.stringify({
                    phone: formattedPhone,
                    gif: gifUrl,
                    caption: finalMsg,
                  }),
                });

                const waResult = await waResponse
                  .json()
                  .catch(() => ({ error: "Failed to parse Z-API response" }));

                result.whatsapp_sent = waResponse.ok;
                result.zapi_response = waResult;

                if (waResponse.ok && !testEmail && student.user_id !== "test-user") {
                  await supabaseClient.from("feedback_reminders_log").insert({
                    user_id: student.user_id,
                    email: student.email || "",
                    week_start_date: weekStartStr,
                    channel: "whatsapp",
                    sent_at: new Date().toISOString(),
                  });
                  await logSystemEvent(
                    "send_whatsapp_success",
                    "info",
                    `Mensagem de feedback enviada pelo WhatsApp para ${firstName}`,
                    {
                      user_id: student.user_id,
                      phone: formattedPhone,
                      zapi_response: waResult,
                    }
                  );
                } else if (!waResponse.ok) {
                  await logSystemEvent(
                    "send_whatsapp_error",
                    "error",
                    `Erro ao enviar retorno do WhatsApp para ${firstName}`,
                    {
                      user_id: student.user_id,
                      phone: formattedPhone,
                      error: waResult,
                    }
                  );
                }

                // Delay de segurança
                await new Promise((resolve) => setTimeout(resolve, 800));
              } else {
                result.whatsapp_error = "No phone number found for student";
              }
            }
          } catch (err) {
            console.error(`Error sending WhatsApp to ${student.user_id}:`, err);
            result.whatsapp_error = err.message;
            await logSystemEvent(
              "send_whatsapp_exception",
              "error",
              `Exceção ao enviar WhatsApp para ${student.user_id}`,
              {
                user_id: student.user_id,
                error: err.message,
              }
            );
          }
        }
      }

      results.push(result);
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_pending: pendingStudents.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-feedback-reminders:", error);

    // At this level, supabaseClient might not be initialized if Env is failing, but we try if it exists
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
