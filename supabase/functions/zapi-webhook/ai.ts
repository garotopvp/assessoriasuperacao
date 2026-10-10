export const transcribeAudio = async (audioUrl: string, config: any): Promise<string | null> => {
  try {
    console.log("🎙️ Baixando áudio para transcrição...", audioUrl);
    const fileReq = await fetch(audioUrl);
    if (!fileReq.ok) {
      console.error(`❌ Erro ao baixar áudio (${fileReq.status}): ${fileReq.statusText}`);
      return null;
    }

    const blob = await fileReq.blob();
    const buffer = await blob.arrayBuffer();
    const uint8 = new Uint8Array(buffer);
    console.log(`📦 Tamanho do áudio: ${uint8.length} bytes | Mime: ${blob.type}`);

    // Conversão segura para Base64
    let base64 = "";
    try {
      const chunkSize = 16384;
      let binary = "";
      for (let i = 0; i < uint8.length; i += chunkSize) {
        const chunk = uint8.subarray(i, Math.min(i + chunkSize, uint8.length));
        binary += String.fromCharCode.apply(null, chunk as any);
      }
      base64 = btoa(binary);
      console.log("✅ Áudio convertido para Base64");
    } catch (e) {
      console.error("❌ Erro na conversão Base64:", e);
      return null;
    }

    const apiKey = config.gemini_key || Deno.env.get("GEMINI_API_KEY");

    // Prioriza Gemini se houver chave (mais estável para áudio)
    if (apiKey) {
      console.log("✨ Transcrevendo com Gemini...");
      const model = "gemini-1.5-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Transcreva exatamente o que é dito neste áudio em português brasileiro. Se não houver fala ou for apenas ruído, retorne apenas [vazio]. Não adicione comentários próprios.",
                },
                {
                  inline_data: {
                    mime_type: blob.type || "audio/ogg",
                    data: base64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
          },
        }),
      });

      const d = await response.json();
      if (!response.ok) {
        console.error("❌ Erro na API do Gemini:", JSON.stringify(d));
        return null;
      }

      const transcript = d.candidates?.[0]?.content?.parts?.[0]?.text || null;
      console.log("📝 Resultado Gemini:", transcript);

      if (!transcript || transcript.trim() === "[vazio]") {
        return null;
      }
      return transcript.trim();
    }

    // Caso contrário, tenta Whisper (OpenAI)
    console.log("🤖 Transcrevendo com Whisper (OpenAI)...");
    const fd = new FormData();
    fd.append("file", blob, "audio.ogg");
    fd.append("model", "whisper-1");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${config.openai_key}` },
      body: fd,
    });

    const d = await res.json();
    return d.text || null;
  } catch (e) {
    console.error("Transcribe Error", e);
    return null;
  }
};

export const askAI = async (messages: any[], config: any): Promise<string | null> => {
  let url = "https://api.openai.com/v1/chat/completions";
  const model = config.model || (config.provider === "gemini" ? "gemini-1.5-flash" : "gpt-4o-mini");
  const provider = config.provider || "openai";

  try {
    if (provider === "gemini") {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.gemini_key}`;

      // Converte formato OpenAI para Gemini, garantindo alternância de papéis
      const geminiMessages: { role: string; parts: { text: string }[] }[] = [];
      let lastRole = "";

      messages.forEach((m: any) => {
        const currentRole = m.role === "assistant" ? "model" : "user";
        if (currentRole === lastRole) {
          // Mescla com a mensagem anterior se o papel for o mesmo
          geminiMessages[geminiMessages.length - 1].parts[0].text += `\n${m.content}`;
        } else {
          geminiMessages.push({
            role: currentRole,
            parts: [{ text: m.content }],
          });
          lastRole = currentRole;
        }
      });

      // Gemini exige que a primeira mensagem seja 'user'
      if (geminiMessages.length > 0 && geminiMessages[0].role === "model") {
        geminiMessages.shift();
      }

      const res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: geminiMessages,
          system_instruction: {
            parts: [
              {
                text: `Você é um assistente virtual do Bora Correr Club. Responda de forma curta e direta. Use este contexto: ${config.context}`,
              },
            ],
          },
          generationConfig: {
            maxOutputTokens: 350,
            temperature: 0.7,
          },
        }),
      });

      const d = await res.json();
      if (!res.ok) {
        console.error("❌ Erro Gemini (askAI):", JSON.stringify(d));
        return null;
      }
      return d.candidates?.[0]?.content?.parts?.[0]?.text || null;
    }

    // DeepSeek ou OpenAI (formato compatível)
    if (provider === "deepseek") {
      url = "https://api.deepseek.com/chat/completions";
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.openai_key}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content: `Você é um assistente virtual do Bora Correr Club. Responda de forma curta e direta. Use este contexto: ${config.context}`,
          },
          ...messages,
        ],
        max_tokens: 350,
      }),
    });

    const d = await res.json();
    return d.choices?.[0]?.message?.content || null;
  } catch (e) {
    console.error("AI Error", e);
    return null;
  }
};
export const generateAudio = async (text: string, config: any): Promise<string | null> => {
  const provider = config.tts_provider || "openai";
  const apiKey = config.elevenlabs_key || config.openai_key;

  try {
    if (provider === "elevenlabs") {
      const voiceId = config.elevenlabs_voice_id || "pNInz6obpg8nEByWQX2i"; // Voz default (Adam ou similar profissional)
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      });

      if (!res.ok) throw new Error(`Erro ElevenLabs: ${res.statusText}`);

      const buffer = await res.arrayBuffer();
      const uint8 = new Uint8Array(buffer);
      let binary = "";
      const chunkSize = 16384;
      for (let i = 0; i < uint8.length; i += chunkSize) {
        const chunk = uint8.subarray(i, Math.min(i + chunkSize, uint8.length));
        binary += String.fromCharCode.apply(null, chunk as any);
      }
      const base64 = btoa(binary);
      return `data:audio/mpeg;base64,${base64}`;
    } else {
      // Default: OpenAI
      const res = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.openai_key}`,
        },
        body: JSON.stringify({
          model: "tts-1",
          voice: config.openai_voice || "onyx",
          input: text,
        }),
      });

      if (!res.ok) throw new Error("Erro OpenAI TTS");

      const buffer = await res.arrayBuffer();
      const uint8 = new Uint8Array(buffer);
      let binary = "";
      const chunkSize = 16384;
      for (let i = 0; i < uint8.length; i += chunkSize) {
        const chunk = uint8.subarray(i, Math.min(i + chunkSize, uint8.length));
        binary += String.fromCharCode.apply(null, chunk as any);
      }
      const base64 = btoa(binary);
      return `data:audio/ogg;base64,${base64}`;
    }
  } catch (e) {
    console.error("TTS Error", e);
    return null;
  }
};
