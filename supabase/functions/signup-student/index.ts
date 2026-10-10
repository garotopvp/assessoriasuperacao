import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SignupRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
  cpf: string;
  planId: string;
  planName: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { email, password, name, phone, cpf, planId, planName } =
      (await req.json()) as SignupRequest;

    if (!email || !password || !name) {
      return new Response(JSON.stringify({ error: "Email, senha e nome são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processando cadastro para: ${email}`);

    let userId: string;

    // 1. Tentar criar usuário ou recuperar existente
    const { data: userData, error: userError } = await supabaseClient.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        phone: phone,
        cpf: cpf,
        terms_accepted: true,
        terms_accepted_at: new Date().toISOString(),
      },
    });

    if (userError) {
      // Se usuário já existe, tentamos recuperar o ID para prosseguir (sem falhar)
      // Mensagem típica: "User already registered"
      if (userError.message && userError.message.includes("already registered")) {
        console.log("Usuário já existe. Recuperando dados...");
        // Buscar usuário para pegar ID
        // Nota: listUsers não filtra por email server-side eficientemente em versões antigas, mas ok aqui
        const { data: listData } = await supabaseClient.auth.admin.listUsers();
        const existingUser = listData?.users.find(
          (u) => u.email?.toLowerCase() === email.toLowerCase()
        );

        if (existingUser) {
          userId = existingUser.id;
          console.log("ID recuperado:", userId);

          // Atualizar senha se necessário? Não, segurança.
          // Atualizar metadados? Sim, pode ser útil.
          await supabaseClient.auth.admin.updateUserById(userId, {
            user_metadata: {
              full_name: name,
              phone: phone,
              cpf: cpf,
              terms_accepted: true,
              // terms_accepted_at: new Date().toISOString() // manter original?
            },
          });
        } else {
          // Erro real, não achou
          throw userError;
        }
      } else {
        console.error("Erro ao criar usuário:", userError);
        throw userError;
      }
    } else {
      userId = userData.user.id;
      console.log(`Novo usuário criado com ID: ${userId}`);
    }

    if (!userId) {
      throw new Error("Falha ao identificar usuário ID.");
    }

    // 2. Atualizar perfil (garantia)
    const { error: profileError } = await supabaseClient
      .from("profiles")
      .update({
        nome_completo: name,
        telefone: phone,
        cpf: cpf,
        terms_accepted_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (profileError) {
      console.error("Erro ao atualizar perfil:", profileError);
    }

    // 3. Gerenciar Assinatura (Criar ou Atualizar se 'waiting_details')
    // Verificar se já existe assinatura para este email (usando constraint UNIQUE que adicionamos)
    const { data: existingSub, error: fetchSubError } = await supabaseClient
      .from("recurring_subscriptions")
      .select("*")
      .eq("student_email", email)
      .maybeSingle();

    if (existingSub) {
      console.log("Assinatura já existe:", existingSub.id, "Status:", existingSub.status);

      // Regra: Se está 'waiting_details', podemos atualizar o plano/status com o novo pedido.
      // Se está 'active', NÃO mexemos (para não sobrescrever plano pago).

      if (existingSub.status === "waiting_details" || existingSub.status === null) {
        let newStatus = "waiting_details";
        if (planId === "parceria") newStatus = "partnership";
        else if (planId === "plano_teste") newStatus = "active";

        await supabaseClient
          .from("recurring_subscriptions")
          .update({
            plan_id: planId,
            plan_name: planName || "Plano Selecionado",
            status: newStatus,
            // Mantém next_billing_date original ou atualiza?
            // Se mudou o plano, talvez resetar billing date?
            // Simplificando: manter original se não for active.
          })
          .eq("id", existingSub.id);

        console.log("Assinatura existente atualizada para novo plano/status.");
      } else {
        console.log("Assinatura já ativa. Ignorando atualização de plano.");
      }
    } else {
      // Criar nova assinatura
      let initialStatus = "waiting_details";
      let initialAmount = 0;

      if (planId === "parceria") {
        initialStatus = "partnership";
      } else if (planId === "plano_teste") {
        initialStatus = "active"; // Plano de teste já nasce ativo
      }

      const { data: subscription, error: subError } = await supabaseClient
        .from("recurring_subscriptions")
        .insert({
          user_id: userId,
          student_name: name,
          student_email: email,
          student_phone: phone,
          plan_id: planId,
          plan_name: planName || "Plano Selecionado",
          amount: initialAmount,
          status: initialStatus,
          next_billing_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (subError) {
        console.error("Erro ao criar assinatura:", subError);
        // Se erro for constraint violation (race condition), ignoramos
        if (subError.code === "23505") {
          // unique_violation
          console.log("Violação de unicidade capturada, ignorando.");
        } else {
          // Retornar sucesso parcial, mas avisar
        }
      } else {
        console.log("Assinatura criada:", subscription);
      }
    }

    // 4. Enviar email de boas-vindas (apenas se for NOVO usuário ou se mudou dados? Sempre enviar para confirmar)
    // Sendo idempotente, enviar email pode ser irritante se retentar.
    // Vamos enviar apenas se created_at for recente?
    // Ou simplesmente enviar. Mal não faz.
    await supabaseClient.functions.invoke("send-subscription-email", {
      body: {
        type: "welcome",
        email: email,
        customerName: name,
        confirmationLink: `${req.headers.get("origin") || "https://boracorrerclub.vercel.app"}/login`,
      },
    });

    return new Response(
      JSON.stringify({ success: true, userId: userId, message: "Cadastro processado com sucesso" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Erro geral:", error);
    return new Response(JSON.stringify({ error: error.message || "Erro interno no servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
