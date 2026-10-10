import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { askAI, transcribeAudio, generateAudio } from "./ai.ts";
import { sendZapiText, sendZapiAudio, sendZapiMenu } from "./zapi.ts";
import { analyzeSentiment } from "./sentiment.ts";

const ZAPI_URL = Deno.env.get("ZAPI_URL") || "";
const ZAPI_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN") || "";
const ZAPI_ADMIN_TOKEN = Deno.env.get("ZAPI_ADMIN_TOKEN") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Configurações de Admins e Links
const ADMIN_NUMBERS = {
  FINANCEIRO: "553598629449",
  COMUNICACAO: "5513996890611",
  DIEGO: "5513991388597",
  CAIQUE: "5513974071554",
  FERNANDA: "5513982015143",
  GRUPO_EQUIPE: "120363342008646829@g.us",
};

const LINKS = {
  PLANOS: "https://www.boracorrerclub.com.br/planos",
  MAPS: "https://www.google.com/maps/place/Bora+Correr+Club/data=!4m2!3m1!1s0x0:0x258d6bc0ef2bd999?sa=X&ved=1t:2428&ictx=111",
  INSTAGRAM: "https://www.instagram.com/boracorrerclub",
  PIX: "financeiro@boracorrerclub.com.br",
  LOJA: "https://www.boracorrerclub.com.br/loja",
};

const CLUB_LOCATION = {
  lat: -20.34046,
  lng: -40.28574,
  radius: 300, // metros
};

// Helpers para o Fluxo do Bot
async function getBotNode(key: string) {
  const { data } = await supabase
    .from("bot_flow_nodes")
    .select("*")
    .eq("node_key", key)
    .maybeSingle();
  return data;
}

function processTemplate(content: string, vars: any) {
  let result = content;
  if (!result) return "";
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value || ""));
  }
  return result;
}

async function handleGenericFlow(session: any, phone: string, text: string, profile: any) {
  const currentNode = await getBotNode(session.status);
  if (!currentNode || !currentNode.options || currentNode.options.length === 0) {
    return false; // Não é um nó de fluxo genérico ou não tem opções
  }

  const options = currentNode.options;
  let selectedOption = null;

  // Tentar encontrar a opção escolhida (por número ou por texto exato)
  const index = parseInt(text.trim());
  if (!isNaN(index) && index > 0 && index <= options.length) {
    selectedOption = options[index - 1];
  } else {
    selectedOption = options.find(
      (opt: any) => opt.label.toLowerCase().trim() === text.toLowerCase().trim()
    );
  }

  if (selectedOption && selectedOption.next_node) {
    // --- LÓGICA DE PERSISTÊNCIA DE DADOS (CONTEXTO) ---
    let newSummary = session.summary || "";

    // 1. Se confirmou o nome no nó CONFIRMING_NAME, salva no perfil imediatamente
    if (
      session.status === "CONFIRMING_NAME" &&
      (selectedOption.label.toLowerCase().includes("sim") || index === 1)
    ) {
      const nameMatch = newSummary.match(/Nome informado: ([^\n]+)/);
      if (nameMatch) {
        const capturedName = nameMatch[1];
        console.log(`💾 Salvando nome confirmado no perfil: ${capturedName}`);
        await supabase
          .from("profiles")
          .update({ nome_completo: capturedName })
          .eq("telefone", phone);
        if (profile) profile.nome_completo = capturedName; // Atualiza localmente
      }
    }

    // 2. Registrar outras escolhas importantes no sumário para uso em variáveis de nós futuros
    const currentStatus = session.status;
    if (currentStatus === "WAITING_EXPERIENCE")
      newSummary += `\nExperiência: ${selectedOption.label}`;
    if (currentStatus === "WAITING_GOAL") {
      const goal = selectedOption.label.replace(/^\d+[\s\.\)]+/, "").trim();
      newSummary += `\nObjetivo: ${goal}`;
    }
    if (currentStatus === "WAITING_TRIAL_DAY") newSummary += `\nDia: ${selectedOption.label}`;
    if (currentStatus === "WAITING_TRIAL_TIME") newSummary += `\nHora: ${selectedOption.label}`;

    // Buscar próximo nó
    const nextNode = await getBotNode(selectedOption.next_node);

    if (nextNode) {
      console.log(`➡️ Transição de Fluxo: ${session.status} -> ${nextNode.node_key}`);

      // Preparar variáveis para o template
      let displayName = profile?.nome_completo?.split(" ")[0];
      if (!displayName && newSummary) {
        const nMatch = newSummary.match(/Nome informado: ([^\n]+)/);
        if (nMatch) displayName = nMatch[1].split(" ")[0];
      }

      let goalName = profile?.objetivo;
      if (!goalName && newSummary) {
        const gMatch = newSummary.match(/Objetivo: ([^\n]+)/);
        if (gMatch) goalName = gMatch[1];
      }

      let trialDay = "seu dia";
      const dayMatch = newSummary.match(/Dia: ([^\n]+)/);
      if (dayMatch) trialDay = dayMatch[1];

      const vars = {
        name: displayName || "atleta",
        goal: goalName || "seu objetivo",
        day: trialDay,
      };

      // Se for nó de pagamento, handlePaymentNode assume o controle
      if (nextNode.category === "pagamento") {
        return await handlePaymentNode(session, phone, nextNode, profile);
      }

      // Atualizar sessão (status e sumário)
      const updateData: any = { status: nextNode.node_key };
      if (newSummary !== (session.summary || "")) updateData.summary = newSummary;

      // Se for um nó final (ex: TRIAL_CONFIRMED), poderíamos fechar a sessão,
      // mas vamos manter aberta para o menu principal se necessário.
      await supabase.from("support_sessions").update(updateData).eq("id", session.id);

      // Enviar mensagem
      const responseText = processTemplate(nextNode.content, vars);
      let finalMsg = responseText;

      if (nextNode.options && nextNode.options.length > 0) {
        finalMsg +=
          "\n\n" +
          nextNode.options
            .map((opt: any, i: number) => {
              const label = opt.label.trim();
              // Evita numeração dupla: se já começa com "1" ou "1️⃣" (emoji de número) ou "1." ou "1)"
              if (/^(\d[\.\)]?|[\u0030-\u0039]\ufe0f?\u20e3)/.test(label)) return label;
              return `${i + 1}️⃣ ${label}`;
            })
            .join("\n");
      }

      await sendZapiText(phone, finalMsg);
      await saveMessage(session.id, text, "STUDENT");
      await saveMessage(session.id, finalMsg, "BOT");
      await updateSessionInteraction(session.id);
      return true;
    }
  }

  // Se o nó tem opções mas a resposta foi inválida
  if (text.length < 30) {
    const invalidMsg = "Por favor, escolha uma das opções acima (responda apenas o número).";
    await sendZapiText(phone, invalidMsg);
    return true;
  }

  return false;
}

// Helper: Calcular distância entre coordenadas
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Helper: Salvar mensagem no banco
async function saveMessage(
  sessionId: string,
  content: string,
  senderType: string,
  mediaUrl?: string,
  mediaType?: string
) {
  await supabase.from("support_messages").insert([
    {
      session_id: sessionId,
      content: content,
      sender_type: senderType,
      media_url: mediaUrl,
      media_type: mediaType,
    },
  ]);
}

// Helper: Atualizar última interação da sessão
async function updateSessionInteraction(sessionId: string, updates: any = {}) {
  await supabase
    .from("support_sessions")
    .update({
      last_interaction: new Date().toISOString(),
      ...updates,
    })
    .eq("id", sessionId);

  // Agendar recuperação de lead (carrinho abandonado/inatividade)
  await scheduleAbandonedCart(sessionId);
}

