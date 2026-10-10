import https from "https";

const API_KEY = "abc_prod_DqgkhaB5AR5uF5cynHycCtue";
const URL = "https://api.abacatepay.com/v1/billing/create";

const data = JSON.stringify({
  frequency: "ONE_TIME",
  methods: ["PIX", "CARD"],
  products: [
    {
      externalId: "test-123",
      name: "Teste de Debug",
      quantity: 1,
      price: 100, // 1 real
    },
  ],
  returnUrl: "https://boracorrerclub.com.br/sucesso",
  completionUrl: "https://boracorrerclub.com.br/sucesso",
  customer: {
    email: `teste_${Date.now()}@debug.com`,
    name: "Maria Silva",
    taxId: "52998224725", // CPF válido unformatted
    cellphone: "11999999999",
  },
});

const options = {
  method: "POST",
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
    "Content-Length": data.length,
  },
};

console.log("🚀 Testando API do Abacate Pay...");
console.log("Enviando dados:", data);
console.log("\n-----------------------------------\n");

const req = https.request(URL, options, (res) => {
  let responseBody = "";

  res.on("data", (chunk) => {
    responseBody += chunk;
  });

  res.on("end", () => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log("RESPOSTA COMPLETA DA API:");
    try {
      const json = JSON.parse(responseBody);
      console.log(JSON.stringify(json, null, 2));

      if (json.url) console.log("\n✅ URL encontrada em: root.url");
      else if (json.data && json.data.url) console.log("\n✅ URL encontrada em: root.data.url");
      else console.log("\n❌ URL NÃO encontrada nos campos esperados!");
    } catch (e) {
      console.log(responseBody);
    }
  });
});

req.on("error", (error) => {
  console.error("❌ Erro na requisição:", error);
});

req.write(data);
req.end();
