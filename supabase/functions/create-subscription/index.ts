import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateSubscriptionRequest {
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  planId?: string;
  planName?: string;
  amount: number;
  userId?: string;
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

    const { studentName, studentEmail, studentPhone, planId, planName, amount, userId } =
      (await req.json()) as CreateSubscriptionRequest;

    // Validações
    if (!studentName || !studentEmail || !amount) {
      console.error("Dados obrigatórios faltando", { studentName, studentEmail, amount });
      return new Response(JSON.stringify({ error: "Dados obrigatórios faltando" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Buscar ou criar usuário pelo email
    let targetUserId = userId;

    // 1. Tenta buscar na profiles (Case insensitive)
    console.log("Verificando se usuário já existe na profiles (ilike):", studentEmail);
    const { data: existingUser, error: existingUserError } = await supabaseClient
      .from("profiles")
      .select("user_id")
      .ilike("email", studentEmail) // Case insensitive match
      .maybeSingle();

    if (existingUserError)
      console.error("Erro ao buscar usuário existente na profiles:", existingUserError);

    if (existingUser?.user_id) {
      targetUserId = existingUser.user_id;
      console.log("Usuário já existe na profiles:", targetUserId);
    } else {
      // 2. Tenta buscar no Auth (com paginação maior)
      console.log("Verificando se usuário já existe no Auth (perPage: 1000):", studentEmail);
      const { data: authUsers, error: authError } = await supabaseClient.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      if (authError) console.error("Erro ao buscar usuários no Auth:", authError);

      // Case insensitive search in auth users
      const foundAuthUser = authUsers?.users?.find(
        (u: any) => u.email?.toLowerCase() === studentEmail.toLowerCase()
      );

      if (foundAuthUser) {
        targetUserId = foundAuthUser.id;
        console.log("Usuário já existe no Auth:", targetUserId);
      } else {
        // 3. Cria novo usuário
        console.log("Criando novo usuário:", studentEmail);
        try {
          const { data: newUser, error: userError } = await supabaseClient.auth.admin.createUser({
            email: studentEmail,
            email_confirm: true,
            user_metadata: {
              full_name: studentName,
              phone: studentPhone,
            },
          });

          if (userError) throw userError;
          targetUserId = newUser.user.id;
          console.log("Novo usuário criado:", targetUserId);
        } catch (createUserError: any) {
          console.error("Erro ao criar usuário:", createUserError);
          // Se erro for de email duplicado e não achamos antes, é um estado inconsistente crítico
          // Mas podemos tentar uma ultima verificação ou apenas falhar com mensagem clara
          if (
            createUserError?.code === "email_exists" ||
            createUserError?.message?.includes("already been registered")
          ) {
            throw new Error(
              `Email ${studentEmail} já está registrado no Auth, mas não foi encontrado no perfil. Verifique o cadastro do usuário.`
            );
          }
          throw createUserError;
        }
      }
    }

    // 2. Criar assinatura recorrente
    const nextBillingDate = new Date();
    nextBillingDate.setDate(nextBillingDate.getDate() + 30);

    console.log("Criando assinatura recorrente para usuário:", targetUserId);
    const { data: subscription, error: subError } = await supabaseClient
      .from("recurring_subscriptions")
      .insert({
        user_id: targetUserId,
        student_name: studentName,
        student_email: studentEmail,
        student_phone: studentPhone,
        plan_id: planId,
        plan_name: planName,
        amount: amount,
        status: "active",
        next_billing_date: nextBillingDate.toISOString(),
      })
      .select()
      .single();

    if (subError) {
      console.error("Erro ao criar assinatura:", subError);
      throw subError;
    }
    console.log("Assinatura criada:", subscription);

    // 3. Gerar primeira fatura
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 5); // Vencimento em 5 dias

    console.log("Criando fatura para assinatura:", subscription.id);
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from("subscription_invoices")
      .insert({
        subscription_id: subscription.id,
        amount: amount,
        due_date: dueDate.toISOString(),
        status: "pending",
      })
      .select()
      .single();

    if (invoiceError) {
      console.error("Erro ao criar fatura:", invoiceError);
      throw invoiceError;
    }
    console.log("Fatura criada:", invoice);

    // 4. Gerar link de pagamento via Abacate Pay
    console.log("Chamando Abacate Pay para invoice:", invoice.id);
    const abacateResponse = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/create-pix-abacate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: req.headers.get("Authorization") || "",
        },
        body: JSON.stringify({
          items: [
            {
              name: planName || "Mensalidade",
              price: amount,
              quantity: 1,
            },
          ],
          customerEmail: studentEmail,
          customerName: studentName,
          customerPhone: studentPhone,
          userId: targetUserId,
          invoiceId: invoice.id, // Passar ID da fatura
          // Para planos customizados ou fixos, forçamos mensal se não for um plano específico do Abacate
          frequency: "MONTHLY",
          planId: planId === "custom" ? undefined : planId,
        }),
      }
    );

    let abacateData = {};
    try {
      abacateData = await abacateResponse.json();
    } catch (e) {
      console.error("Erro ao parsear resposta do Abacate Pay:", e);
    }
    console.log("Resposta Abacate Pay:", abacateData);

    if (!abacateResponse.ok) {
      console.error("Erro ao gerar link de pagamento:", abacateData.error || abacateData);
      throw new Error(abacateData.error || "Erro ao gerar link de pagamento");
    }

    // 5. Atualizar fatura com link de pagamento
    console.log("Atualizando fatura com link de pagamento:", abacateData.url);
    const { error: updateInvoiceError } = await supabaseClient
      .from("subscription_invoices")
      .update({
        payment_link: abacateData.url,
        abacate_payment_id: abacateData.paymentId,
        sent_at: new Date().toISOString(),
      })
      .eq("id", invoice.id);
    if (updateInvoiceError) {
      console.error("Erro ao atualizar fatura com link de pagamento:", updateInvoiceError);
      throw updateInvoiceError;
    }

    // 6. Enviar email com link de pagamento
    // TODO: Implementar envio via Resend

    console.log("Processo finalizado com sucesso para:", studentEmail);
    return new Response(
      JSON.stringify({
        success: true,
        subscription,
        invoice,
        paymentLink: abacateData.url,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro ao criar assinatura (catch):", error);
    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
