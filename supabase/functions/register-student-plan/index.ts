import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RegisterPlanRequest {
  userId?: string;
  planId: string;
  planName?: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
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

    const { userId, planId, planName, studentName, studentEmail, studentPhone } =
      (await req.json()) as RegisterPlanRequest;

    if (!studentEmail) {
      return new Response(JSON.stringify({ error: "Email é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let targetUser;

    if (userId) {
      console.log(`Usando ID fornecido: ${userId}`);
      targetUser = { id: userId, email: studentEmail };
    } else {
      console.log(`Buscando usuário: ${studentEmail}`);

      // Buscar usuário pelo email (Legacy method - keep as fallback)
      const { data: usersResponse } = await supabaseClient.auth.admin.listUsers();
      targetUser = usersResponse?.users?.find(
        (u: any) => u.email?.toLowerCase() === studentEmail.toLowerCase()
      );

      console.log("Usuários encontrados:", usersResponse?.users?.length);
      console.log("Usuário encontrado na lista:", targetUser ? "Sim" : "Não");

      // Fallback: buscar na tabela profiles
      if (!targetUser) {
        console.log("Tentando buscar na tabela profiles...");
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("user_id")
          .eq("email", studentEmail)
          .single();

        console.log("Profile encontrado:", profile);

        if (profile) {
          targetUser = { id: profile.user_id, email: studentEmail };
        }
      }
    }

    if (!targetUser) {
      console.error("Usuário não encontrado:", studentEmail);
      return new Response(
        JSON.stringify({
          error: "Usuário não encontrado. Aguarde alguns segundos e tente novamente.",
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Registrando assinatura para ${targetUser.id}`);

    // Criar assinatura
    const { data: subscription, error: subError } = await supabaseClient
      .from("recurring_subscriptions")
      .insert({
        user_id: targetUser.id,
        student_name: studentName,
        student_email: studentEmail,
        student_phone: studentPhone,
        plan_id: planId,
        plan_name: planName || "Plano Selecionado",
        amount: 0,
        status: "waiting_details",
        next_billing_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (subError) {
      console.error("Erro ao inserir assinatura:", subError);
      throw subError;
    }

    console.log("Assinatura criada com sucesso:", subscription);

    // Enviar email de boas-vindas
    const origin = req.headers.get("origin") || "";
    const confirmationLink = origin ? `${origin}/login` : "https://boracorrerclub.vercel.app/login";

    console.log("Enviando email de boas-vindas...");
    const { error: emailError } = await supabaseClient.functions.invoke("send-subscription-email", {
      body: {
        type: "welcome",
        email: studentEmail,
        customerName: studentName,
        confirmationLink: confirmationLink,
      },
    });

    if (emailError) {
      console.error("Erro ao enviar email:", emailError);
    }

    return new Response(JSON.stringify({ success: true, subscription, user_id: targetUser.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Erro geral na função:", error);
    const errorMessage = error?.message || String(error) || "Erro desconhecido";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
