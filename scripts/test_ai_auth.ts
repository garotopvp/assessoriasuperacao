import { createClient } from "@supabase/supabase-js";

// Hardcoded for testing script only
const supabaseUrl = "https://tdzdureusnszdzvsoomr.supabase.co";
// Using the publishable key found in .env
const supabaseKey = "sb_publishable_V_3gNz5TWpeZ6MSxidwgtQ_nP4HPK5g";

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // Don't persist to file system, keep in memory for this script run
  },
});

async function main() {
  console.log("Authenticating as boracorrerclub@gmail.com...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: "boracorrerclub@gmail.com",
    password: "Demetrio17!",
  });

  if (authError) {
    console.error("Auth Error:", authError);
    return;
  }

  console.log("User Logged In:", authData.user?.email);
  console.log("User ID:", authData.user?.id);

  console.log("Calling AI Function...");
  try {
    const { data: funcData, error: funcError } = await supabase.functions.invoke("ai-assistant", {
      body: {
        action: "command",
        text: "Teste de integracao IA: Crie uma frase motivacional curta.",
      },
    });

    if (funcError) {
      console.error("Function Error (Client-side):", funcError);
    } else {
      console.log("Function Response Data:", JSON.stringify(funcData, null, 2));

      if (funcData.error) {
        console.error("Function returned logical error:", funcData.error);
        if (funcData.details) {
          console.error("Details:", JSON.stringify(funcData.details, null, 2));
        }
      }
    }
  } catch (err) {
    console.error("Unexpected error calling function:", err);
  }
}

main();
