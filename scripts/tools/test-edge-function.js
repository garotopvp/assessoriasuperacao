import https from "https";

const PROJECT_REF = "tdzdureusnszdzvsoomr";
const FUNCTION_URL = `https://${PROJECT_REF}.supabase.co/functions/v1/create-pix-abacate`;
const FAKE_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake"; // Token fake pois removemos a validação estrita temporariamente

const data = JSON.stringify({
  planId: "mensal",
  customerEmail: `teste_edge_${Date.now()}@debug.com`,
  customerName: "Edge Tester",
  customerPhone: "11999999999",
  userId: "user_test_123",
});

const options = {
  method: "POST",
  headers: {
    Authorization: FAKE_TOKEN,
    "Content-Type": "application/json",
    "Content-Length": data.length,
  },
};

console.log(`🚀 Testando Edge Function Deployada: ${FUNCTION_URL}`);
console.log("Enviando dados:", data);
console.log("\n-----------------------------------\n");

const req = https.request(FUNCTION_URL, options, (res) => {
  let responseBody = "";

  res.on("data", (chunk) => {
    responseBody += chunk;
  });

  res.on("end", () => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log("RESPOSTA DA EDGE FUNCTION:");
    try {
      const json = JSON.parse(responseBody);
      console.log(JSON.stringify(json, null, 2));
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
