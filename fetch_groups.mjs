import fs from "fs";

async function listGroups() {
  const ZAPI_URL =
    "https://api.z-api.io/instances/3EEB36F4A3AF7235536976D7ED321DD3/token/4D0A1752EE8EE5A8C965B88E/chats?isGroup=true";

  // NOTE: Use ZAPI_TOKEN (Admin Token) instead of Client Token to fetch groups
  const ADMIN_TOKEN = "4D0A1752EE8EE5A8C965B88E";

  const res = await fetch(ZAPI_URL, {
    method: "GET",
    headers: {
      "Client-Token": ADMIN_TOKEN,
    },
  });

  const text = await res.text();
  const data = JSON.parse(text);

  if (data.error) {
    console.log("Error:", data);
    return;
  }

  // Just print the name and ID of each group
  data.forEach((group) => {
    console.log(`Nome: ${group.name} | ID: ${group.phone}`);
  });
}

listGroups().catch(console.error);
