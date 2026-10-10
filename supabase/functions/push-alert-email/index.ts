import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
// Email autorizado previamente na Resend
const SENDER_EMAIL = "alerta@boracorrer.club"; // Ou onbording@resend.dev dependendo de como a Resend está configurada

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, message, category, emailAdmin = "geral@boracorrer.club" } = await req.json();

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is missing in env vars");
    }

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #1f88c8; margin: 0;">Bora Correr Club</h2>
          <span style="font-size: 12px; color: #666; text-transform: uppercase;">Alerta do Sistema</span>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; border-left: 4px solid #1f88c8;">
          <p style="margin-top: 0;"><strong>Ação / Gatilho:</strong> ${action || 'Não informado'}</p>
          <p><strong>Categoria:</strong> <span style="text-transform: uppercase;">${category || 'Geral'}</span></p>
          <p><strong>Detalhes:</strong></p>
          <p style="background: #fff; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; white-space: pre-wrap;">${message || 'Sem mensagem'}</p>
        </div>

        <p style="font-size: 12px; color: #999; text-align: center; margin-top: 30px;">
          Este é um e-mail automático enviado pelo sistema Bot do Bora Correr Club.
        </p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `BCC Alertas <${SENDER_EMAIL}>`,
        to: [emailAdmin],
        subject: `[ALERTA BCC] ${action}`,
        html: htmlBody,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Resend API erro:", errorText);
      throw new Error(`Resend Error: ${errorText}`);
    }

    const data = await res.json();

    return new Response(JSON.stringify({ success: true, resendId: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in push-alert-email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