// Helper: Gerar PIX Automático via OpenPix
async function triggerAutomaticPayment(session: any, phone: string, node: any, profile: any) {
  // Tentar inferir o plano do node_key ou content
  const nodeKeyLower = node.node_key.toLowerCase();
  const planId = nodeKeyLower.includes("anual")
    ? "anual"
    : nodeKeyLower.includes("semestral")
      ? "semestral"
      : nodeKeyLower.includes("trimestral")
        ? "trimestral"
        : nodeKeyLower.includes("mensal")
          ? "mensal"
          : nodeKeyLower.includes("teste")
            ? "plano_teste"
            : "mensal";

  const msgAguarde = "Certo! Estou gerando seu PIX aqui, um momento... ⏳";
  await sendZapiText(phone, msgAguarde);

  try {
    console.log(`🤖 Bot gerando PIX: Plano=${planId}, Atleta=${profile.nome_completo || phone}`);

    const { data, error } = await supabase.functions.invoke("create-openpix-charge", {
      body: {
        planId,
        userId: profile?.user_id,
        customer: {
          name: profile?.nome_completo || "Atleta Bora Correr",
          taxID: profile?.cpf,
          phone: phone,
          email: profile?.email || `${phone}@boracorrer.club`,
        },
      },
    });

    if (error || !data || !data.brCode) {
      console.error("Erro invoke OpenPix:", error, data);
      throw new Error(error?.message || "Falha ao gerar código PIX");
    }

    const valueFormatted = (data.value / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    const responseMsg = `✅ *PIX GERADO COM SUCESSO!*\n\n*Plano:* ${planId.toUpperCase()}\n*Valor:* ${valueFormatted}\n\nCopie e cole o código abaixo no seu app do banco:`;

    await sendZapiText(phone, responseMsg);
    await sendZapiText(phone, data.brCode);

    if (data.qrCodeImage) {
      await sendZapiText(phone, "Se preferir, aqui está o QR Code:");
      await sendZapiImage(phone, data.qrCodeImage, "QR Code Pagamento - Bora Correr Club");
    }

    const tutorialMsg =
      "Assim que o pagamento for confirmado, seu acesso será liberado automaticamente! 🚀 Te vejo no treino!";
    await sendZapiText(phone, tutorialMsg);

    // Atualizar status para WAITING_MENU para não ficar preso se o usuário responder algo depois
    await supabase.from("support_sessions").update({ status: "WAITING_MENU" }).eq("id", session.id);

    return true;
  } catch (err) {
    console.error("🚨 Erro crítico ao gerar PIX via bot:", err);
    await sendZapiText(
      phone,
      "Puxa, tive um probleminha ao gerar seu PIX automaticamente. 😕 Mas não se preocupe, já avisei o financeiro para te enviar manualmente agora mesmo!"
    );

    // Notificar admin (Financeiro)
    await sendZapiText(
      ADMIN_NUMBERS.FINANCEIRO,
      `⚠️ ERRO PIX BOT: Falha ao gerar PIX para ${profile?.nome_completo || phone} (${phone})\nPlano: ${planId}\nErro: ${err.message}`
    );

    // Transferir para o financeiro
    await supabase
      .from("support_sessions")
      .update({
        status: "ACTIVE",
        sector: "FINANCEIRO",
        admin_phone: ADMIN_NUMBERS.FINANCEIRO,
      })
      .eq("id", session.id);

    return true;
  }
}

// Helper: Processar nó de pagamento
async function handlePaymentNode(session: any, phone: string, node: any, profile: any) {
  if (!profile?.cpf) {
    // Mudar status para pedir CPF
    await supabase
      .from("support_sessions")
      .update({
        status: `WAITING_PAYMENT_CPF_${node.node_key}`,
      })
      .eq("id", session.id);

    const msg =
      "Para gerar seu código PIX, preciso apenas que digite seu *CPF* (apenas os números), por favor:";
    await sendZapiText(phone, msg);
    await saveMessage(session.id, msg, "BOT");
    return true;
  }

  // Já tem CPF, gerar o PIX direto
  return await triggerAutomaticPayment(session, phone, node, profile);
}

// Helper: Agendar recuperação de lead
async function scheduleAbandonedCart(sessionId: string) {
  // Buscar telefone do estudante
  const { data: sess } = await supabase
    .from("support_sessions")
    .select("student_phone, status")
    .eq("id", sessionId)
    .single();
  if (!sess || ["ACTIVE", "CLOSED", "WAITING_MENU"].includes(sess.status)) {
    // Se já está sendo atendido, fechou ou está no menu, não precisa de recuperação de fluxo
    await supabase
      .from("follow_ups")
      .delete()
      .eq("session_id", sessionId)
      .eq("type", "ABANDONED_CART");
    return;
  }

  // Remover agendamentos antigos de recuperação desta sessão
  await supabase
    .from("follow_ups")
    .delete()
    .eq("session_id", sessionId)
    .eq("type", "ABANDONED_CART");

  // Agendar para 2 horas no futuro
  const scheduledFor = new Date();
  scheduledFor.setHours(scheduledFor.getHours() + 2);

  await supabase.from("follow_ups").insert([
    {
      session_id: sessionId,
      student_phone: sess.student_phone,
      type: "ABANDONED_CART",
      scheduled_for: scheduledFor.toISOString(),
      status: "PENDING",
    },
  ]);
}

// Helper: Calcular próxima data para um dia da semana
function getNextWeekdayDate(weekdayName: string): string {
  const days = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ];
  const targetDay = days.indexOf(weekdayName);
  const now = new Date();

  // Ajustar para fuso de SP (UTC-3) para cálculos precisos se necessário
  // Por simplicidade, usamos o local do servidor Deno que costuma ser UTC
  const resultDate = new Date();
  resultDate.setDate(now.getDate() + ((targetDay + 7 - now.getDay()) % 7));

  // Se for o mesmo dia e já passou das 20h, agenda para a próxima semana
  if (resultDate.toDateString() === now.toDateString() && now.getHours() >= 20) {
    resultDate.setDate(resultDate.getDate() + 7);
  }

  return resultDate.toISOString().split("T")[0]; // Retorna YYYY-MM-DD
}

// Helper: Verificar horário de atendimento
function isBusinessHours(config: any): boolean {
  if (!config?.business_hours?.enabled) return true;

  const now = new Date();
  const currentDay = now.getDay(); // 0 = Domingo, 1 = Segunda, etc.
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;

  const businessHours = config.business_hours;
  const days = businessHours.days || [1, 2, 3, 4, 5]; // Seg-Sex por padrão

  if (!days.includes(currentDay)) return false;

  const [startHour, startMin] = (businessHours.start || "08:00").split(":").map(Number);
  const [endHour, endMin] = (businessHours.end || "18:00").split(":").map(Number);
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;

  return currentTime >= startTime && currentTime <= endTime;
}

