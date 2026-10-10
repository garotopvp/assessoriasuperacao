// Função para enviar email de teste manualmente
async function enviarEmailTeste(email) {
  console.log(`\n✉️  Enviando email de teste para: ${email} ...`);
  try {
    const response = await fetch(
      "https://tdzdureusnszdzvsoomr.supabase.co/functions/v1/send-subscription-email",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({
          type: "welcome",
          email: email,
          customerName: email.split("@")[0] || "Atleta",
          planName: "Bora Correr Club",
          confirmationLink: "https://boracorrerclub.com.br/confirmar-teste",
        }),
      }
    );
    if (response.ok) {
      console.log("✉️  Email de teste enviado!");
    } else {
      console.error("❌ Falha ao enviar email de teste:", await response.text());
    }
  } catch (err) {
    console.error("❌ Erro ao tentar enviar email de teste:", err);
  }
}
/**
 * ATENÇÃO SOBRE AS CHAVES SUPABASE
 *
 * - Chave ANON (pública):
 *   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkemR1cmV1c25zemR6dnNvb21yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMTY0NDcsImV4cCI6MjA4NDU5MjQ0N30.-1uhIZhAfai6gjkvjqgRbhRdvo9lozHiTkfyJlQmsxc
 *   Use normalmente no frontend e scripts públicos.
 *
 * - Chave SERVICE_ROLE (privada):
 *   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkemR1cmV1c25zemR6dnNvb21yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTAxNjQ0NywiZXhwIjoyMDg0NTkyNDQ3fQ.xPO2dZ_nAoSwmqGgzrY_7zu0Sr3wWGOD-3YRAnDP4s0
 *   NUNCA exponha no frontend, repositórios públicos ou clientes. Use APENAS em scripts backend/locais para tarefas administrativas.
 *
 * Este script só usa a chave service_role para gerar links de confirmação de email, nunca para autenticação de usuários comuns.
 */
import { createClient } from "@supabase/supabase-js";

// Usando a URL e chave anon corretas
const supabaseUrl = "https://tdzdureusnszdzvsoomr.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkemR1cmV1c25zemR6dnNvb21yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMTY0NDcsImV4cCI6MjA4NDU5MjQ0N30.-1uhIZhAfai6gjkvjqgRbhRdvo9lozHiTkfyJlQmsxc";

