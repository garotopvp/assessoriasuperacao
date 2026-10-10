import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, text } = await req.json();
    const apiKey = Deno.env.get("DEEPSEEK_API_KEY");

    if (!apiKey) {
      throw new Error("DEEPSEEK_API_KEY not set");
    }

    let prompt = "";
    if (action === "improve") {
      prompt = `Melhore a seguinte mensagem de um bot de WhatsApp para o "Bora Correr Club" (assessoria de corrida). 
      A mensagem deve ser amigável, motivadora e profissional. 
      Mantenha as variáveis entre chaves intactas, como {name}, {goal}, {day}, {time}.
      Corrija qualquer erro ortográfico ou gramatical.
      Use emojis de forma moderada e profissional.
      Retorne APENAS o texto melhorado, sem comentários ou aspas ao redor.
      
      Mensagem original: ${text}`;
    } else if (action === "spellcheck") {
      prompt = `Corrija apenas os erros ortográficos e gramaticais do seguinte texto, mantendo o sentido original e as variáveis entre chaves {} exatamente como estão.
      Retorne APENAS o texto corrigido.
      
      Texto: ${text}`;
    } else if (action === "command") {
      prompt = `Você é um assistente criativo para o "Bora Correr Club". Seu objetivo é escrever mensagens curtas e engajadoras para WhatsApp.
      
      Instrução do usuário: ${text}
      
      Importante: Mantenha qualquer placeholder como {name} se for relevante. Seja direto e profissional, usando emojis moderadamente.`;
    } else if (action === "generate-flow") {
      prompt = `Você é um especialista em fluxogramas de chatbot para WhatsApp.
      Sua tarefa é criar uma SEQUÊNCIA DE PASSOS (nós) baseada na solicitação do usuário.
      
      Se a solicitação vier com um [CONTEXTO DO NÓ PAI], analise se o novo fluxo deve ser conectado a uma das opções existentes. Se sim, identifique o índice dessa opção.
      
      Solicitação: "${text}"
      
      Retorne APENAS um JSON válido (sem markdown, sem \`\`\`) com a seguinte estrutura de OBJETO:
      {
        "targetOptionIndex": null, // Se conectar a uma opção do pai, coloque o índice dela (0, 1, 2...). Se for genérico ou não houver conexão específica, null.
        "steps": [
            {
            "id": "step_1",
            "label": "Título do Passo",
            "content": "Texto da mensagem com emojis se necessário.",
            "options": ["Sim", "Não"] 
            },
            {
            "id": "step_2", 
            "label": "Continuação",
            "content": "..."
            }
        ]
      }
      
      REGRAS:
      1. Se o usuário pedir algo como "Crie fluxo para Financeiro" e no Contexto tiver uma opção "Financeiro" (index 2), retorne "targetOptionIndex": 2. Caso contrário, mantenha null.
      2. Mantenha o tom motivador e energético do "Bora Correr Club".
      3. O primeiro nó em "steps" deve ser a resposta direta à solicitação.
      4. Se a solicitação implicar em várias etapas, crie nós sequenciais no array "steps".
      5. NÃO invente links ou funcionalidades complexas, apenas texto e botões simples.`;
    }

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content:
              action === "generate-flow"
                ? "You are a JSON generator. You always return valid JSON arrays."
                : "You are a helpful assistant.",
          },
          { role: "user", content: prompt },
        ],
        stream: false,
        response_format: action === "generate-flow" ? { type: "json_object" } : undefined,
      }),
    });

    const data = await response.json();
    console.log("DeepSeek API data received:", JSON.stringify(data));

    if (data.error) {
      console.error("DeepSeek API Raw Error:", JSON.stringify(data.error));
      const errorMsg = data.error.message || JSON.stringify(data.error);

      if (errorMsg.includes("Insufficient Balance")) {
        throw new Error("Erro no DeepSeek: Saldo insuficiente na API (Insufficient Balance).");
      }

      throw new Error(`DeepSeek API Error: ${errorMsg}`);
    }

    let result = data.choices?.[0]?.message?.content?.trim();

    // Clean up markdown code blocks if present (common in AI responses even when asked not to)
    if (result && result.startsWith("```json")) {
      result = result.replace(/^```json/, "").replace(/```$/, "");
    } else if (result && result.startsWith("```")) {
      result = result.replace(/^```/, "").replace(/```$/, "");
    }

    if (!result) {
      console.error("No result in DeepSeek response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({
          error: "A IA não retornou texto. Verifique se o conteúdo foi bloqueado.",
          details: data,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("AI Assistant Error:", error.message);
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, // Return 200 to see the error in client
    });
  }
});
