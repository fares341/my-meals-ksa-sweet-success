// IMPORTANT: Paymob has separate servers per country.
// Egypt account  -> https://accept.paymob.com
// Saudi Arabia   -> https://ksa.paymob.com
// UAE            -> https://uae.paymob.com
// Oman           -> https://oman.paymob.com
// Set PAYMOB_BASE_URL in Netlify env vars to match the country your Paymob account was created under.
const PAYMOB_BASE = `${process.env.PAYMOB_BASE_URL || "https://ksa.paymob.com"}/api`;

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function post(path, body) {
  const res = await fetch(`${PAYMOB_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`Paymob ${path} failed (${res.status}): ${text.slice(0, 300)}`);
  }
  return json;
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const {
      amount,
      customer = {},
      paymentMethod = "card",
      transactionId,
    } = JSON.parse(event.body || "{}");

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid amount" }) };
    }

    const apiKey = process.env.PAYMOB_API_KEY;
    const iframeId = process.env.PAYMOB_IFRAME_ID;
    const integrationId =
      paymentMethod === "apple_pay"
        ? process.env.PAYMOB_APPLE_PAY_INTEGRATION_ID
        : process.env.PAYMOB_INTEGRATION_ID;

    if (!apiKey || !integrationId) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Paymob credentials are not configured" }),
      };
    }

    // 1) Auth token
    const auth = await post("/auth/tokens", { api_key: apiKey });

    // 2) Order registration (amount in cents)
    const amountCents = Math.round(numericAmount * 100);
    const order = await post("/ecommerce/orders", {
      auth_token: auth.token,
      delivery_needed: false,
      amount_cents: amountCents,
      currency: "SAR",
      items: [],
      ...(transactionId ? { merchant_order_id: transactionId } : {}),
    });

    // 3) Payment key
    const nameParts = String(customer.name || "Customer").trim().split(" ");
    const billing = {
      first_name: nameParts[0] || "Customer",
      last_name: nameParts.slice(1).join(" ") || "Customer",
      phone_number: customer.phone || "+966500000000",
      email: customer.email || "customer@mymeals.sa",
      street: customer.address || "NA",
      building: "NA",
      floor: "NA",
      apartment: "NA",
      city: customer.city || "Taif",
      state: customer.state || "Taif",
      country: "SAU",
      postal_code: "NA",
      shipping_method: "NA",
    };

    const paymentKey = await post("/acceptance/payment_keys", {
      auth_token: auth.token,
      amount_cents: amountCents,
      expiration: 3600,
      order_id: order.id,
      billing_data: billing,
      currency: "SAR",
      integration_id: Number(integrationId),
    });

    const iframeDomain = process.env.PAYMOB_BASE_URL || "https://ksa.paymob.com";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        paymentToken: paymentKey.token,
        iframeId: iframeId || null,
        orderId: order.id,
        iframeUrl: iframeId
          ? `${iframeDomain}/api/acceptance/iframes/${iframeId}?payment_token=${paymentKey.token}`
          : null,
      }),
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
    };
  }
};
