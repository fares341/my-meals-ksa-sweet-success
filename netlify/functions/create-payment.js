// Paymob Unified Checkout (Intentions API).
// Docs: https://developers.paymob.com/paymob-docs/developers/intention-apis/create-intention
//
// Servers are per-country — pick the one matching where your Paymob account was created:
//   Egypt        -> https://accept.paymob.com
//   Saudi Arabia -> https://ksa.paymob.com
//   UAE          -> https://uae.paymob.com
//   Oman         -> https://oman.paymob.com
const PAYMOB_BASE = process.env.PAYMOB_BASE_URL || "https://ksa.paymob.com";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function createIntention(body, secretKey) {
  const res = await fetch(`${PAYMOB_BASE}/v1/intention/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${secretKey}`,
    },
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
    throw new Error(`Paymob /v1/intention/ failed (${res.status}): ${text.slice(0, 400)}`);
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

    const secretKey = process.env.PAYMOB_SECRET_KEY;
    const publicKey = process.env.PAYMOB_PUBLIC_KEY;
    const integrationId =
      paymentMethod === "apple_pay"
        ? process.env.PAYMOB_APPLE_PAY_INTEGRATION_ID
        : process.env.PAYMOB_INTEGRATION_ID;

    if (!secretKey || !publicKey || !integrationId) {
      const missing = [
        !secretKey && "PAYMOB_SECRET_KEY",
        !publicKey && "PAYMOB_PUBLIC_KEY",
        !integrationId && "PAYMOB_INTEGRATION_ID / PAYMOB_APPLE_PAY_INTEGRATION_ID",
      ].filter(Boolean);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: `Paymob credentials are not configured: missing ${missing.join(", ")}` }),
      };
    }

    const amountCents = Math.round(numericAmount * 100);
    const nameParts = String(customer.name || "Customer").trim().split(" ");

    // Netlify sets `URL` to the deployed site's base URL automatically at runtime.
    const siteUrl = process.env.URL || process.env.DEPLOY_URL || "";
    const callbackUrl = siteUrl ? `${siteUrl}/.netlify/functions/payment-callback` : undefined;

    const intention = await createIntention(
      {
        amount: amountCents,
        currency: "SAR",
        payment_methods: [Number(integrationId)],
        billing_data: {
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
        },
        special_reference: transactionId || undefined,
        ...(callbackUrl ? { notification_url: callbackUrl, redirection_url: callbackUrl } : {}),
      },
      secretKey,
    );

    const clientSecret = intention.client_secret;
    if (!clientSecret) {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: "Paymob response missing client_secret", details: intention }),
      };
    }

    const checkoutUrl = `${PAYMOB_BASE}/unifiedcheckout/?publicKey=${encodeURIComponent(
      publicKey,
    )}&clientSecret=${encodeURIComponent(clientSecret)}`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ checkoutUrl, intentionId: intention.id || null }),
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
    };
  }
};
