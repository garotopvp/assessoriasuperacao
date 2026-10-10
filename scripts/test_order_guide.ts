import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://tdzdureusnszdzvsoomr.supabase.co";
const supabaseAnonKey =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_V_3gNz5TWpeZ6MSxidwgtQ_nP4HPK5g";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log("🧪 GUIA DE TESTE DO SISTEMA DE PEDIDOS\n");
console.log("=".repeat(60));

console.log("\n📋 PASSO A PASSO PARA TESTAR:\n");

console.log("1️⃣  Acesse a loja:");
console.log("   👉 https://boracorrerclub.com/loja\n");

console.log("2️⃣  Faça login com sua conta admin:");
console.log("   📧 boracorrerclub@gmail.com\n");

console.log("3️⃣  Escolha um produto (exemplo: Boné Essential Cap):");
console.log("   • Clique no produto");
console.log("   • Selecione o tamanho");
console.log("   • Clique em 'Adicionar ao Carrinho'\n");

console.log("4️⃣  Vá para o checkout:");
console.log("   • Clique no ícone do carrinho");
console.log("   • Clique em 'Finalizar Compra'\n");

console.log("5️⃣  Escolha a forma de pagamento:");
console.log("   🎯 PIX (Recomendado para teste - sem taxas):");
console.log("      • O QR Code será gerado");
console.log("      • O pedido é criado NESTE MOMENTO com status 'pending'\n");
console.log("   💳 Cartão:");
console.log("      • Você será redirecionado para o Stripe");
console.log("      • O pedido é criado NESTE MOMENTO com status 'pending'\n");

console.log("6️⃣  Após gerar o QR Code ou chegar no Stripe:");
console.log("   ✅ O PEDIDO JÁ FOI CRIADO!");
console.log("   • Não precisa pagar de verdade");
console.log("   • Volte para o terminal e execute:");
console.log("   📟 npx tsx scripts/check_orders.ts\n");

console.log("7️⃣  Verifique o pedido no admin:");
console.log("   👉 https://boracorrerclub.com/admin?tab=pedidos\n");

console.log("8️⃣  Verifique no histórico do usuário:");
console.log("   👉 https://boracorrerclub.com/meus-pedidos\n");

console.log("=".repeat(60));

console.log("\n🔍 VERIFICANDO CONEXÃO COM O BANCO...\n");

async function checkConnection() {
  try {
    const { data, error, count } = await supabase
      .from("orders")
      .select("*", { count: "exact" })
      .limit(1);

    if (error) {
      console.log("❌ Erro ao conectar:", error.message);
      return;
    }

    console.log("✅ Conexão com o banco funcionando!");
    console.log(`📦 Pedidos registrados atualmente: ${count || 0}\n`);

    if (count === 0) {
      console.log("💡 Nenhum pedido ainda. Faça o teste acima para criar o primeiro!\n");
    }

    // Verificar produtos disponíveis
    const { data: products, error: prodError } = await supabase
      .from("products")
      .select("id, nome")
      .limit(3);

    if (!prodError && products) {
      console.log("🛍️  Produtos disponíveis para teste:");
      products.forEach((p) => {
        console.log(`   • ${p.nome} (ID: ${p.id})`);
      });
      console.log();
    }
  } catch (err) {
    console.error("❌ Erro:", err);
  }
}

checkConnection();
