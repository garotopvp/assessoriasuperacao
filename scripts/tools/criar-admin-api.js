import { createClient } from "@supabase/supabase-js";

// Configuração do Supabase
const supabaseUrl = "https://tdzdureusnszdzvsoomr.supabase.co";
const supabaseServiceKey = "SUA_SERVICE_ROLE_KEY_AQUI"; // Você precisa pegar a service_role key do dashboard

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function criarAdmin() {
  console.log("🔄 Criando usuário admin...\n");

  try {
    // Usar a API Admin para criar o usuário
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: "admin@gmail.com",
      password: "Demetrio17!",
      email_confirm: true, // Confirmar email automaticamente
      user_metadata: {
        role: "admin",
      },
    });

    if (userError) {
      console.error("❌ Erro ao criar usuário:", userError.message);
      return;
    }

    console.log("✅ Usuário criado com sucesso!");
    console.log("ID:", userData.user.id);
    console.log("Email:", userData.user.email);

    // Adicionar role de admin na tabela user_roles
    const { error: roleError } = await supabase.from("user_roles").insert({
      user_id: userData.user.id,
      role: "admin",
    });

    if (roleError) {
      console.error("❌ Erro ao adicionar role:", roleError.message);
      console.log("⚠️  Mas o usuário foi criado! Você pode adicionar a role manualmente.");
    } else {
      console.log("✅ Role de admin adicionada!");
    }

    console.log("\n🎉 Tudo pronto! Você pode fazer login com:");
    console.log("   Email: admin@gmail.com");
    console.log("   Senha: Demetrio17!");
  } catch (err) {
    console.error("💥 Erro inesperado:", err);
  }
}

criarAdmin();
