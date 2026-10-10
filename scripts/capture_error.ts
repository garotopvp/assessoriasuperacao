async function debug() {
  try {
    const res = await fetch(
      "https://tdzdureusnszdzvsoomr.supabase.co/functions/v1/send-order-email",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer sb_publishable_V_3gNz5TWpeZ6MSxidwgtQ_nP4HPK5g",
        },
        body: JSON.stringify({ email: "rinaldi.p@gmail.com" }),
      }
    );

    const data = await res.json();
    console.log("STATUS:", res.status);
    console.log("DATA:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.log("CRITICAL ERROR:", err.message);
  }
}

debug();
