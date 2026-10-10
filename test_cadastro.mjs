fetch(
  "https://api.z-api.io/instances/3EEB36F4A3AF7235536976D7ED321DD3/token/4D0A1752EE8EE5A8C965B88E/send-text",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Client-Token": "Face1ee76bbb64107a0e73895d27ee961S",
    },
    body: JSON.stringify({
      phone: "120363420086468293-group",
      message:
        "🚨 *NOVO ALUNO NO BORA CORRER* 🚨\n\n" +
        "👤 *Nome:* João Silva\n" +
        "📱 *Telefone:* (11) 98765-4321\n\n" +
        "📋 *Resumo da Anamnese:*\n- Não corre atualmente\n- Objetivo: Perder peso e condicionamento\n- Sem lesões previas\n- Disponibilidade: 3x na semana\n\n" +
        "Dêem as boas-vindas e acompanhem! 🏃‍♂️💨",
    }),
  }
)
  .then((r) => r.text())
  .then((t) => {
    console.log("RES:", t);
  })
  .catch(console.error);