// Carregar chave service_role de variável de ambiente local (NUNCA subir para o git)
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function cadastrarUsuario(email, senha) {
  console.log(`\n🔄 Tentando cadastrar usuário: ${email}...\n`);

  try {
    // Tentar fazer signup
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: senha,
      options: {
        emailRedirectTo: `${supabaseUrl}/auth/v1/verify`,
      },
    });

    if (error) {
      console.error("❌ Erro ao cadastrar:", error.message);
      console.error("Código do erro:", error.status);
      console.error("Detalhes:", error);

      // Se o usuário já existe, tentar gerar o link de confirmação e enviar o email de boas-vindas mesmo assim
      if (error.message.includes("already registered") || error.status === 422) {
        console.log(
          "\n⚠️  Usuário já existe! Tentando gerar link de confirmação e enviar email...\n"
        );

        // Buscar dados do usuário existente
        let confirmationLink = null;
        try {
          if (!supabaseServiceRole) {
            throw new Error(
              "Defina a variável de ambiente SUPABASE_SERVICE_ROLE_KEY com sua chave service_role."
            );
          }
          const adminRes = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: supabaseServiceRole,
              Authorization: `Bearer ${supabaseServiceRole}`,
            },
            body: JSON.stringify({
              type: "signup",
              email: email,
              options: {
                redirectTo: "https://boracorrerclub.com.br/confirmado",
              },
            }),
          });
          const adminData = await adminRes.json();
          confirmationLink = adminData?.action_link;
          if (confirmationLink) {
            console.log("🔗 Link de confirmação gerado:", confirmationLink);
          } else {
            console.error("❌ Não foi possível gerar o link de confirmação:", adminData);
          }
        } catch (err) {
          console.error("❌ Erro ao gerar link de confirmação:", err);
        }

        // Enviar e-mail de boas-vindas + confirmação
        try {
          const response = await fetch(
            "https://tdzdureusnszdzvsoomr.supabase.co/functions/v1/send-subscription-email",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: supabaseAnonKey,
              },
              body: JSON.stringify({
                type: "welcome",
                email: email,
                customerName: email.split("@")[0] || "Atleta",
                planName: "Bora Correr Club",
                confirmationLink,
              }),
            }
          );
          if (response.ok) {
            console.log("✉️  E-mail de boas-vindas enviado!");
          } else {
            console.error("❌ Falha ao enviar e-mail de boas-vindas:", await response.text());
          }
        } catch (err) {
          console.error("❌ Erro ao tentar enviar e-mail de boas-vindas:", err);
        }
      }
    } else {
      console.log("✅ Usuário cadastrado com sucesso!");
      console.log("\n📧 Dados do usuário:");
      console.log("   - ID:", data.user?.id);
      console.log("   - Email:", data.user?.email);
      console.log("   - Email confirmado:", data.user?.email_confirmed_at ? "Sim" : "Não");
      console.log("   - Sessão criada:", data.session ? "Sim" : "Não");

      // 1. Criar assinatura padrão na tabela recurring_subscriptions
      try {
        const { error: subError } = await supabase.from("recurring_subscriptions").insert([
          {
            user_id: data.user?.id,
            student_name: data.user?.email?.split("@")[0] || "Atleta",
            student_email: data.user?.email,
            student_phone: null,
            plan_id: "plano-mensal",
            plan_name: "Plano Mensal",
            amount: null,
            status: "active",
            started_at: new Date().toISOString(),
            next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 dias
          },
        ]);
        if (subError) {
          console.error("❌ Erro ao criar assinatura:", subError);
        } else {
          console.log("✅ Assinatura criada com sucesso!");
        }
      } catch (err) {
        console.error("❌ Erro inesperado ao criar assinatura:", err);
      }

      // 2. Gerar link de confirmação manualmente usando a service_role
      let confirmationLink = null;
      try {
        if (!supabaseServiceRole) {
          throw new Error(
            "Defina a variável de ambiente SUPABASE_SERVICE_ROLE_KEY com sua chave service_role."
          );
        }
        const adminRes = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseServiceRole,
            Authorization: `Bearer ${supabaseServiceRole}`,
          },
          body: JSON.stringify({
            type: "signup",
            email: data.user?.email,
            options: {
              redirectTo: "https://boracorrerclub.com.br/confirmado",
            },
          }),
        });
        const adminData = await adminRes.json();
        confirmationLink = adminData?.action_link;
        if (confirmationLink) {
          console.log("🔗 Link de confirmação gerado:", confirmationLink);
        } else {
          console.error("❌ Não foi possível gerar o link de confirmação:", adminData);
        }
      } catch (err) {
        console.error("❌ Erro ao gerar link de confirmação:", err);
      }

      // 3. Enviar e-mail de boas-vindas + confirmação
      try {
        const response = await fetch(
          "https://tdzdureusnszdzvsoomr.supabase.co/functions/v1/send-subscription-email",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: supabaseAnonKey,
            },
            body: JSON.stringify({
              type: "welcome",
              email: data.user?.email,
              customerName: data.user?.email?.split("@")[0] || "Atleta",
              planName: "Plano Mensal",
              confirmationLink,
            }),
          }
        );
        if (response.ok) {
          console.log("✉️  E-mail de boas-vindas enviado!");
        } else {
          console.error("❌ Falha ao enviar e-mail de boas-vindas:", await response.text());
        }
      } catch (err) {
        console.error("❌ Erro ao tentar enviar e-mail de boas-vindas:", err);
      }
    }
  } catch (err) {
    console.error("\n💥 Erro inesperado:", err);
  }
}

// Para enviar email de teste, descomente a linha abaixo:
// enviarEmailTeste('rinaldopedroso@gmail.com');
