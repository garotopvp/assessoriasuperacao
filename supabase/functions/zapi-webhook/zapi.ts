export const sendZapiText = async (phone: string, message: string) => {
  const ZAPI_URL = Deno.env.get("ZAPI_URL");
  const ZAPI_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN");
  const ZAPI_ADMIN_TOKEN = Deno.env.get("ZAPI_ADMIN_TOKEN");

  if (!ZAPI_URL || !ZAPI_TOKEN) {
    console.error("❌ ZAPI_URL ou ZAPI_TOKEN não configurados!");
    return;
  }

  try {
    const response = await fetch(`${ZAPI_URL}/token/${ZAPI_TOKEN}/send-text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Token": ZAPI_ADMIN_TOKEN || ZAPI_TOKEN,
      },
      body: JSON.stringify({ phone, message }),
    });

    const data = await response.json().catch(() => ({}));
    console.log(`📡 Z-API Text Response (${phone}):`, response.status, data);
  } catch (error) {
    console.error(`❌ Erro ao enviar Z-API Text para ${phone}:`, error);
  }
};

export const sendZapiImage = async (phone: string, image: string, caption?: string) => {
  const ZAPI_URL = Deno.env.get("ZAPI_URL");
  const ZAPI_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN");
  const ZAPI_ADMIN_TOKEN = Deno.env.get("ZAPI_ADMIN_TOKEN");

  if (!ZAPI_URL || !ZAPI_TOKEN) return;

  await fetch(`${ZAPI_URL}/token/${ZAPI_TOKEN}/send-image`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Client-Token": ZAPI_ADMIN_TOKEN || ZAPI_TOKEN,
    },
    body: JSON.stringify({ phone, image, caption }),
  });
};

export const sendZapiAudio = async (phone: string, audio: string) => {
  const ZAPI_URL = Deno.env.get("ZAPI_URL");
  const ZAPI_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN");
  const ZAPI_ADMIN_TOKEN = Deno.env.get("ZAPI_ADMIN_TOKEN");

  if (!ZAPI_URL || !ZAPI_TOKEN) return;

  await fetch(`${ZAPI_URL}/token/${ZAPI_TOKEN}/send-audio`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Client-Token": ZAPI_ADMIN_TOKEN || ZAPI_TOKEN,
    },
    body: JSON.stringify({ phone, audio }),
  });
};

export const sendZapiVideo = async (phone: string, video: string, caption?: string) => {
  const ZAPI_URL = Deno.env.get("ZAPI_URL");
  const ZAPI_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN");
  const ZAPI_ADMIN_TOKEN = Deno.env.get("ZAPI_ADMIN_TOKEN");

  if (!ZAPI_URL || !ZAPI_TOKEN) return;

  await fetch(`${ZAPI_URL}/token/${ZAPI_TOKEN}/send-video`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Client-Token": ZAPI_ADMIN_TOKEN || ZAPI_TOKEN,
    },
    body: JSON.stringify({ phone, video, caption }),
  });
};

export const sendZapiMenu = async (
  phone: string,
  message: string,
  options: any[],
  title: string = "Menu"
) => {
  const ZAPI_URL = Deno.env.get("ZAPI_URL");
  const ZAPI_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN");
  const ZAPI_ADMIN_TOKEN = Deno.env.get("ZAPI_ADMIN_TOKEN");

  if (!ZAPI_URL || !ZAPI_TOKEN) return;

  await fetch(`${ZAPI_URL}/token/${ZAPI_TOKEN}/send-option-list`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Client-Token": ZAPI_ADMIN_TOKEN || ZAPI_TOKEN,
    },
    body: JSON.stringify({
      phone,
      message,
      buttonText: "Ver Opções",
      title,
      sections: [{ rows: options }],
    }),
  });
};

export const addZapiContact = async (phone: string, firstName: string, lastName?: string) => {
  const ZAPI_URL = Deno.env.get("ZAPI_URL");
  const ZAPI_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN");
  const ZAPI_ADMIN_TOKEN = Deno.env.get("ZAPI_ADMIN_TOKEN");

  if (!ZAPI_URL || !ZAPI_TOKEN) return;

  await fetch(`${ZAPI_URL}/token/${ZAPI_TOKEN}/contacts/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Client-Token": ZAPI_ADMIN_TOKEN || ZAPI_TOKEN,
    },
    body: JSON.stringify([{ phone, firstName, lastName }]),
  });
};
