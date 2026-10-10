import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const ZAPI_URL = Deno.env.get("ZAPI_URL");
    const ZAPI_CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN");

    if (!supabaseUrl || !supabaseKey || !ZAPI_URL || !ZAPI_CLIENT_TOKEN) {
      console.error("Missing Config:", {
        url: !!supabaseUrl,
        key: !!supabaseKey,
        zapi: !!ZAPI_URL,
        token: !!ZAPI_CLIENT_TOKEN,
      });
      throw new Error("Missing Configuration (Secrets)");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    const { sessionId, message, mediaUrl, mediaType, senderName, isInternal } = await req.json();

    if (!sessionId || !message) {
      return new Response(JSON.stringify({ error: "Missing sessionId or message" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // 1. Get Session Details
    const { data: session, error: sessionError } = await supabaseClient
      .from("support_sessions")
      .select("student_phone")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    const targetPhone = session.student_phone;

    // Format message with sender name
    const finalMessage = senderName ? `👤 *${senderName}*:\n${message}` : message;

    // 2. Send to Z-API
    let sentType = "text";
    let zapiRes;

    if (!isInternal) {
      if (mediaUrl) {
        if (mediaType === "image") {
          zapiRes = await fetch(`${ZAPI_URL}/send-image`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Client-Token": ZAPI_CLIENT_TOKEN },
            body: JSON.stringify({ phone: targetPhone, image: mediaUrl, caption: finalMessage }),
          });
          sentType = "image";
        } else {
          // Fallback to text
          zapiRes = await fetch(`${ZAPI_URL}/send-text`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Client-Token": ZAPI_CLIENT_TOKEN },
            body: JSON.stringify({
              phone: targetPhone,
              message: `${finalMessage} (Link: ${mediaUrl})`,
            }),
          });
        }
      } else {
        zapiRes = await fetch(`${ZAPI_URL}/send-text`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Client-Token": ZAPI_CLIENT_TOKEN },
          body: JSON.stringify({ phone: targetPhone, message: finalMessage }),
        });
      }

      if (!zapiRes.ok) {
        const errText = await zapiRes.text();
        console.error("Z-API Error:", zapiRes.status, errText);
        throw new Error(`Z-API Failed: ${errText}`);
      }
    }

    // 3. Log to Database
    const { data: insertedMessage, error: insertError } = await supabaseClient
      .from("support_messages")
      .insert({
        session_id: sessionId,
        sender_type: "ADMIN",
        content: message,
        media_url: mediaUrl,
        media_type: mediaType,
        is_internal: isInternal || false,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error logging message:", insertError);
    }

    // 4. Update Session Timestamp
    await supabaseClient
      .from("support_sessions")
      .update({ last_interaction: new Date().toISOString() })
      .eq("id", sessionId);

    return new Response(JSON.stringify({ success: true, data: insertedMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
