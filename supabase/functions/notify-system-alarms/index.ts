import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Função responsável por enviar mensagens e notificações
 * para grupos do WhatsApp de forma centralizada.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { tipo, dados } = body;

    // TODO: Adicionar variáveis de ambiente com os IDs dos grupos no ZAPI
    // ZAPI_GRUPO_PROFESSORES_ID
    // ZAPI_GRUPO_NOTIFICACOES_ID
    const grupoProfessoresID = Deno.env.get("ZAPI_GRUPO_PROFESSORES_ID") || "COLOCAR_ID_AQUI";
    const grupoNotificacoesID = Deno.env.get("ZAPI_GRUPO_NOTIFICACOES_ID") || "COLOCAR_ID_AQUI";

    const ZAPI_URL = Deno.env.get("ZAPI_URL");
    const adminToken = Deno.env.get("ZAPI_ADMIN_TOKEN");
    const clientToken = Deno.env.get("ZAPI_CLIENT_TOKEN");

    if (!ZAPI_URL) throw new Error("URL do ZAPI não configurada.");

    let messageParams = null;

    // Montando a mensagem com base no tipo
    if (tipo === "novo_cadastro") {
      const { nome, telefone, anamnese_resumo } = dados;

      messageParams = {
        phone: grupoProfessoresID,
        message:
          `🚨 *NOVO ALUNO NO BORA CORRER* 🚨\n\n` +
          `👤 *Nome:* ${nome || "Não informado"}\n` +
          `📱 *Telefone:* ${telefone || "Não informado"}\n\n` +
          `📋 *Resumo da Anamnese:*\n${anamnese_resumo || "Não preencheu ainda."}\n\n` +
          `Dêem as boas-vindas e acompanhem! 🏃‍♂️💨`,
      };
    } else if (tipo === "novo_pagamento") {
      const { nome, plano, valor, status } = dados;

      messageParams = {
        phone: grupoNotificacoesID,
        message:
          `💰 *NOVA VENDA / PAGAMENTO* 💰\n\n` +
          `👤 *Aluno:* ${nome || "Não informado"}\n` +
          `🏅 *Plano:* ${plano || "Consultoria"}\n` +
          `💵 *Valor:* R$ ${Number(valor || 0).toFixed(2)}\n` +
          `✅ *Status:* ${status || "Aprovado"}`,
      };
    } else if (tipo === "falha_pagamento") {
      const { nome, plano, valor, erro_motivo } = dados;

      messageParams = {
        phone: grupoNotificacoesID,
        message:
          `❌ *FALHA DE PAGAMENTO* ❌\n\n` +
          `👤 *Aluno:* ${nome || "Não informado"}\n` +
          `🏅 *Plano:* ${plano || "Consultoria"}\n` +
          `💵 *Valor Tentado:* R$ ${Number(valor || 0).toFixed(2)}\n` +
          `🛑 *Motivo:* ${erro_motivo || "Recusado pelo cartão"}\n\n` +
          `⚠️ Atenção Equipe de Vendas/Recuperação! Entrem em contato urgente.`,
      };
    } else {
      throw new Error(`Tipo de notificação desconhecido: ${tipo}`);
    }

    // Configurando URL final para envio pela ZAPI (seja grupo ou numero)
    let finalUrl = ZAPI_URL;
    if (!finalUrl.includes("/send-text")) {
      if (!finalUrl.endsWith("/")) finalUrl += "/";
      if (!finalUrl.includes("/token/")) {
        finalUrl += `token/${clientToken || Deno.env.get("ZAPI_TOKEN")}/`;
      }
      finalUrl += "send-text";
    }

    // Chamando a ZAPI
    const response = await fetch(finalUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Token": adminToken || clientToken || "",
      },
      body: JSON.stringify(messageParams),
    });

    const respText = await response.text();
    let zapiBody = {};
    try {
      zapiBody = JSON.parse(respText);
    } catch {
      zapiBody = { text: respText };
    }

    if (!response.ok) {
      console.error("ZAPI Error:", response.status, respText);
      throw new Error(`Falha ao avisar no Z-API: ${respText}`);
    }

    return new Response(
      JSON.stringify({ success: true, delivered_to: messageParams.phone, zapi_response: zapiBody }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Erro na função de alarme:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
