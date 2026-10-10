import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // You can optionally check if user is admin here

    const { phone, message } = await req.json();

    if (!phone || !message) {
      return new Response(JSON.stringify({ error: "Missing phone or message" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const ZAPI_URL = Deno.env.get("ZAPI_URL");
    let ZAPI_CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN");
    const adminToken = Deno.env.get("ZAPI_ADMIN_TOKEN");

    if (!ZAPI_URL) {
      throw new Error("ZAPI_URL is missing");
    }

    const zapiToken = Deno.env.get("ZAPI_TOKEN");
    let finalUrl = ZAPI_URL;
    if (!finalUrl.includes("/send-text")) {
      if (!finalUrl.endsWith("/")) finalUrl += "/";
      if (!finalUrl.includes("/token/")) {
        finalUrl += `token/${ZAPI_CLIENT_TOKEN || zapiToken}/`;
      }
      finalUrl += "send-text";
    }

    if (finalUrl.includes("/token/") && !finalUrl.includes("/send-text")) {
      finalUrl += "/send-text";
    }

    const response = await fetch(finalUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Token": adminToken || ZAPI_CLIENT_TOKEN || "",
      },
      body: JSON.stringify({ phone, message }),
    });

    const body = await response.text();

    if (!response.ok) {
      console.error("ZAPI Error:", response.status, body);
      throw new Error(`ZAPI Error: ${body}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: response.status,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
