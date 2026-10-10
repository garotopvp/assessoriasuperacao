import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://tdzdureusnszdzvsoomr.supabase.co";
const supabaseKey =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_V_3gNz5TWpeZ6MSxidwgtQ_nP4HPK5g";

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase URL or Key not found in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listProducts() {
  const { data, error } = await supabase.from("products").select("*").order("nome");

  if (error) {
    console.error("Error fetching products:", error);
    return;
  }

  console.log("Products found:", data.length);
  data.forEach((p) => {
    console.log(`- ${p.nome} (ID: ${p.id})`);
  });
}

listProducts();
