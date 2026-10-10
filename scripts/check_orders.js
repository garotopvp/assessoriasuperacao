require("dotenv").config({ path: ".env" });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY; // Precisa ser a chave de serviço para bypass RLS

if (!supabasekey) {
  // Tenta ler do arquivo .env diretamente pois process.env via require pode nao pegar SERVICE_KEY se nao estiver no .env raiz
  const fs = require("fs");
  const envConfig = require("dotenv").parse(fs.readFileSync(".env"));

  // Se nao tiver SERVICE_KEY, tenta usar a PUBLISHABLE KEY apenas para leitura basica (mas RLS pode bloquear)
  // Mas ideal é SERVICE_KEY. Vou tentar ler do arquivo se nao estiver no process.env
}

// Para esse script funcionar, preciso da chave de serviço. Vou assumir que ela está no .env ou vou pedir para o usuário fornecer.
// Se nao tiver, vou usar a publishable key e torcer para o RLS permitir leitura.

const supabase = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function checkOrders() {
  console.log("Verificando últimos pedidos...");

  const { data, error } = await supabase
    .from("orders")
    .select("id, user_id, status, created_at, updated_at, total")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Erro ao buscar pedidos:", error);
    return;
  }

  console.log("Últimos 5 pedidos:");
  data.forEach((order) => {
    console.log(`- ID: ${order.id}`);
    console.log(`  User: ${order.user_id}`);
    console.log(`  Status: ${order.status}`); // Deve ser 'paid' se pagou
    console.log(`  Criado em: ${new Date(order.created_at).toLocaleString()}`);
    console.log(`  Atualizado em: ${new Date(order.updated_at).toLocaleString()}`);
    console.log(`  Total: ${order.total}`);
    console.log("---");
  });
}

checkOrders();
