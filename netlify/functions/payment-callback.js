import crypto from "node:crypto";

// Paymob HMAC calculation: concatenate a fixed set of transaction fields (in this exact
// order) from the "obj" object, then HMAC-SHA512 with your Paymob HMAC secret.
// Docs: https://developers.paymob.com/egypt/webhooks/transaction-processed-callback
const HMAC_FIELDS = [
  "amount_cents",
  "created_at",
  "currency",
  "error_occured",
  "has_parent_transaction",
  "id",
  "integration_id",
  "is_3d_secure",
  "is_auth",
  "is_capture",
  "is_refunded",
  "is_standalone_payment",
  "is_voided",
  "order.id",
  "owner",
  "pending",
  "source_data.pan",
  "source_data.sub_type",
  "source_data.type",
  "success",
];

// NOTE: HMAC is computed over Paymob's own numeric order.id (never our transaction_id).
// merchant_order_id (our transaction_id) is a separate field we read only for matching
// the row in our own database — it is not part of the signed payload.

function getPath(obj, path) {
  return path.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

function verifyHmac(obj, receivedHmac, secret) {
  if (!secret || !receivedHmac) return false;
  const concatenated = HMAC_FIELDS.map((field) => {
    const value = getPath(obj, field);
    return value === undefined || value === null ? "" : String(value);
  }).join("");
  const computed = crypto.createHmac("sha512", secret).update(concatenated).digest("hex");
  return computed === receivedHmac;
}

export const handler = async (event) => {
  const params = event.queryStringParameters || {};
  const secret = process.env.PAYMOB_HMAC_SECRET;

  // Paymob's "Transaction processed callback" sends a JSON body with the transaction
  // under `obj`; the "Transaction response callback" (browser redirect) sends the same
  // fields flattened as query params, plus a top-level `hmac` param. Handle both.
  let txObj = null;
  let receivedHmac = params.hmac || "";
  let merchantOrderId = params.merchant_order_id || "";

  if (event.httpMethod === "POST" && event.body) {
    try {
      const parsed = JSON.parse(event.body);
      txObj = parsed.obj || parsed;
      receivedHmac = parsed.hmac || receivedHmac;
      merchantOrderId = getPath(txObj, "order.merchant_order_id") || merchantOrderId;
    } catch {
      // ignore, fall through to query params
    }
  }

  if (!txObj) {
    // Reconstruct a flat object from query params (GET redirect-style callback).
    // Note: the GET redirect uses `id` and `order_id` (flat), while the POST callback
    // uses `obj.id` and `obj.order.id` (nested) — different key shapes for the same data.
    txObj = {
      amount_cents: params.amount_cents,
      created_at: params.created_at,
      currency: params.currency,
      error_occured: params.error_occured,
      has_parent_transaction: params.has_parent_transaction,
      id: params.id,
      integration_id: params.integration_id,
      is_3d_secure: params["is_3d_secure"],
      is_auth: params.is_auth,
      is_capture: params.is_capture,
      is_refunded: params.is_refunded,
      is_standalone_payment: params.is_standalone_payment,
      is_voided: params.is_voided,
      order: { id: params.order_id },
      owner: params.owner,
      pending: params.pending,
      source_data: {
        pan: params["source_data.pan"],
        sub_type: params["source_data.sub_type"],
        type: params["source_data.type"],
      },
      success: params.success,
    };
  }

  const hmacValid = verifyHmac(txObj, receivedHmac, secret);
  const success = hmacValid && String(txObj.success).toLowerCase() === "true";
  const orderId = getPath(txObj, "order.id") || params.order || "";
  const ourTransactionId = merchantOrderId || orderId;

  if (!secret) {
    console.error("PAYMOB_HMAC_SECRET is not set — refusing to trust callback");
  } else if (!hmacValid) {
    console.error("Payment callback HMAC verification FAILED — possible spoofed request", {
      orderId,
    });
  }

  // Only touch the database when the signature actually checks out.
  if (hmacValid && ourTransactionId) {
    try {
      const { supabaseAdmin } = await import("../../src/integrations/supabase/client.server.ts");
      await supabaseAdmin
        .from("subscriptions")
        .update({ payment_status: success ? "paid" : "failed" })
        .eq("transaction_id", String(ourTransactionId));
    } catch (err) {
      console.error("Failed to update payment_status in Supabase:", err);
    }
  }

  // Browser redirects (GET) go to the success/failure page.
  // Server-to-server webhook calls (POST) just need a 200 OK.
  if (event.httpMethod === "POST") {
    return {
      statusCode: hmacValid ? 200 : 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ received: true, verified: hmacValid }),
    };
  }

  const location =
    hmacValid && success
      ? `/success?tx=${encodeURIComponent(ourTransactionId)}`
      : `/checkout?status=failed`;

  return {
    statusCode: 302,
    headers: { Location: location, "Cache-Control": "no-store" },
    body: "",
  };
};
