import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user_id, status, error_msg, secret } = await req.json();

    // Verify secret to ensure only the bot can hit this endpoint
    if (secret !== "boracorrer_callback_super_secret_123") {
      return new Response(JSON.stringify({ error: "Unauthorized endpoint access" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!user_id || !status) {
      return new Response(JSON.stringify({ error: "Missing required fields (user_id, status)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase admin client to update the user's profile
    // Edge functions have access to these environment variables by default
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const updateData: any = {
      sisrun_bot_status: status,
      sisrun_bot_error: error_msg || null,
    };

    if (status === "success") {
      updateData.tem_conta_sisrun = true;
    }

    console.log(`Updating profile for ${user_id} with status ${status}`);

    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update(updateData)
      .eq("user_id", user_id);

    if (updateError) {
      console.error("Database update error:", updateError);
      throw updateError;
    }

    console.log(`Successfully updated profile ${user_id}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error processing callback:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
