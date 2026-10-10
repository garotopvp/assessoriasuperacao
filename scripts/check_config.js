const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: "c:/Users/rinal/OneDrive/Documentos/GitHub/boracorrerclub/.env" });

const supabase = createClient(
  "https://tzdureusnszdzvsoomr.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6ZHVyZXVzbnN6ZHp2c29vbXIiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzM4NzY1NjY1LCJleHAiOjIwNTQzNDE2NjV9.h-4-S_-7-c0-S-6-S-5-S-4-S-3-S-2-S-1-S-0-S-9-S-8-S-7-S-6-S-5-S-4-S-3-S-2-S-1-S-0-S-9-S-8-S-7-S-6-S-5-S-4-S-3-S-2-S-1-S-0-S-9-S-8-S-7-S-6-S-5" ||
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkConfig() {
  const { data, error } = await supabase
    .from("support_settings")
    .select("*")
    .eq("key", "general_config")
    .single();

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Config:", JSON.stringify(data, null, 2));
  }
}

checkConfig();