serve(async (req) => {
  try {
    const body = await req.json();
    console.log("📦 RECEBIDO:", JSON.stringify(body));

    let phone = body.phone || body.chatId?.split("@")[0] || body.sender?.split("@")[0];

    // 1. Filtros de Segurança
    if (body.fromMe === true) {
      console.log(`ℹ️ Mensagem enviada pelo próprio bot (${phone}). Ignorando.`);
      return new Response("OK", { status: 200 });
    }

    if (phone === body.connectedPhone) {
      console.log(`ℹ️ Mensagem do próprio número conectado (${phone}). Ignorando.`);
      return new Response("OK", { status: 200 });
    }

    if (!phone) return new Response("OK", { status: 200 });

    if (String(phone).includes("@g.us") || body.isGroup === true) {
      console.log(`❌ Grupo ignorado (${phone})`);
      return new Response("OK", { status: 200 });
    }

    // 2. Extração de Texto / Áudio
    let text = body.text;
    if (text && typeof text === "object" && text.message) {
      text = text.message;
    } else if (body.message?.text?.message) {
      text = body.message.text.message;
    }
    text = String(text || "").trim();

    // Ignorar mensagens de "Aguardando Mídia" do Z-API
    if (body.waitingMessage === true) {
      console.log(`⏳ Aguardando download de mídia do Z-API (${phone})...`);
      return new Response("OK", { status: 200 });
    }

    // Extração robusta do link de áudio
    let audioUrl = null;
    if (body.audio) {
      audioUrl =
        body.audio.audioUrl ||
        body.audio.url ||
        (typeof body.audio === "string" ? body.audio : null);
    }
    if (!audioUrl && body.message?.audio) {
      audioUrl = body.message.audio.audioUrl || body.message.audio.url;
    }

    if (audioUrl) {
      console.log(`🎙️ Áudio detectado de ${phone} | URL: ${audioUrl}`);

      // Busca config para pegar chaves se houver no banco
      const { data: st } = await supabase
        .from("support_settings")
        .select("value")
        .eq("key", "general_config")
        .single();
      const dbAiConfig = st?.value?.ai_config || {};

      const transcriptionConfig = {
        openai_key: dbAiConfig.openai_key || OPENAI_API_KEY,
        gemini_key: dbAiConfig.gemini_key || Deno.env.get("GEMINI_API_KEY"),
        provider: dbAiConfig.provider || "openai",
      };

      const transcript = await transcribeAudio(audioUrl, transcriptionConfig);
      if (transcript) {
        console.log(`📝 Transcrição: "${transcript}"`);
        text = transcript;
      } else {
        console.warn("⚠️ Transcrição falhou ou áudio sem fala.");
        text = "SOLICITAR_REPETICAO_AUDIO";
      }
    }

    const wasAudio = !!audioUrl;

    if (text === "SOLICITAR_REPETICAO_AUDIO") {
      const retryMsg =
        "Sinto muito, não consegui entender o áudio. 😕\n\nPoderia repetir ou escrever sua mensagem?";
      await sendZapiText(phone, retryMsg);
      return new Response("OK", { status: 200 });
    }

    if (!text && !audioUrl && !body.poll) {
      console.log("ℹ️ Payload não identificado ou mensagem vazia.");
      return new Response("OK", { status: 200 });
    }

    // --- 2.5 BUSCAR DADOS DE CONTEXTO (CONSOLIDADO) ---
    // Buscar Configurações Gerais
    const { data: settingsRow } = await supabase
      .from("support_settings")
      .select("*")
      .eq("key", "general_config")
      .single();

    const config = settingsRow?.value || {};
    const aiConfig = config.ai_config || {};

    // Busca Sessão e Perfil do Aluno
    const { data: session } = await supabase
      .from("support_sessions")
      .select("*")
      .eq("student_phone", phone)
      .neq("status", "CLOSED")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("telefone", phone)
      .single();

    console.log(
      `👤 Contexto [${phone}]: Sessão=${session?.id || "Nova"}, Perfil=${profile?.nome_completo || "Desconhecido"}`
    );

    // Verificação de Admin
    const isAdmin = Object.values(ADMIN_NUMBERS).includes(phone);

    // --- RESPOSTA AOS CLIQUES DO MENU ---
    if (body.optionId) {
      const optionId = body.optionId;
      let menuResponse = "";
      console.log(`🔘 Opção de menu selecionada: ${optionId} por ${phone}`);

      switch (optionId) {
        case "1": // Planilha
          menuResponse = `📑 *Sua Planilha:* \nVocê pode acessar seus treinos no nosso App ou pelo link enviado no seu e-mail de boas-vindas. Se não encontrar, mande uma mensagem com a palavra *TREINO*.`;
          break;
        case "2": // Localização
          menuResponse = `📍 *Onde Treinamos:* \nPraça em frente a Moby Dick (Praia da Costa). Veja no mapa: ${LINKS.MAPS}`;
          break;
        case "3": // Ranking
          // Chama a lógica de ranking reaproveitando o que já temos ou simplificando
          text = "!ranking";
          break;
        case "4": // Financeiro
          menuResponse = `💰 *Chave PIX:* \n\`${LINKS.PIX}\` \n(Bora Correr Club LTDA)`;
          break;
        case "5": // Loja
          menuResponse = `👕 *Nossa Loja:* \nConfira nossos uniformes e acessórios exclusivos: ${LINKS.LOJA}`;
          break;
        case "6": // Humano
          menuResponse = `🗣️ Sem problemas! Vou avisar os professores que você precisa de ajuda. Enquanto isso, pode descrever sua dúvida aqui?`;
          // Criar sessão de atendimento humano se não existir
          await supabase.from("support_sessions").upsert([
            {
              student_phone: phone,
              status: "ACTIVE",
              sector: "COMUNICACAO",
            },
          ]);
          break;
      }

      if (menuResponse) {
        await sendZapiText(phone, menuResponse);
        return new Response("OK", { status: 200 });
      }
      // Se optionId for 3 (ranking), deixamos o fluxo seguir para o tratamento de "!" que já existe
    }

    // --- GESTÃO DE CHECK-IN POR LOCALIZAÇÃO ---
    if (body.location) {
      const { latitude, longitude } = body.location;
      const distance = getDistance(latitude, longitude, CLUB_LOCATION.lat, CLUB_LOCATION.lng);

      console.log(
        `📍 Localização recebida de ${phone}: ${latitude}, ${longitude} (Distância: ${distance.toFixed(0)}m)`
      );

      if (distance <= CLUB_LOCATION.radius) {
        const now = new Date();
        const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
        const dayName = days[now.getDay()];

        await supabase.from("attendance").insert([
          {
            student_phone: phone,
            latitude,
            longitude,
            distance_meters: distance,
            training_day: dayName,
          },
        ]);

        const checkinMsg = `✅ *CHECK-IN REALIZADO!* \n\nBom treino! Sua presença foi registrada com sucesso na Praça hoje (${dayName}). Bora correr! 🏃‍♂️💨`;
        await sendZapiText(phone, checkinMsg);
        return new Response("OK", { status: 200 });
      } else {
        await sendZapiText(
          phone,
          "📍 Vi sua localização, mas você parece estar um pouco longe da Praça. Chegue mais perto para validar seu check-in! 🏃‍♂️"
        );
        return new Response("OK", { status: 200 });
      }
    }

    // Se não tem texto E não é localização, ignora
    if (!text && !body.location) return new Response("OK", { status: 200 });

    // --- COMANDOS DE AUTOATENDIMENTO (!) ---
    if (text.startsWith("!")) {
      const command = text.toLowerCase().split(" ")[0];
      let cmdResponse = "";

      switch (command) {
        case "!planilha":
          cmdResponse = `📑 *Sua Planilha:* \nVocê pode acessar seus treinos no nosso App ou pelo link enviado no seu e-mail de boas-vindas. Se não encontrar, mande uma mensagem com a palavra *TREINO*.`;
          break;
        case "!pix":
          cmdResponse = `💰 *Chave PIX:* \n\`${LINKS.PIX}\` \n(Bora Correr Club LTDA)`;
          break;
        case "!loja":
          cmdResponse = `👕 *Nossa Loja:* \nConfira nossos uniformes e acessórios exclusivos: ${LINKS.LOJA}`;
          break;
        case "!ajuda":
          cmdResponse = `🤖 *Comandos Disponíveis:* \n\n!planilha - Ver seus treinos\n!pix - Dados de pagamento\n!loja - Ver produtos\n!local - Onde treinamos\n!ranking - Ver destaques do mês`;
          break;
        case "!local":
          cmdResponse = `📍 *Onde Treinamos:* \nPraça em frente a Moby Dick (Praia da Costa). Veja no mapa: ${LINKS.MAPS}`;
          break;
        case "!ranking":
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);

          const { data: attendanceData } = await supabase
            .from("attendance")
            .select("student_phone")
            .gte("created_at", startOfMonth.toISOString());

          if (!attendanceData?.length) {
            cmdResponse = `🏆 *Ranking do Mês:* \nAinda não temos check-ins este mês. Seja o primeiro! 🏃‍♂️💨`;
          } else {
            const counts: Record<string, number> = {};
            attendanceData.forEach((a) => {
              counts[a.student_phone] = (counts[a.student_phone] || 0) + 1;
            });

            const sorted = Object.entries(counts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5);
            let rankingStr = `🏆 *TOP 5 DO MÊS* 🏃‍♂️💨\n\n`;

            for (let i = 0; i < sorted.length; i++) {
              const [phone, count] = sorted[i];
              const { data: p } = await supabase
                .from("profiles")
                .select("nome_completo")
                .eq("telefone", phone)
                .single();
              const name = p?.nome_completo?.split(" ")[0] || phone;
              const medals = ["🥇", "🥈", "🥉", "👤", "👤"];
              rankingStr += `${medals[i]} *${name}*: ${count} treinos\n`;
            }
            cmdResponse = rankingStr + `\nContinue focado! 🔥`;
          }
          break;
        default:
          cmdResponse = "❌ Comando não reconhecido. Digite !ajuda para ver o que posso fazer.";
      }

      await sendZapiText(phone, cmdResponse);
      return new Response("OK", { status: 200 });
    }

    // --- MENU INTERATIVO (SAUDAÇÕES / FALLBACK) ---
    // --- ADMIN RESPONDING TO ACTIVE SESSIONS ---
    if (isAdmin && text) {
      console.log("👑 Mensagem de ADMIN detectada antes do flow offline.");

      // Buscar sessões ACTIVE onde este admin está atendendo
      const { data: activeSessions } = await supabase
        .from("support_sessions")
        .select("*")
        .eq("status", "ACTIVE")
        .or(`sector.eq.FINANCEIRO,sector.eq.COMUNICACAO,sector.like.TREINADOR_%`)
        .order("last_interaction", { ascending: false })
        .limit(1);

      if (activeSessions && activeSessions.length > 0) {
        const targetSession = activeSessions[0];
        const studentPhone = targetSession.student_phone;

        // Salvar mensagem do admin
        await saveMessage(targetSession.id, text, "ADMIN");
        await updateSessionInteraction(targetSession.id);

        // Encaminhar para o aluno
        await sendZapiText(studentPhone, text);
        console.log(`✅ Mensagem do admin encaminhada para ${studentPhone}`);

        return new Response("OK", { status: 200 });
      }
    }

    // --- MODO APENAS NOTIFICAÇÕES (FLUXO CONVERSACIONAL DESATIVADO PARA TODOS) ---
    if (text || wasAudio) {
      console.log(`ℹ️ [MODO NOTIFICAÇÕES] Ignorando conversa de ${phone} e enviando aviso.`);

      const avisoBot =
        "Olá! 👋 Este número é exclusivo para o envio de *avisos, cobranças e notificações* automáticas. Como sou um assistente virtual 🤖, não consigo responder mensagens por aqui.\n\nPara dúvidas ou atendimento, por favor, chame a Isa da Comunicação no WhatsApp: *(13) 99689-0611* 🏃‍♂️💨";

      // Verificar se o bot já enviou mensagem nos últimos 3 minutos para não ficar repetindo a cada mensagem (spam)
      let deveResponder = true;
      if (session?.last_interaction) {
        const diffMinutos =
          (new Date().getTime() - new Date(session.last_interaction).getTime()) / 60000;
        if (diffMinutos < 3) {
          deveResponder = false;
        }
      }

      if (deveResponder) {
        await sendZapiText(phone, avisoBot);
        // Atualizar/Criar sessão para evitar flood de avisos (spam)
        if (session) {
          await supabase
            .from("support_sessions")
            .update({ last_interaction: new Date().toISOString() })
            .eq("id", session.id);
        } else {
          await supabase
            .from("support_sessions")
            .insert([
              {
                student_phone: phone,
                status: "BOT_OFFLINE",
                last_interaction: new Date().toISOString(),
              },
            ]);
        }
      }

      return new Response("OK", { status: 200 });
    }

    const greetings = [
      "oi",
      "ola",
      "olá",
      "bom dia",
      "boa tarde",
      "boa noite",
      "menu",
      "ajuda",
      "inicio",
      "início",
      "começar",
      "começar",
      "oi bot",
      "olá bot",
    ];
    if (greetings.includes(text.toLowerCase()) || (text.length < 15 && !session)) {
      console.log(`👋 [${phone}] Saudação detectada: "${text}"`);

      // Tentamos buscar 'START', 'INICIO' ou 'WAITING_NAME' (legado)
      let startNode = await getBotNode("START");
      if (!startNode) startNode = await getBotNode("INICIO");
      if (!startNode) startNode = await getBotNode("WAITING_NAME");

      if (startNode) {
        console.log(`✅ Nó inicial encontrado: ${startNode.node_key}`);
        const vars = { name: profile?.nome_completo?.split(" ")[0] || "atleta" };
        const welcomeMsg = processTemplate(startNode.content, vars);
        let finalMsg = welcomeMsg;
        if (startNode.options && startNode.options.length > 0) {
          finalMsg +=
            "\n\n" +
            startNode.options.map((opt: any, i: number) => `${i + 1}️⃣ ${opt.label}`).join("\n");
        }

        const sid =
          session?.id ||
          (
            await supabase
              .from("support_sessions")
              .insert([{ student_phone: phone, status: startNode.node_key }])
              .select()
              .single()
          ).data?.id;

        if (sid) {
          await supabase
            .from("support_sessions")
            .update({ status: startNode.node_key })
            .eq("id", sid);
          // Salvar histórico
          await saveMessage(sid, text, "STUDENT");
          await saveMessage(sid, finalMsg, "BOT");
        }

        await sendZapiText(phone, finalMsg);
        return new Response("OK", { status: 200 });
      }

      console.log(
        `⚠️ Nenhum nó inicial (START/INICIO/WAITING_NAME) encontrado no banco. Usando fallback fixo.`
      );

      // Fallback para menu fixo se não houver START node no banco
      const menuOptions = [
        { id: "1", title: "📑 Minha Planilha", description: "Ver treinos e orientações" },
        { id: "2", title: "📍 Localização", description: "Onde treinamos na Praça" },
        { id: "3", title: "🏆 Ranking", description: "Destaques de presença do mês" },
        { id: "4", title: "💰 Financeiro / PIX", description: "Chave PIX e pagamentos" },
        { id: "5", title: "👕 Loja BCC", description: "Uniformes e acessórios" },
        { id: "6", title: "🗣️ Falar com Humano", description: "Dúvidas com Diego ou Caique" },
      ];

      await sendZapiMenu(
        phone,
        `Olá! 👋 Eu sou o assistente do *Bora Correr Club*.\n\nComo posso te ajudar hoje? Escolha uma opção abaixo:`,
        menuOptions,
        "Menu Principal"
      );
      return new Response("OK", { status: 200 });
    }

    // Bloco admin movido para cima antes do modo offline

    // 5. Busca Sessão e Perfil do Aluno (Já buscado no início)

    // 6. ANÁLISE DE SENTIMENTO (Prioridade Alta)
    const sentiment = await analyzeSentiment(
      text,
      aiConfig.openai_key || OPENAI_API_KEY,
      aiConfig.provider || "openai"
    );
    console.log(`😊 Sentimento: ${sentiment.label} (${sentiment.score})`);

    // Se sessão existe, atualizar sentimento
    if (session) {
      await supabase
        .from("support_sessions")
        .update({
          sentiment_score: sentiment.score,
          sentiment_label: sentiment.label,
        })
        .eq("id", session.id);
    }

    // Se NEGATIVO e não está em sessão ACTIVE, prioriza humano
    if (sentiment.label === "NEGATIVO" && session?.status !== "ACTIVE") {
      console.log("🚨 SENTIMENTO NEGATIVO DETECTADO! Priorizando atendimento humano.");

      const sessionId =
        session?.id ||
        (
          await supabase
            .from("support_sessions")
            .insert([
              {
                student_phone: phone,
                status: "ACTIVE",
                sector: "COMUNICACAO",
                sentiment_score: sentiment.score,
                sentiment_label: sentiment.label,
                summary: `⚠️ URGENTE: Cliente com sentimento negativo detectado.`,
              },
            ])
            .select()
            .single()
        ).data?.id;

      await saveMessage(sessionId, text, "STUDENT");
      await sendZapiText(
        phone,
        "Entendo sua situação. Vou chamar alguém da equipe para te ajudar imediatamente. Por favor, aguarde um momento. 🙏"
      );

      // Notificar admin (Isa - Comunicação)
      await sendZapiText(
        ADMIN_NUMBERS.COMUNICACAO,
        `🚨 URGENTE: Cliente ${profile?.nome_completo || phone} está insatisfeito!\n\nMensagem: "${text}"\n\nPor favor, atenda o mais rápido possível.`
      );

      return new Response("OK", { status: 200 });
    }

    // 7. Se a sessão está ACTIVE, um humano assumiu. O bot fica quieto.
    if (session?.status === "ACTIVE") {
      console.log("🤫 Sessão ATIVA (Humano no comando). Bot em silêncio.");
      await saveMessage(session.id, text, "STUDENT");
      await updateSessionInteraction(session.id);
      return new Response("OK", { status: 200 });
    }

    // 8. Verificar Horário de Atendimento
    if (!isBusinessHours(config)) {
      console.log("🕐 Fora do horário de atendimento.");
      const offlineMsg =
        config.offline_message ||
        "No momento estamos fora do horário de atendimento. Nosso horário é de Segunda a Sexta, das 08h às 18h. Deixe sua mensagem que responderemos em breve!";

      const sessionId =
        session?.id ||
        (
          await supabase
            .from("support_sessions")
            .insert([
              {
                student_phone: phone,
                status: "BOT",
              },
            ])
            .select()
            .single()
        ).data?.id;

      await saveMessage(sessionId, text, "STUDENT");
      await saveMessage(sessionId, offlineMsg, "BOT");
      await sendZapiText(phone, offlineMsg);

      return new Response("OK", { status: 200 });
    }

    // 9. GATILHOS SECRETOS (Prioridade Máxima) - AGORA SALVAM NO BANCO
    const lowerText = text.toLowerCase();
    let triggerResponse = null;

    if (
      lowerText.includes("pix") ||
      lowerText.includes("valor") ||
      lowerText.includes("preço") ||
      lowerText.includes("plano")
    ) {
      triggerResponse = `💰 Que legal seu interesse! Nossos planos começam em R$ 149,90. Confira todos os detalhes e inscreva-se aqui: ${LINKS.PLANOS}`;
    } else if (
      lowerText.includes("onde") ||
      lowerText.includes("local") ||
      lowerText.includes("ibirapuera")
    ) {
      triggerResponse = `📍 Nosso ponto de encontro principal é o Parque Ibirapuera! Veja a localização exata no mapa: ${LINKS.MAPS}`;
    } else if (
      lowerText.includes("insta") ||
      lowerText.includes("foto") ||
      lowerText.includes("instagram")
    ) {
      triggerResponse = `📸 Siga a gente no Instagram para ver os treinos e novidades: ${LINKS.INSTAGRAM}`;
    }

    if (triggerResponse) {
      const sessionId =
        session?.id ||
        (
          await supabase
            .from("support_sessions")
            .insert([
              {
                student_phone: phone,
                status: "BOT",
              },
            ])
            .select()
            .single()
        ).data?.id;

      await saveMessage(sessionId, text, "STUDENT");
      await saveMessage(sessionId, triggerResponse, "BOT");
      await updateSessionInteraction(sessionId);
      await sendZapiText(phone, triggerResponse);

      return new Response("OK", { status: 200 });
    }

    // --- SISTEMA DE FLUXO GENÉRICO (DB) - PRIORIDADE ALTA ---
    // Se a sessão está em algum status que existe no Bot Flow Nodes, processa a lógica de botões antes do hardcoded
    // EXCEÇÃO: Estados de agendamento de aula experimental que possuem lógica complexa hardcoded
    const skipGeneric = ["WAITING_TRIAL_INTEREST", "WAITING_TRIAL_DAY", "WAITING_TRIAL_TIME"];
    let isFlowHandled = false;

    if (!skipGeneric.includes(session?.status)) {
      isFlowHandled = await handleGenericFlow(session, phone, text, profile);
    } else {
      console.log(`ℹ️ Pulando fluxo genérico para estado hardcoded: ${session.status}`);
    }

    if (isFlowHandled) {
      return new Response("OK", { status: 200 });
    }

    // --- SISTEMA DE CPF PARA PAGAMENTO ---
    if (session?.status?.startsWith("WAITING_PAYMENT_CPF_")) {
      const nodeKey = session.status.replace("WAITING_PAYMENT_CPF_", "");
      const cpf = text.replace(/\D/g, "");

      if (cpf.length !== 11) {
        const retryMsg =
          "CPF inválido. Por favor, digite os 11 números do seu CPF para que eu possa gerar o PIX:";
        await sendZapiText(phone, retryMsg);
        await saveMessage(session.id, text, "STUDENT");
        await saveMessage(session.id, retryMsg, "BOT");
        return new Response("OK", { status: 200 });
      }

      console.log(`✅ CPF Recebido via Bot: ${cpf} de ${phone}`);

      // Salvar CPF e prosseguir
      await supabase.from("profiles").update({ cpf }).eq("telefone", phone);

      const node = await getBotNode(nodeKey);
      if (node) {
        await triggerAutomaticPayment(session, phone, node, { ...profile, cpf });
      } else {
        await sendZapiText(phone, "Certo! Gravei seu CPF. Como posso ajudar agora?");
        await supabase
          .from("support_sessions")
          .update({ status: "WAITING_MENU" })
          .eq("id", session.id);
      }
      return new Response("OK", { status: 200 });
    }

    // 10. FLUXO: ALUNO NOVO (Onboarding Completo com Qualificação)
    // Aceita START, INICIO ou WAITING_NAME como o início do cadastro
    const isInitialState = !session || ["START", "INICIO", "WAITING_NAME"].includes(session.status);

    if (isInitialState) {
      // Se já tem perfil com nome, pular onboarding e criar sessão direto no menu
      if (profile?.nome_completo) {
        console.log("👤 Usuário conhecido retornando. Pulando onboarding.");

        const newSession = await supabase
          .from("support_sessions")
          .insert([
            {
              student_phone: phone,
              status: "WAITING_MENU",
            },
          ])
          .select()
          .single();

        const welcomeBackMsg = `Olá novamente, *${profile.nome_completo}*! 😊\n\nÉ um prazer ter você de volta! Como posso ajudar hoje?\n\n*Menu Principal:*\n1️⃣ Falar com Financeiro\n2️⃣ Falar com Comunicação\n3️⃣ Falar com Treinador\n4️⃣ Outras dúvidas\n\nDigite o número da opção desejada.`;

        await saveMessage(newSession.data.id, text, "STUDENT");
        await saveMessage(newSession.data.id, welcomeBackMsg, "BOT");
        await updateSessionInteraction(newSession.data.id);
        await sendZapiText(phone, welcomeBackMsg);

        return new Response("OK", { status: 200 });
      }

      // Usuário novo - iniciar onboarding
      if (!session) {
        // Primeira mensagem: Pergunta o nome
        const newSession = await supabase
          .from("support_sessions")
          .insert([
            {
              student_phone: phone,
              status: "WAITING_NAME",
            },
          ])
          .select()
          .single();

        const node = await getBotNode("WAITING_NAME");
        const welcomeMsg =
          node?.content ||
          "Olá! Bem-vindo ao *Bora Correr Club*! 🏃‍♂️🚀\n\nEu sou o assistente virtual da equipe. Para começarmos, qual é o seu nome?";

        const sessionId = newSession.data.id;
        await saveMessage(
          sessionId,
          text,
          "STUDENT",
          audioUrl || undefined,
          wasAudio ? "audio" : undefined
        );
        await saveMessage(sessionId, welcomeMsg, "BOT");
        await sendZapiText(phone, welcomeMsg);

        return new Response("OK", { status: 200 });
      } else {
        // Segunda mensagem: Recebeu o nome - CONFIRMAÇÃO
        const name = text.split("\n")[0].trim();

        await supabase
          .from("support_sessions")
          .update({
            status: "CONFIRMING_NAME",
            summary: `Nome informado: ${name}`,
          })
          .eq("id", session.id);

        const node = await getBotNode("CONFIRMING_NAME");
        const confirmMsg = processTemplate(
          node?.content ||
            `Prazer em conhecê-lo! Só para confirmar, seu nome é *${name}*, correto?\n\nResponda:\n✅ Sim\n❌ Não`,
          { name }
        );
        await saveMessage(session.id, text, "STUDENT");
        await saveMessage(session.id, confirmMsg, "BOT");
        await updateSessionInteraction(session.id);
        await sendZapiText(phone, confirmMsg);

        return new Response("OK", { status: 200 });
      }
    }

    // 11. CONFIRMAÇÃO DE NOME
    if (session?.status === "CONFIRMING_NAME") {
      const lowerResponse = text.toLowerCase();

      if (lowerResponse.includes("sim") || lowerResponse === "s" || lowerResponse === "✅") {
        // Nome confirmado - salvar no perfil
        const confirmedName = session.summary?.replace("Nome informado: ", "") || text;
        await supabase.from("profiles").upsert(
          [
            {
              telefone: phone,
              nome_completo: confirmedName,
            },
          ],
          { onConflict: "telefone" }
        );

        await supabase
          .from("support_sessions")
          .update({
            status: "WAITING_EXPERIENCE",
          })
          .eq("id", session.id);

        const node = await getBotNode("WAITING_EXPERIENCE");
        const expMsg = processTemplate(
          node?.content ||
            `Perfeito, *${confirmedName}*! 🤝\n\nAgora me conta: você já tem experiência com corrida ou está começando do zero?\n\n1️⃣ Já corro regularmente\n2️⃣ Estou começando agora`,
          { name: confirmedName }
        );
        await saveMessage(session.id, text, "STUDENT");
        await saveMessage(session.id, expMsg, "BOT");
        await updateSessionInteraction(session.id);
        await sendZapiText(phone, expMsg);

        return new Response("OK", { status: 200 });
      } else if (
        lowerResponse.includes("não") ||
        lowerResponse.includes("nao") ||
        lowerResponse === "n" ||
        lowerResponse === "❌"
      ) {
        // Nome incorreto - pedir novamente
        await supabase
          .from("support_sessions")
          .update({
            status: "WAITING_NAME",
            summary: null,
          })
          .eq("id", session.id);

        const retryMsg = "Sem problemas! Por favor, digite seu nome correto:";
        await saveMessage(session.id, text, "STUDENT");
        await saveMessage(session.id, retryMsg, "BOT");
        await updateSessionInteraction(session.id);
        await sendZapiText(phone, retryMsg);

        return new Response("OK", { status: 200 });
      }
    }

    // 12. QUALIFICAÇÃO: Experiência
    if (session?.status === "WAITING_EXPERIENCE") {
      let experience = "";
      if (text === "1" || lowerText.includes("já corro") || lowerText.includes("regularmente")) {
        experience = "Experiente";
      } else if (
        text === "2" ||
        lowerText.includes("começando") ||
        lowerText.includes("iniciante")
      ) {
        experience = "Iniciante";
      } else {
        // Opção inválida
        const invalidMsg =
          "Por favor, escolha uma opção válida:\n\n1️⃣ Já corro regularmente\n2️⃣ Estou começando agora";
        await saveMessage(session.id, text, "STUDENT");
        await saveMessage(session.id, invalidMsg, "BOT");
        await updateSessionInteraction(session.id);
        await sendZapiText(phone, invalidMsg);
        return new Response("OK", { status: 200 });
      }

      await supabase
        .from("support_sessions")
        .update({
          status: "WAITING_GOAL",
          summary: `${session.summary || ""}\nExperiência: ${experience}`,
        })
        .eq("id", session.id);

      const node = await getBotNode("WAITING_GOAL");
      const goalMsg =
        node?.content ||
        `Ótimo! E qual é o seu principal objetivo com a corrida?\n\n1️⃣ Perder peso e melhorar saúde\n2️⃣ Correr minha primeira prova (5km, 10km)\n3️⃣ Melhorar meu tempo/performance\n4️⃣ Treinar para maratona`;
      await saveMessage(session.id, text, "STUDENT");
      await saveMessage(session.id, goalMsg, "BOT");
      await updateSessionInteraction(session.id);
      await sendZapiText(phone, goalMsg);

      return new Response("OK", { status: 200 });
    }

    // 13. QUALIFICAÇÃO: Objetivo
    if (session?.status === "WAITING_GOAL") {
      const goals: { [key: string]: string } = {
        "1": "Perder peso e saúde",
        "2": "Primeira prova",
        "3": "Melhorar performance",
        "4": "Maratona",
      };

      const selectedGoal =
        goals[text] ||
        (lowerText.includes("peso") || lowerText.includes("saúde")
          ? "Perder peso e saúde"
          : lowerText.includes("prova") || lowerText.includes("5km") || lowerText.includes("10km")
            ? "Primeira prova"
            : lowerText.includes("tempo") || lowerText.includes("performance")
              ? "Melhorar performance"
              : lowerText.includes("maratona") || lowerText.includes("42km")
                ? "Maratona"
                : null);

      if (!selectedGoal) {
        // Se for número, avisa que é inválido. Se for texto, deixa para a IA.
        if (/^\d+$/.test(text)) {
          const invalidMsg = "Por favor, escolha uma opção válida (1, 2, 3 ou 4):";
          await saveMessage(session.id, text, "STUDENT");
          await saveMessage(session.id, invalidMsg, "BOT");
          await updateSessionInteraction(session.id);
          await sendZapiText(phone, invalidMsg);
          return new Response("OK", { status: 200 });
        }
        // Se for texto corrido, não retorna e deixa cair na IA Fallback
        console.log("ℹ️ Texto não numérico em WAITING_GOAL, deixando para IA...");
      } else {
        await supabase
          .from("support_sessions")
          .update({
            status: "WAITING_TRIAL_INTEREST",
            summary: `${session.summary || ""}\nObjetivo: ${selectedGoal}`,
          })
          .eq("id", session.id);

        const node = await getBotNode("WAITING_TRIAL_INTEREST");
        const trialInterestMsg = processTemplate(
          node?.content ||
            `Excelente! Temos o plano perfeito para quem busca ${selectedGoal.toLowerCase()}! 🎯\n\nAntes de continuarmos, você gostaria de agendar uma *AULA EXPERIMENTAL GRATUITA* com a nossa equipe no Parque Ibirapuera?\n\n1️⃣ Sim, eu quero!\n2️⃣ Agora não, prefiro ver outras informações.`,
          { goal: selectedGoal.toLowerCase() }
        );

        await saveMessage(session.id, text, "STUDENT");
        await saveMessage(session.id, trialInterestMsg, "BOT");
        await updateSessionInteraction(session.id);
        await sendZapiText(phone, trialInterestMsg);

        return new Response("OK", { status: 200 });
      }
    }

    // 14. AGENDAMENTO: Interesse
    if (session?.status === "WAITING_TRIAL_INTEREST") {
      if (
        text === "1" ||
        lowerText.includes("sim") ||
        lowerText.includes("quero") ||
        lowerText.includes("aceito")
      ) {
        await supabase
          .from("support_sessions")
          .update({
            status: "WAITING_TRIAL_DAY",
          })
          .eq("id", session.id);

        const node = await getBotNode("WAITING_TRIAL_DAY");
        const dayMsg =
          node?.content ||
          "Legal! Qual o melhor dia para você treinar com a gente na Praça em frente a Moby Dick?\n\n1️⃣ Terça-feira\n2️⃣ Quinta-feira\n3️⃣ Sábado";
        await saveMessage(session.id, text, "STUDENT");
        await saveMessage(session.id, dayMsg, "BOT");
        await updateSessionInteraction(session.id);
        await sendZapiText(phone, dayMsg);
        return new Response("OK", { status: 200 });
      } else if (
        text === "2" ||
        lowerText.includes("não") ||
        lowerText.includes("agora não") ||
        lowerText.includes("depois") ||
        lowerText.includes("outro momento")
      ) {
        await supabase
          .from("support_sessions")
          .update({
            status: "WAITING_MENU",
          })
          .eq("id", session.id);

        const node = await getBotNode("WAITING_MENU");
        const menuMsg =
          node?.content ||
          `Sem problemas! Como posso te ajudar hoje?\n\nDigite o número da opção:\n1️⃣ *Financeiro* (Pagamentos, planos, cancelamento)\n2️⃣ *Treinos* (Falar com seu treinador)\n3️⃣ *Comunicação* (Dúvidas gerais e eventos)`;
        await saveMessage(session.id, text, "STUDENT");
        await saveMessage(session.id, menuMsg, "BOT");
        await updateSessionInteraction(session.id);
        await sendZapiText(phone, menuMsg);
        return new Response("OK", { status: 200 });
      }

      // Se não for uma resposta clara de sim/não sobre a aula, deixa para o Fallback da IA
      console.log("ℹ️ Resposta não conclusiva em WAITING_TRIAL_INTEREST, enviando para IA...");
    }

    // 15. AGENDAMENTO: Dia
    if (session?.status === "WAITING_TRIAL_DAY") {
      const days: { [key: string]: string } = {
        "1": "Terça-feira",
        "2": "Quinta-feira",
        "3": "Sábado",
      };
      const selectedDay = days[text];

      if (!selectedDay) {
        const invalidMsg = "Por favor, escolha uma opção válida (1, 2 ou 3):";
        await sendZapiText(phone, invalidMsg);
        return new Response("OK", { status: 200 });
      }

      await supabase
        .from("support_sessions")
        .update({
          status: "WAITING_TRIAL_TIME",
          summary: `${session.summary || ""}\nDia da Aula: ${selectedDay}`,
        })
        .eq("id", session.id);

      let timeMsg = "";
      if (selectedDay === "Sábado") {
        timeMsg = `Aos sábados temos nossos treinos em grupo às 06:00 (geralmente treinos longos). Podemos confirmar este horário?\n\n1️⃣ Sim, confirmar 06:00\n2️⃣ Escolher outro dia`;
      } else {
        const node = await getBotNode("WAITING_TRIAL_TIME");
        const template =
          node?.content ||
          `E qual o melhor horário para você na ${selectedDay.toLowerCase()}?\n\n1️⃣ 06:00 (Manhã)\n2️⃣ 07:00 (Manhã)\n3️⃣ 19:30 (Noite)`;
        timeMsg = processTemplate(template, { day: selectedDay.toLowerCase() });
      }

      await saveMessage(session.id, text, "STUDENT");
      await saveMessage(session.id, timeMsg, "BOT");
      await updateSessionInteraction(session.id);
      await sendZapiText(phone, timeMsg);

      return new Response("OK", { status: 200 });
    }

    // 16. AGENDAMENTO: Horário e Finalização
    if (session?.status === "WAITING_TRIAL_TIME") {
      const dayInSummary = session.summary?.split("Dia da Aula: ")[1]?.split("\n")[0];

      let selectedTime = "";
      if (dayInSummary === "Sábado") {
        if (text === "1") selectedTime = "06:00";
        else if (text === "2") {
          await supabase
            .from("support_sessions")
            .update({ status: "WAITING_TRIAL_DAY" })
            .eq("id", session.id);
          await sendZapiText(
            phone,
            "Sem problemas! Escolha outro dia:\n\n1️⃣ Terça-feira\n2️⃣ Quinta-feira\n3️⃣ Sábado"
          );
          return new Response("OK", { status: 200 });
        }
      } else {
        const times: { [key: string]: string } = { "1": "06:00", "2": "07:00", "3": "19:30" };
        selectedTime = times[text];
      }

      if (!selectedTime) {
        const invalidMsg = "Por favor, escolha uma opção válida:";
        await sendZapiText(phone, invalidMsg);
        return new Response("OK", { status: 200 });
      }

      const trialDateStr = getNextWeekdayDate(dayInSummary || "");

      const scheduleInfo = `${session.summary || ""}\nHorário da Aula: ${selectedTime}`;
      await supabase
        .from("support_sessions")
        .update({
          status: "WAITING_MENU",
          summary: scheduleInfo,
          trial_date: trialDateStr,
          trial_time: selectedTime,
        })
        .eq("id", session.id);

      const confirmMsg = `✅ *AGENDAMENTO REALIZADO!*\n\nSua aula experimental está marcada!\n📍 Local: Praça em frente a Moby Dick\n🗺️ Mapa: https://www.google.com/maps/place/Bora+Correr+Club/data=!4m2!3m1!1s0x0:0x258d6bc0ef2bd999?sa=X&ved=1t:2428&ictx=111\n📅 Dia: ${dayInSummary} (${trialDateStr})\n⏰ Horário: ${selectedTime}\n\nTe esperamos lá! 🏃‍♂️. Agora, como posso te ajudar mais?\n\n1️⃣ *Financeiro*\n2️⃣ *Treinos*\n3️⃣ *Comunicação*`;

      await saveMessage(session.id, text, "STUDENT");
      await saveMessage(session.id, confirmMsg, "BOT");
      await updateSessionInteraction(session.id);
      await sendZapiText(phone, confirmMsg);

      // AGENDAR FOLLOW-UPS DE LEMBRETE
      const trialDateTime = new Date(`${trialDateStr}T${selectedTime}:00`);

      // 24h Antes
      const reminder24h = new Date(trialDateTime.getTime() - 24 * 60 * 60 * 1000);
      if (reminder24h > new Date()) {
        await supabase.from("follow_ups").insert([
          {
            session_id: session.id,
            student_phone: phone,
            type: "TRIAL_REMINDER_24H",
            scheduled_for: reminder24h.toISOString(),
            status: "PENDING",
          },
        ]);
      }

      // 1h Antes
      const reminder1h = new Date(trialDateTime.getTime() - 1 * 60 * 60 * 1000);
      if (reminder1h > new Date()) {
        await supabase.from("follow_ups").insert([
          {
            session_id: session.id,
            student_phone: phone,
            type: "TRIAL_REMINDER_1H",
            scheduled_for: reminder1h.toISOString(),
            status: "PENDING",
          },
        ]);
      }

      // NPS: 2 horas após a aula
      const npsTime = new Date(trialDateTime.getTime() + 2 * 60 * 60 * 1000);
      await supabase.from("follow_ups").insert([
        {
          session_id: session.id,
          student_phone: phone,
          type: "TRIAL_NPS",
          scheduled_for: npsTime.toISOString(),
          status: "PENDING",
        },
      ]);

      // Notificar Equipe (Grupo e Diego)
      const expStr = scheduleInfo.match(/Experiência: ([^\n]+)/)?.[1] || "Não informado";
      const goalStr = scheduleInfo.match(/Objetivo: ([^\n]+)/)?.[1] || "Não informado";

      const adminNotify = `🔥 *NOVO AGENDAMENTO DE AULA EXPERIMENTAL*\n\n👤 Aluno: ${profile?.nome_completo || phone}\n📞 Telefone: wa.me/${phone}\n🏃 Experiência: ${expStr}\n🎯 Objetivo: ${goalStr}\n📅 Data: ${trialDateStr}\n⏰ Horário: ${selectedTime}\n\n📍 Local: Praça em frente a Moby Dick`;

      console.log(`📡 Enviando notificações para a equipe...`);

      // Enviar para o Grupo
      await sendZapiText(ADMIN_NUMBERS.GRUPO_EQUIPE, adminNotify);
      console.log(`✅ Notificação enviada para o Grupo: ${ADMIN_NUMBERS.GRUPO_EQUIPE}`);

      // Enviar para Diego (Backup)
      await sendZapiText(ADMIN_NUMBERS.DIEGO, adminNotify);
      console.log(`✅ Notificação enviada para Diego: ${ADMIN_NUMBERS.DIEGO}`);

      return new Response("OK", { status: 200 });
    }

    // 15. RESPOSTA AO CHECK-UP DE SAÚDE
    if (session?.status === "WAITING_HEALTH_RESPONSE") {
      if (text === "1") {
        const okMsg =
          "Que notícia boa! Fico feliz que esteja treinando sem dores. Vamos pra cima! 🚀";
        await supabase
          .from("support_sessions")
          .update({ status: "WAITING_MENU" })
          .eq("id", session.id);
        await sendZapiText(phone, okMsg);
      } else if (text === "2" || text === "3") {
        const painLevel = text === "2" ? "pouca dor" : "dor persistente";
        const alertMsg = `Atenção! O aluno ${profile?.nome_completo || phone} reportou *${painLevel}* no check-up de hoje.`;

        // Adicionar tag de dor para facilitar filtro no CRM
        const currentTags = session.tags || [];
        if (!currentTags.includes("DOR_REPORTADA")) {
          await supabase
            .from("support_sessions")
            .update({
              tags: [...currentTags, "DOR_REPORTADA"],
            })
            .eq("id", session.id);
        }

        await sendZapiText(ADMIN_NUMBERS.DIEGO, alertMsg);
        await sendZapiText(ADMIN_NUMBERS.CAIQUE, alertMsg);

        const responseMsg =
          "Puxa, entendi. Já avisei os treinadores (Diego e Caique) para darem uma olhada no seu caso e te orientarem. Se cuida! 🙏";
        await supabase
          .from("support_sessions")
          .update({ status: "WAITING_MENU" })
          .eq("id", session.id);
        await sendZapiText(phone, responseMsg);
      } else {
        await sendZapiText(phone, "Por favor, escolha uma das opções (1, 2 ou 3).");
      }
      return new Response("OK", { status: 200 });
    }

    // 17. MENU PRINCIPAL (Anteriormente 14)
    if (session?.status === "WAITING_MENU") {
      if (text === "1") {
        await supabase
          .from("support_sessions")
          .update({
            status: "ACTIVE",
            sector: "FINANCEIRO",
            admin_phone: ADMIN_NUMBERS.FINANCEIRO,
          })
          .eq("id", session.id);

        const transferMsg =
          "Entendido! Estou transferindo sua conversa para o *Demétrio* (Financeiro). Ele costuma responder em breve. Obrigado pela paciência! 🙏";
        await saveMessage(session.id, text, "STUDENT");
        await saveMessage(session.id, transferMsg, "BOT");
        await updateSessionInteraction(session.id);
        await sendZapiText(phone, transferMsg);

        // Notificar admin
        await sendZapiText(
          ADMIN_NUMBERS.FINANCEIRO,
          `💼 Nova conversa de ${profile?.nome_completo || phone}\n\n${session.summary || "Sem informações adicionais"}\n\nÚltima mensagem: "${text}"`
        );

        return new Response("OK", { status: 200 });
      }
      if (text === "2") {
        await supabase
          .from("support_sessions")
          .update({
            status: "WAITING_TRAINER",
          })
          .eq("id", session.id);

        const trainerMsg =
          "Com qual treinador você deseja falar?\n\n1. Fernanda\n2. Diego\n3. Caique";
        await saveMessage(session.id, text, "STUDENT");
        await saveMessage(session.id, trainerMsg, "BOT");
        await updateSessionInteraction(session.id);
        await sendZapiText(phone, trainerMsg);

        return new Response("OK", { status: 200 });
      }
      if (text === "3") {
        await supabase
          .from("support_sessions")
          .update({
            status: "ACTIVE",
            sector: "COMUNICACAO",
            admin_phone: ADMIN_NUMBERS.COMUNICACAO,
          })
          .eq("id", session.id);

        const comMsg =
          "Certo! Estou chamando a *Isa* (Comunicação) para te ajudar. Ela já entra em contato! 📣";
        await saveMessage(session.id, text, "STUDENT");
        await saveMessage(session.id, comMsg, "BOT");
        await updateSessionInteraction(session.id);
        await sendZapiText(phone, comMsg);

        // Notificar admin
        await sendZapiText(
          ADMIN_NUMBERS.COMUNICACAO,
          `📣 Nova conversa de ${profile?.nome_completo || phone}\n\n${session.summary || "Sem informações adicionais"}\n\nÚltima mensagem: "${text}"`
        );

        return new Response("OK", { status: 200 });
      }

      // Se for apenas um número errado, manda mensagem de erro
      if (/^\d+$/.test(text)) {
        const invalidMenuMsg =
          "Opção inválida. Por favor, escolha:\n\n1️⃣ Financeiro\n2️⃣ Treinos\n3️⃣ Comunicação";
        await saveMessage(session.id, text, "STUDENT");
        await saveMessage(session.id, invalidMenuMsg, "BOT");
        await updateSessionInteraction(session.id);
        await sendZapiText(phone, invalidMenuMsg);
        return new Response("OK", { status: 200 });
      }

      // Se for qualquer outra pergunta ou texto, não retorna e deixa a IA responder!
      console.log("ℹ️ Texto não numérico no menu principal, enviando para IA...");
    }

    // 15. ESCOLHA DE TREINADOR
    if (session?.status === "WAITING_TRAINER") {
      const trainers: { [key: string]: { name: string; phone: string } } = {
        "1": { name: "FERNANDA", phone: ADMIN_NUMBERS.FERNANDA },
        "2": { name: "DIEGO", phone: ADMIN_NUMBERS.DIEGO },
        "3": { name: "CAIQUE", phone: ADMIN_NUMBERS.CAIQUE },
      };

      const selected = trainers[text];

      if (selected) {
        await supabase
          .from("support_sessions")
          .update({
            status: "ACTIVE",
            sector: `TREINADOR_${selected.name}`,
            admin_phone: selected.phone,
          })
          .eq("id", session.id);

        const trainerConfirmMsg = `Perfeito! Vou avisar o treinador *${selected.name.charAt(0) + selected.name.slice(1).toLowerCase()}* para analisar seu caso. Fique tranquilo que ele(a) te responde aqui! 🏃‍♂️`;
        await saveMessage(session.id, text, "STUDENT");
        await saveMessage(session.id, trainerConfirmMsg, "BOT");
        await updateSessionInteraction(session.id);
        await sendZapiText(phone, trainerConfirmMsg);

        // Notificar treinador
        await sendZapiText(
          selected.phone,
          `🏃‍♂️ Nova conversa de ${profile?.nome_completo || phone}\n\n${session.summary || "Sem informações adicionais"}\n\nÚltima mensagem: "${text}"`
        );

        return new Response("OK", { status: 200 });
      } else {
        // Opção inválida
        const invalidTrainerMsg =
          "Por favor, escolha um treinador válido:\n\n1. Fernanda\n2. Diego\n3. Caique";
        await saveMessage(session.id, text, "STUDENT");
        await saveMessage(session.id, invalidTrainerMsg, "BOT");
        await updateSessionInteraction(session.id);
        await sendZapiText(phone, invalidTrainerMsg);

        return new Response("OK", { status: 200 });
      }
    }

    // 15b. TRATAMENTO DE NPS (Pós-Aula)
    if (session?.status === "WAITING_NPS") {
      const score = parseInt(text.replace(/\D/g, ""));

      if (isNaN(score) || score < 0 || score > 10) {
        const retryMsg =
          "Por favor, responda apenas com um número de 0 a 10. Como foi sua experiência hoje?";
        await sendZapiText(phone, retryMsg);
        return new Response("OK", { status: 200 });
      }

      if (score >= 9) {
        const highMsg = `Uau! Que nota maravilhosa! 😍 Ficamos muito felizes que tenha gostado do treino.\\n\\nComo você curtiu a experiência, temos uma condição especial para você começar essa semana mesmo no clube! 🚀\\n\\nAh, e que tal trazer um amigo para correr com a gente? Se ele fechar um plano, você ganha *1 MÊS DE DESCONTO* (ou um brinde)! 🎁\\n\\nBasta ele entrar em contato com a gente dizendo que foi indicado por você! O que acha? Posso te mandar os detalhes dos nossos planos?`;
        await supabase
          .from("support_sessions")
          .update({ status: "WAITING_MENU", summary: `${session.summary || ""}\nNPS: ${score}` })
          .eq("id", session.id);
        await sendZapiText(phone, highMsg);
      } else if (score <= 6) {
        const lowMsg = `Poxa, sentimos muito que a experiência não tenha sido 100%. 😔 Agradecemos muito o seu feedback e um coordenador da nossa equipe vai entrar em contato com você pessoalmente para entender como podemos melhorar.`;
        await supabase
          .from("support_sessions")
          .update({
            status: "ACTIVE",
            sector: "COMUNICACAO",
            summary: `${session.summary || ""}\nNPS NEGATIVO: ${score}`,
          })
          .eq("id", session.id);
        await sendZapiText(phone, lowMsg);

        // Alerta Admin com prioridade
        await sendZapiText(
          ADMIN_NUMBERS.COMUNICACAO,
          `🚨 ALERTA NPS BAIXO: O aluno ${profile?.nome_completo || phone} deu nota ${score} para a aula experimental. Por favor, entre em contato para entender o ocorrido.`
        );
      } else {
        const neutralMsg = `Obrigado pelo seu feedback! 🤝 Vamos trabalhar para que sua próxima experiência com a gente seja nota 10 será!\\n\\nQualquer dúvida, estou à disposição no menu principal.`;
        await supabase
          .from("support_sessions")
          .update({ status: "WAITING_MENU", summary: `${session.summary || ""}\nNPS: ${score}` })
          .eq("id", session.id);
        await sendZapiText(phone, neutralMsg);
      }

      await saveMessage(session.id, text, "STUDENT");
      await updateSessionInteraction(session.id);
      return new Response("OK", { status: 200 });
    }

    // 16. SISTEMA DE ENQUETES
    // Verificar se há enquete ativa aguardando resposta
    const { data: pendingPoll } = await supabase
      .from("support_sessions")
      .select("summary")
      .eq("id", session?.id || "")
      .single();

    if (pendingPoll?.summary?.startsWith("WAITING_POLL:")) {
      const pollId = pendingPoll.summary.replace("WAITING_POLL:", "");

      const { data: poll } = await supabase.from("polls").select("*").eq("id", pollId).single();

      if (poll) {
        // Processar resposta da enquete
        let optionIndex = -1;
        const lowerText = text.toLowerCase().trim();

        // Tentar entender a resposta
        // 1. Número direto (1, 2, 3...)
        const numMatch = text.match(/^(\d+)$/);
        if (numMatch) {
          optionIndex = parseInt(numMatch[1]) - 1;
        }
        // 2. Emoji de número (1️⃣, 2️⃣, 3️⃣...)
        else if (text.match(/[1-9]️⃣/)) {
          const emojiNum = text.match(/([1-9])️⃣/);
          if (emojiNum) optionIndex = parseInt(emojiNum[1]) - 1;
        }
        // 3. Texto da opção
        else {
          optionIndex = poll.options.findIndex(
            (opt: string) =>
              opt.toLowerCase().includes(lowerText) || lowerText.includes(opt.toLowerCase())
          );
        }

        // Validar resposta
        if (optionIndex >= 0 && optionIndex < poll.options.length) {
          // Salvar resposta
          await supabase.from("poll_responses").insert([
            {
              poll_id: poll.id,
              student_phone: phone,
              option_index: optionIndex,
              option_text: poll.options[optionIndex],
            },
          ]);

          // Limpar estado de enquete
          await supabase
            .from("support_sessions")
            .update({
              summary: null,
              status: "WAITING_MENU",
            })
            .eq("id", session.id);

          const thankYouMsg = `✅ Obrigado pela sua resposta!\\n\\nVocê escolheu: *${poll.options[optionIndex]}*\\n\\nSua opinião é muito importante para nós! 💙\\n\\n*Menu Principal:*\\n1️⃣ Falar com Financeiro\\n2️⃣ Falar com Comunicação\\n3️⃣ Falar com Treinador\\n4️⃣ Outras dúvidas`;

          await saveMessage(session.id, text, "STUDENT");
          await saveMessage(session.id, thankYouMsg, "BOT");
          await updateSessionInteraction(session.id);
          await sendZapiText(phone, thankYouMsg);

          return new Response("OK", { status: 200 });
        } else {
          // Resposta inválida
          const optionsText = poll.options
            .map((opt: string, i: number) => `${i + 1}️⃣ ${opt}`)
            .join("\\n");
          const invalidMsg = `❌ Opção inválida. Por favor, escolha uma das opções:\\n\\n${optionsText}\\n\\nDigite o número da sua escolha.`;

          await saveMessage(session.id, text, "STUDENT");
          await saveMessage(session.id, invalidMsg, "BOT");
          await updateSessionInteraction(session.id);
          await sendZapiText(phone, invalidMsg);

          return new Response("OK", { status: 200 });
        }
      }
    }

    // Verificar se deve enviar enquete automática
    if (session?.status === "WAITING_MENU") {
      const { data: autoPolls } = await supabase
        .from("polls")
        .select("*")
        .eq("status", "ACTIVE")
        .eq("auto_send", true)
        .limit(1);

      if (autoPolls && autoPolls.length > 0) {
        const poll = autoPolls[0];

        // Verificar se já respondeu
        const { data: existingResponse } = await supabase
          .from("poll_responses")
          .select("id")
          .eq("poll_id", poll.id)
          .eq("student_phone", phone)
          .single();

        if (!existingResponse) {
          // Enviar enquete
          const optionsText = poll.options
            .map((opt: string, i: number) => `${i + 1}️⃣ ${opt}`)
            .join("\\n");
          const pollMsg = `📊 *${poll.title}*\\n\\n${poll.question}\\n\\n${optionsText}\\n\\nDigite o número da sua escolha!`;

          // Marcar sessão como aguardando resposta de enquete
          await supabase
            .from("support_sessions")
            .update({
              summary: `WAITING_POLL:${poll.id}`,
            })
            .eq("id", session.id);

          await saveMessage(session.id, pollMsg, "BOT");
          await updateSessionInteraction(session.id);
          await sendZapiText(phone, pollMsg);

          return new Response("OK", { status: 200 });
        }
      }
    }

    // 17. Inteligência Artificial (Fallback)

    if (aiConfig.enabled !== false) {
      console.log("🤖 IA Fallback...");

      // Busca Histórico
      const { data: history } = await supabase
        .from("support_messages")
        .select("*")
        .eq("session_id", session?.id)
        .order("created_at", { ascending: false })
        .limit(6);

      const historyMessages = (history || []).reverse().map((msg: any) => ({
        role: msg.sender_type === "STUDENT" ? "user" : "assistant",
        content: msg.content,
      }));

      const aiResponse = await askAI([...historyMessages, { role: "user", content: text }], {
        openai_key: aiConfig.openai_key || OPENAI_API_KEY,
        gemini_key: aiConfig.gemini_key || Deno.env.get("GEMINI_API_KEY"),
        context:
          aiConfig.context ||
          `Você é o assistente virtual oficial do Bora Correr Club (BCC). Sua missão é ser prestativo, motivador e técnico. 

Informações Cruciais do Clube:
1. Localização: Praça em frente a Moby Dick (Praia da Costa, Vila Velha).
2. Horários de Treino na Praça: Terças e Quintas: 06:00, 07:00 e 19:30. Sábados: 06:00 (treino longo em grupo).
3. Professores: Diego e Caique.
4. Regras de Chuva: Os treinos acontecem mesmo com chuva, a menos que haja risco de raios ou ventos extremos. O ponto de encontro tem cobertura próxima.
5. Planos: Temos planos Trimestrais, Semestrais e Anuais. Detalhes de valores devem ser consultados com o setor Financeiro.
6. Benefícios: Planilha de treinos, treinos presenciais, acompanhamento técnico, kit aluno e comunidade ativa.
7. O que levar: Água, tênis de corrida adequado e muita disposição!
8. Dores: Se o aluno reportar dor, seja empático e sugira que ele aguarde o contato direto do treinador (que já foi notificado).

Tom de voz: Amigável, energético e educado. Use emojis de corrida 🏃‍♂️💨 e incentivo 🚀.`,
        model: aiConfig.model || "gpt-4o-mini",
        provider: aiConfig.provider || "openai",
      });

      if (aiResponse) {
        const currentSessionId =
          session?.id ||
          (
            await supabase
              .from("support_sessions")
              .insert([
                {
                  student_phone: phone,
                  status: "BOT",
                },
              ])
              .select()
              .single()
          ).data?.id;

        await saveMessage(
          currentSessionId,
          text,
          "STUDENT",
          audioUrl || undefined,
          wasAudio ? "audio" : undefined
        );
        await updateSessionInteraction(currentSessionId);

        if (wasAudio) {
          const audioBase64 = await generateAudio(aiResponse, aiConfig);
          if (audioBase64) {
            await saveMessage(currentSessionId, aiResponse, "BOT", audioBase64, "audio");
            await sendZapiAudio(phone, audioBase64);
          } else {
            await saveMessage(currentSessionId, aiResponse, "BOT");
            await sendZapiText(phone, aiResponse);
          }
        } else {
          await saveMessage(currentSessionId, aiResponse, "BOT");
          await sendZapiText(phone, aiResponse);
        }
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("❌ ERRO NO WEBHOOK:", error);
    return new Response("Error", { status: 500 });
  }
});
