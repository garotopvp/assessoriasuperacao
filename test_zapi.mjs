fetch(
  "https://api.z-api.io/instances/3EEB36F4A3AF7235536976D7ED321DD3/token/4D0A1752EE8EE5A8C965B88E/send-text",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Client-Token": "Face1ee76bbb64107a0e73895d27ee961S",
    },
    body: JSON.stringify({
      phone: "5535998629449",
      message:
        "🤖 *Mensagem de Teste do Sistema*\n\nOlá Equipe! Isso é um teste para garantir que os alarmes do sistema Bora Correr Club estão apontados para o grupo correto. ✅",
    }),
  }
)
  .then((r) => r.text())
  .then((t) => {
    console.log("RES:", t);
  })
  .catch(console.error);
