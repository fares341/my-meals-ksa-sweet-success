import { createFileRoute } from "@tanstack/react-router";

// Paymob Unified Checkout (Intentions API).
// Docs: https://developers.paymob.com/paymob-docs/developers/intention-apis/create-intention
const PAYMOB_BASE = process.env.PAYMOB_BASE_URL || "https://ksa.paymob.com";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function createIntention(body: unknown, secretKey: string) {
  const res = await fetch(`${PAYMOB_BASE}/v1/intention/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${secretKey}`,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: any;
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

export const Route = createFileRoute("/api/public/create-payment")({
  server: {
    handlers: {
      OPTIONS: async () => {
        return new Response("", { status: 204, headers });
      },
      POST: async ({ request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as {
            amount?: number;
            customer?: {
              name?: string;
              phone?: string;
              address?: string;
              city?: string;
              state?: string;
              email?: string;
            };
            paymentMethod?: string;
            transactionId?: string;
          };

          const {
            amount,
            customer = {},
            paymentMethod = "card",
            transactionId,
          } = body;

          const numericAmount = Number(amount);
          if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            return new Response(JSON.stringify({ error: "Invalid amount" }), {
              status: 400,
              headers,
            });
          }

          const secretKey = process.env.PAYMOB_SECRET_KEY;
          const publicKey = process.env.PAYMOB_PUBLIC_KEY;

          // Each payment method is a separate Paymob integration with its own ID.
          const INTEGRATION_ENV: Record<string, string[]> = {
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

            return new Response(
              JSON.stringify({
                error: `Paymob credentials are not configured: missing ${missing.join(", ")}`,
              }),
              {
                status: 500,
                headers,
              },
            );
          }

          const amountCents = Math.round(numericAmount * 100);
          const nameParts = String(customer.name || "Customer").trim().split(" ");

          let origin = "";
          try {
            origin = new URL(request.url).origin;
          } catch {
            // ignore
          }

          const siteUrl =
            process.env.URL ||
            process.env.DEPLOY_URL ||
            process.env.SITE_URL ||
            origin ||
            "";

          const callbackUrl = siteUrl
            ? `${siteUrl}/.netlify/functions/payment-callback`
            : undefined;

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
              ...(callbackUrl
                ? { notification_url: callbackUrl, redirection_url: callbackUrl }
                : {}),
            },
            secretKey,
          );

          const clientSecret = intention.client_secret;
          if (!clientSecret) {
            return new Response(
              JSON.stringify({
                error: "Paymob response missing client_secret",
                details: intention,
              }),
              {
                status: 502,
                headers,
              },
            );
          }

          const checkoutUrl = `${PAYMOB_BASE}/unifiedcheckout/?publicKey=${encodeURIComponent(
            publicKey,
          )}&clientSecret=${encodeURIComponent(clientSecret)}`;

          return new Response(
            JSON.stringify({
              checkoutUrl,
              intentionId: intention.id || null,
            }),
            {
              status: 200,
              headers,
            },
          );
        } catch (error) {
          return new Response(
            JSON.stringify({
              error: error instanceof Error ? error.message : "Unknown error",
            }),
            {
              status: 502,
              headers,
            },
          );
        }
      },
    },
  },
});
