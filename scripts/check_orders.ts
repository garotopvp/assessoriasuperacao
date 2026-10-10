import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://tdzdureusnszdzvsoomr.supabase.co";
const supabaseAnonKey =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_V_3gNz5TWpeZ6MSxidwgtQ_nP4HPK5g";

if (!supabaseAnonKey) {
  console.error("❌ VITE_SUPABASE_PUBLISHABLE_KEY not found in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkOrders() {
  console.log("🔍 Verificando pedidos registrados...\n");

  // Verificar total de pedidos
  const {
    data: orders,
    error: ordersError,
    count,
  } = await supabase
    .from("orders")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (ordersError) {
    console.error("❌ Erro ao buscar pedidos:", ordersError.message);
    return;
  }

  console.log(`📦 Total de pedidos: ${count || 0}\n`);

  if (orders && orders.length > 0) {
    console.log("📋 Últimos 10 pedidos:");
    console.log("─".repeat(100));

    for (const order of orders.slice(0, 10)) {
      console.log(`\n🆔 ID: ${order.id}`);
      console.log(`   📧 Email: ${order.customer_email}`);
      console.log(`   👤 User ID: ${order.user_id || "N/A"}`);
      console.log(`   💰 Total: R$ ${Number(order.total).toFixed(2)}`);
      console.log(`   📊 Status: ${order.status}`);
      console.log(`   💳 Provedor: ${order.payment_provider}`);
      console.log(`   📅 Criado em: ${new Date(order.created_at).toLocaleString("pt-BR")}`);

      // Buscar itens do pedido
      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", order.id);

      if (itemsError) {
        console.log(`   ⚠️ Erro ao buscar itens: ${itemsError.message}`);
      } else if (items && items.length > 0) {
        console.log(`   🛍️  Itens (${items.length}):`);
        items.forEach((item) => {
          console.log(
            `      - ${item.product_name}${item.product_size ? ` (${item.product_size})` : ""} x${item.quantity} = R$ ${Number(item.price).toFixed(2)}`
          );
        });
      } else {
        console.log(`   📦 Itens JSON: ${JSON.stringify(order.items)}`);
      }
    }
    console.log("\n" + "─".repeat(100));
  } else {
    console.log("⚠️  Nenhum pedido encontrado no banco de dados.");
  }

  // Estatísticas por status
  console.log("\n📊 Estatísticas por status:");
  const { data: statusStats } = await supabase.from("orders").select("status");

  if (statusStats) {
    const statusCount: Record<string, number> = {};
    statusStats.forEach((order) => {
      statusCount[order.status] = (statusCount[order.status] || 0) + 1;
    });

    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
  }

  // Estatísticas por provedor
  console.log("\n💳 Estatísticas por provedor de pagamento:");
  const { data: providerStats } = await supabase.from("orders").select("payment_provider");

  if (providerStats) {
    const providerCount: Record<string, number> = {};
    providerStats.forEach((order) => {
      providerCount[order.payment_provider] = (providerCount[order.payment_provider] || 0) + 1;
    });

    Object.entries(providerCount).forEach(([provider, count]) => {
      console.log(`   ${provider}: ${count}`);
    });
  }
}

checkOrders();
