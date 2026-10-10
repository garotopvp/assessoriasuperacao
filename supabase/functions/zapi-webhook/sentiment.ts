// Análise de Sentimento usando IA
export const analyzeSentiment = async (
  text: string,
  aiKey: string,
  provider: string = "openai"
): Promise<{ score: number; label: string }> => {
  try {
    let url = "https://api.openai.com/v1/chat/completions";
    if (provider === "deepseek") {
      url = "https://api.deepseek.com/chat/completions";
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiKey}`,
      },
      body: JSON.stringify({
        model: provider === "deepseek" ? "deepseek-chat" : "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Você é um analisador de sentimento. Analise a mensagem e responda APENAS com um JSON no formato:
{"score": <número de -1 a 1>, "label": "<POSITIVO|NEUTRO|NEGATIVO>"}

Onde:
- score: -1 (muito negativo) a 1 (muito positivo)
- label: POSITIVO, NEUTRO ou NEGATIVO

Exemplos de NEGATIVO: frustração, raiva, insatisfação, reclamação
Exemplos de POSITIVO: gratidão, felicidade, elogio
Exemplos de NEUTRO: perguntas simples, informações`,
          },
          {
            role: "user",
            content: text,
          },
        ],
        max_tokens: 50,
        temperature: 0.3,
      }),
    });

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '{"score": 0, "label": "NEUTRO"}';

    // Tenta extrair JSON da resposta
    const jsonMatch = content.match(/\{[^}]+\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        score: Number(result.score) || 0,
        label: result.label || "NEUTRO",
      };
    }

    return { score: 0, label: "NEUTRO" };
  } catch (error) {
    console.error("Erro na análise de sentimento:", error);
    return { score: 0, label: "NEUTRO" };
  }
};
