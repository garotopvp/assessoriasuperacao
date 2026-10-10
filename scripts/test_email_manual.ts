const SUPABASE_URL = "https://tdzdureusnszdzvsoomr.supabase.co";
const SERVICE_ROLE_KEY = "Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')"; // This won't work locally easily without the key

async function testEmail() {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/send-order-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      type: "confirmation",
      email: "rinaldi.p@gmail.com",
      orderId: "TEST-DEPLOY-LOG",
      status: "paid",
      total: 10.9,
      items: [{ name: "Teste de Deploy", price: 10.9, quantity: 1 }],
    }),
  });

  const res = await response.json();
  console.log(JSON.stringify(res, null, 2));
}

// testEmail();
