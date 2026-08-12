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

// Owner notification address. Override in Netlify env with NOTIFY_EMAIL if it ever changes,
// otherwise it defaults to the shop's Gmail below.
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || "mymealsksa@gmail.com";

// Sends the new-subscription notification using Resend (https://resend.com).
// Requires RESEND_API_KEY in Netlify env vars. RESEND_FROM_EMAIL is optional —
// defaults to Resend's shared "onboarding@resend.dev" sender, which works
// without verifying your own domain (fine for internal notification emails).
async function sendOrderEmail(sub) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set — skipping order confirmation email");
    return;
  }
  const from = process.env.RESEND_FROM_EMAIL || "My Meals KSA <onboarding@resend.dev>";

  const row = (label, value) =>
    value === undefined || value === null || value === ""
      ? ""
      : `<tr><td style="padding:6px 12px;color:#666;white-space:nowrap;">${label}</td><td style="padding:6px 12px;font-weight:bold;">${Array.isArray(value) ? value.join(" · ") : value}</td></tr>`;

  const html = `
    <div dir="rtl" style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;">
      <h2>اشتراك جديد مدفوع 🎉</h2>
      <table style="border-collapse:collapse;width:100%;">
        ${row("رقم العملية", sub.transaction_id)}
        ${row("الاسم", sub.full_name)}
        ${row("الجوال / واتساب", sub.whatsapp)}
        ${row("المدينة", sub.city)}
        ${row("الحي", sub.neighborhood)}
        ${row("العنوان", sub.address)}
        ${row("الباقة", sub.plan_name)}
        ${row("الوجبات اليومية", sub.meals_per_day)}
        ${row("أنواع الوجبات", sub.meal_types)}
        ${row("المدة (أيام)", sub.duration_days)}
        ${row("أيام التوصيل", sub.delivery_days)}
        ${row("موعد التوصيل", sub.time_slot)}
        ${row("تاريخ البداية", sub.start_date)}
        ${row("تاريخ النهاية", sub.end_date)}
        ${row("السعر الإجمالي", sub.total_price ? `${sub.total_price} ريال` : "")}
        ${row("طريقة الدفع", sub.payment_method)}
        ${row("ملاحظات", sub.notes)}
      </table>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [NOTIFY_EMAIL],
      subject: `اشتراك جديد مدفوع — ${sub.full_name || ""} (${sub.transaction_id || ""})`,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`Resend email failed (${res.status}): ${text.slice(0, 300)}`);
    if (!process.env.RESEND_FROM_EMAIL) {
      console.error(
        `Using the default onboarding@resend.dev sender — Resend only allows sending to the email address the Resend account itself was signed up with until you verify your own domain. If "${NOTIFY_EMAIL}" is not that exact address, delivery will always fail. Verify a domain in Resend and set RESEND_FROM_EMAIL, or change NOTIFY_EMAIL to match your Resend account email.`,
      );
    }
  } else {
    console.log("Order confirmation email sent to", NOTIFY_EMAIL);
  }
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
    // Note: the GET redirect uses `id` and the order id flat, while the POST callback
    // uses `obj.id` and `obj.order.id` (nested) — different key shapes for the same data.
    // Paymob has shipped the flat order id under BOTH `order_id` and `order` depending on
    // account/region, so we accept either — otherwise `order.id` in the HMAC concatenation
    // comes out empty and verification silently fails on every redirect.
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
      order: { id: params.order_id || params.order },
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
    console.error("Payment callback HMAC verification FAILED — possible spoofed request, or PAYMOB_HMAC_SECRET does not match the value in the Paymob dashboard", {
      method: event.httpMethod,
      orderId,
      merchantOrderId,
      receivedHmacPresent: Boolean(receivedHmac),
    });
  } else {
    console.log("Payment callback HMAC verified OK", {
      method: event.httpMethod,
      orderId,
      merchantOrderId,
      success,
    });
  }

  if (!ourTransactionId) {
    console.error("Payment callback: no transaction id (merchant_order_id / order id) found in payload — cannot update subscription row", {
      method: event.httpMethod,
    });
  }

  // Only touch the database when the signature actually checks out.
  if (hmacValid && ourTransactionId) {
    try {
      const { supabaseAdmin } = await import("../../src/integrations/supabase/client.server.ts");
      const newStatus = success ? "paid" : "failed";

      // Idempotent transition: only update rows that are NOT already in the target state.
      // Paymob delivers this callback more than once (browser redirect + one or more webhook
      // retries), so this `.neq(...)` guard guarantees we send the owner email exactly once —
      // on the real pending -> paid transition — instead of on every retry.
      const { error: updateError, data: updated } = await supabaseAdmin
        .from("subscriptions")
        .update({ payment_status: newStatus })
        .eq("transaction_id", String(ourTransactionId))
        .neq("payment_status", newStatus)
        .select("*");

      if (updateError) {
        console.error("Supabase update failed:", updateError.message);
      } else if (!updated || updated.length === 0) {
        // 0 rows means either (a) already processed — a duplicate/retry, which is fine and
        // expected, or (b) no subscription matches this transaction_id. If it's (b) on every
        // attempt, the id Paymob sent back does not equal the `transaction_id` we inserted
        // before redirecting (check that `special_reference` round-trips).
        console.warn(
          "Payment callback: 0 rows transitioned — already processed (idempotent retry) OR no subscription matches this transaction_id.",
          { ourTransactionId, newStatus },
        );
      } else {
        console.log("Subscription payment_status updated", {
          ourTransactionId,
          payment_status: newStatus,
        });

        // Email the owner only on the first successful transition (the row we just flipped
        // to "paid" is returned in `updated`, so no second query and no double-send).
        if (success) {
          try {
            await sendOrderEmail(updated[0]);
          } catch (emailErr) {
            console.error("Failed to send order confirmation email:", emailErr);
          }
        }
      }
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
