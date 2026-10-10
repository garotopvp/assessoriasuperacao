import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ZAPI_URL = Deno.env.get("ZAPI_URL") || "";
const ZAPI_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN") || "";
const ZAPI_ADMIN_TOKEN = Deno.env.get("ZAPI_ADMIN_TOKEN") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    console.log("🕒 Iniciando processamento de follow-ups...");

    // --- GATILHOS DIÁRIOS (08H DA MANHÃ) ---
    if (now.getHours() === 8) {
      const todayStr = now.toISOString().split("T")[0];
      const dayMonth = todayStr.slice(5); // MM-DD

      // 1. ANIVERSARIANTES DO DIA
      const { data: bdays } = await supabase
        .from("profiles")
        .select("nome_completo, telefone")
        .filter("data_nascimento", "cs", `*-${dayMonth}`); // Busca simplificada MM-DD

      if (bdays?.length) {
        for (const b of bdays) {
          const msg = `🎉 *FELIZ ANIVERSÁRIO!* 🎂 \n\nParabéns, ${b.nome_completo.split(" ")[0]}! Desejamos muita saúde, quilômetros de felicidade e muita corrida na sua vida. \n\nComo presente do Bora Correr Club, você ganhou 10% de desconto em qualquer item da nossa loja este mês! Use o código: *NIVER10* 🎁`;
          await fetch(`${ZAPI_URL}/token/${ZAPI_TOKEN}/send-text`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Client-Token": ZAPI_ADMIN_TOKEN || ZAPI_TOKEN,
            },
            body: JSON.stringify({ phone: b.telefone, message: msg }),
          });
        }
      }

      // 2. RENOVAÇÃO DE PLANOS (7 DIAS ANTES)
      const in7Days = new Date();
      in7Days.setDate(now.getDate() + 7);
      const in7DaysStr = in7Days.toISOString().split("T")[0];

      const { data: renewals } = await supabase
        .from("recurring_subscriptions")
        .select("*")
        .eq("next_billing_date", in7DaysStr)
        .eq("status", "active");

      if (renewals?.length) {
        for (const r of renewals) {
          const msg = `⏳ *AVISO DE RENOVAÇÃO* \n\nOi, ${r.student_name.split(" ")[0]}! Passando para avisar que seu plano vence em 7 dias (dia ${in7Days.toLocaleDateString("pt-BR")}). \n\nPara garantir que seu acesso e planilha não sejam interrompidos, você pode antecipar sua renovação aqui: https://www.boracorrerclub.com.br/admin \n\nBora continuar focado! 🚀`;
          await fetch(`${ZAPI_URL}/token/${ZAPI_TOKEN}/send-text`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Client-Token": ZAPI_ADMIN_TOKEN || ZAPI_TOKEN,
            },
            body: JSON.stringify({ phone: r.student_phone, message: msg }),
          });
        }
      }
    }

    // --- ALERTA METEOROLÓGICO (6H E 18H NOS DIAS DE TREINO) ---
    const isTrainingDay = [2, 4, 6].includes(now.getDay()); // Ter, Qui, Sáb
    if (isTrainingDay && (now.getHours() === 6 || now.getHours() === 18) && now.getMinutes() < 15) {
      try {
        const weatherRes = await fetch("https://wttr.in/Vila+Velha?format=%C+%t");
        const weatherInfo = await weatherRes.text();

        const msg = `🌦️ *ALERTA METEO BCC:* \nPrevisão para agora em Vila Velha: *${weatherInfo}*. \n\nLembrando que nossos treinos acontecem mesmo com chuva (exceto raios). Nos vemos na Praça! 🏃‍♂️💨`;

        // Buscar todos os alunos ativos para broadcast (simplificado)
        const { data: students } = await supabase
          .from("profiles")
          .select("telefone")
          .eq("subscription_status", "active");
        if (students?.length) {
          for (const s of students) {
            await fetch(`${ZAPI_URL}/token/${ZAPI_TOKEN}/send-text`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Client-Token": ZAPI_ADMIN_TOKEN || ZAPI_TOKEN,
              },
              body: JSON.stringify({ phone: s.telefone, message: msg }),
            });
          }
        }
      } catch (wErr) {
        console.error("Erro ao buscar clima:", wErr);
      }
    }

    // --- GATILHO: CHECK-UP DE SAÚDE (DOMINGO ÀS 09H) ---
    if (now.getDay() === 0 && now.getHours() === 9) {
      // Verificar se já agendamos hoje (para não duplicar a cada 15 min nas 9h)
      const todayStr = now.toISOString().split("T")[0];
      const { data: alreadyScheduled } = await supabase
        .from("follow_ups")
        .select("id")
        .eq("type", "HEALTH_CHECK")
        .gte("created_at", todayStr)
        .limit(1);

      if (!alreadyScheduled?.length) {
        console.log("📅 Domingo 09h: Agendando Check-up de Saúde para todos...");
        // Buscar sessões ativas ou recentes (últimos 30 dias)
        const { data: recentSessions } = await supabase
          .from("support_sessions")
          .select("id, student_phone")
          .neq("status", "CLOSED")
          .gte(
            "last_interaction",
            new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
          );

        if (recentSessions?.length) {
          const healthFollowUps = recentSessions.map((s) => ({
            session_id: s.id,
            student_phone: s.student_phone,
            type: "HEALTH_CHECK",
            scheduled_for: now.toISOString(),
            status: "PENDING",
          }));
          await supabase.from("follow_ups").insert(healthFollowUps);
        }
      }
    }

    // Buscar follow_ups pendentes que já passaram do horário
    const { data: pending, error } = await supabase
      .from("follow_ups")
      .select("*, session:session_id(*)")
      .eq("status", "PENDING")
      .lte("scheduled_for", new Date().toISOString());

    if (error) {
      console.error("❌ Erro ao buscar follow-ups:", error);
      throw error;
    }

    if (!pending || pending.length === 0) {
      console.log("ℹ️ Nenhum follow-up pendente para agora.");
      return new Response("No pending follow-ups", { status: 200 });
    }

    console.log(`📦 Encontrados ${pending.length} follow-ups para processar.`);

    for (const item of pending) {
      try {
        if (item.type === "TRIAL_NPS") {
          const message = `Olá! 👋 Vi aqui que sua aula experimental na Praça em frente a Moby Dick foi hoje. \n\nDe 0 a 10, como foi sua experiência com a nossa equipe? \n\nSua resposta nos ajuda muito a melhorar! 💙`;

          console.log(`📤 Enviando NPS para ${item.student_phone}...`);

          // Enviar via Zapi
          const zapiRes = await fetch(`${ZAPI_URL}/token/${ZAPI_TOKEN}/send-text`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Client-Token": ZAPI_ADMIN_TOKEN || ZAPI_TOKEN,
            },
            body: JSON.stringify({ phone: item.student_phone, message }),
          });

          if (!zapiRes.ok) throw new Error("Erro Zapi");

          await supabase
            .from("support_sessions")
            .update({ status: "WAITING_NPS" })
            .eq("id", item.session_id);
          await supabase.from("follow_ups").update({ status: "COMPLETED" }).eq("id", item.id);
        } else if (item.type === "ABANDONED_CART") {
          const message = `Oi! 😊 Percebi que você não concluiu seu agendamento para a aula experimental. \n\nFicou com alguma dúvida sobre como funcionam os treinos na Praça? Estou aqui para ajudar! 🏃‍♂️`;

          await fetch(`${ZAPI_URL}/token/${ZAPI_TOKEN}/send-text`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Client-Token": ZAPI_ADMIN_TOKEN || ZAPI_TOKEN,
            },
            body: JSON.stringify({ phone: item.student_phone, message }),
          });

          await supabase.from("follow_ups").update({ status: "COMPLETED" }).eq("id", item.id);
        } else if (item.type === "HEALTH_CHECK") {
          const message = `Olá! 👋 Como foram os treinos da semana passada? \n\nPara que possamos ajustar seus treinos, por favor preencha o feedback semanal aqui: https://www.boracorrerclub.com.br/feedback \n\nAlém disso, sentiu alguma dor ou desconforto fora do normal? \n\n1️⃣ Tudo certo, sem dores!\n2️⃣ Senti um pouco de dor\n3️⃣ Estou com uma dor persistente`;

          await fetch(`${ZAPI_URL}/token/${ZAPI_TOKEN}/send-text`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Client-Token": ZAPI_ADMIN_TOKEN || ZAPI_TOKEN,
            },
            body: JSON.stringify({ phone: item.student_phone, message }),
          });

          await supabase
            .from("support_sessions")
            .update({ status: "WAITING_HEALTH_RESPONSE" })
            .eq("id", item.session_id);
          await supabase.from("follow_ups").update({ status: "COMPLETED" }).eq("id", item.id);
        } else if (item.type === "TRIAL_REMINDER_24H") {
          const message = `Oi! 🏃‍♂️ Passando para lembrar que amanhã é dia de seu treino experimental com a gente! \n\n📍 Local: Praça em frente a Moby Dick\n🗺️ Mapa: https://www.google.com/maps/place/Bora+Correr+Club/data=!4m2!3m1!1s0x0:0x258d6bc0ef2bd999?sa=X&ved=1t:2428&ictx=111\n\nJá separou o tênis? Te esperamos lá! 🚀`;

          await fetch(`${ZAPI_URL}/token/${ZAPI_TOKEN}/send-text`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Client-Token": ZAPI_ADMIN_TOKEN || ZAPI_TOKEN,
            },
            body: JSON.stringify({ phone: item.student_phone, message }),
          });

          await supabase.from("follow_ups").update({ status: "COMPLETED" }).eq("id", item.id);
        } else if (item.type === "TRIAL_REMINDER_1H") {
          const message = `Está chegando a hora! 🔥 Seu treino experimental começa em 1 hora. \n\n📍 Onde: Praça em frente a Moby Dick\n\nBora correr? Te vejo em breve! 🏃‍♂️💨`;

          await fetch(`${ZAPI_URL}/token/${ZAPI_TOKEN}/send-text`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Client-Token": ZAPI_ADMIN_TOKEN || ZAPI_TOKEN,
            },
            body: JSON.stringify({ phone: item.student_phone, message }),
          });

          await supabase.from("follow_ups").update({ status: "COMPLETED" }).eq("id", item.id);
        }
      } catch (itemError) {
        console.error(`❌ Erro no follow-up ${item.id}:`, itemError);
        await supabase
          .from("follow_ups")
          .update({
            status: "FAILED",
            data: { ...(item.data || {}), last_error: itemError.message },
          })
          .eq("id", item.id);
      }
    }

    return new Response(`Processed ${pending.length} follow-ups`, { status: 200 });
  } catch (err) {
    console.error("🚨 Erro fatal no processador de follow-ups:", err);
    return new Response(err.message, { status: 500 });
  }
});
