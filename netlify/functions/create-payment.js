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
    // Each payment method is a separate Paymob integration with its own ID.
    // Tabby will NOT work through the card integration — Paymob decides which
    // checkout to render from the integration ID sent here. First name in each
    // list is the canonical env var; the rest are accepted aliases so a
    // differently-named Netlify variable still resolves.
    const INTEGRATION_ENV = {
      apple_pay: ["PAYMOB_APPLE_PAY_INTEGRATION_ID"],
      tabby: ["PAYMOB_TABBY_INTEGRATION_ID", "PAYMOB_TABBY_ID", "TABBY_INTEGRATION_ID"],
      mada: ["PAYMOB_MADA_INTEGRATION_ID", "PAYMOB_INTEGRATION_ID"],
      card: ["PAYMOB_INTEGRATION_ID"],
    };

    const candidates = INTEGRATION_ENV[paymentMethod] || INTEGRATION_ENV.card;
    const integrationId = candidates.map((name) => process.env[name]).find(Boolean);

    if (!secretKey || !publicKey || !integrationId) {
      const missing = [
        !secretKey && "PAYMOB_SECRET_KEY",
        !publicKey && "PAYMOB_PUBLIC_KEY",
        !integrationId &&
          `an integration ID for "${paymentMethod}" (looked for: ${candidates.join(", ")})`,
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
    // SITE_URL is an optional manual override (e.g. custom domain, or non-Netlify hosting).
    const siteUrl = process.env.URL || process.env.DEPLOY_URL || process.env.SITE_URL || "";
    const callbackUrl = siteUrl ? `${siteUrl}/.netlify/functions/payment-callback` : undefined;

    // If this is empty, Paymob is never told where to send the browser back or where to POST
    // the webhook — so the customer never lands on /success and the owner email never fires.
    // In that case you MUST register the callback URL manually in the Paymob dashboard, or set
    // SITE_URL in the environment.
    if (!callbackUrl) {
      console.error(
        "create-payment: no site URL available (URL / DEPLOY_URL / SITE_URL all empty) — " +
          "no redirection_url/notification_url sent to Paymob. Set SITE_URL or configure the " +
          "callback URL in the Paymob dashboard, otherwise /success + the owner email will not work.",
      );
    }

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
