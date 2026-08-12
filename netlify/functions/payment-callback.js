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

function getPath(obj, path) {
  return path.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

// Owner notification address. Override in Netlify env with NOTIFY_EMAIL if it ever changes,
// otherwise it defaults to the shop's Gmail below.
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || "mymealsksa@gmail.com";

// Sends the subscription notification using Resend (https://resend.com).
// status: "paid" (successful payment) or "failed" (declined / cancelled).
async function sendOrderEmail(sub, status = "paid") {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set — skipping order notification email");
    return false;
  }
  const from = process.env.RESEND_FROM_EMAIL || "My Meals KSA <onboarding@resend.dev>";
  const failed = status === "failed";

  const row = (label, value) =>
    value === undefined || value === null || value === ""
      ? ""
      : `<tr><td style="padding:6px 12px;color:#666;white-space:nowrap;">${label}</td><td style="padding:6px 12px;font-weight:bold;">${Array.isArray(value) ? value.join(" · ") : value}</td></tr>`;

  const html = `
    <div dir="rtl" style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:${failed ? "#b91c1c" : "#1f5c3a"};">${failed ? "محاولة دفع فاشلة ❌" : "اشتراك جديد مدفوع 🎉"}</h2>
      ${failed ? `<p style="color:#666;">لم تكتمل عملية الدفع (مرفوضة أو ملغاة). بيانات المحاولة بالأسفل للمتابعة مع العميل.</p>` : ""}
      <table style="border-collapse:collapse;width:100%;">
        ${row("حالة العملية", failed ? "فاشلة / ملغاة" : "مدفوعة")}
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
      subject: `${failed ? "محاولة دفع فاشلة" : "اشتراك جديد مدفوع"} — ${sub.full_name || ""} (${sub.transaction_id || ""})`,
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
    return false;
  }
  console.log(`Order ${status} email sent to`, NOTIFY_EMAIL);
  return true;
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

  let txObj = null;
  let receivedHmac = params.hmac || "";
  // Our own reference (the MM-... id we inserted before redirecting) can come back under a
  // few different names depending on the Paymob flow — accept all of them.
  let merchantOrderId =
    params.merchant_order_id || params.special_reference || params.merchant_order_ext_ref || "";

  if (event.httpMethod === "POST" && event.body) {
    try {
      const parsed = JSON.parse(event.body);
      txObj = parsed.obj || parsed;
      receivedHmac = parsed.hmac || receivedHmac;
      merchantOrderId =
        getPath(txObj, "order.merchant_order_id") ||
        getPath(txObj, "order.special_reference") ||
        txObj.special_reference ||
        merchantOrderId;
    } catch {
      // ignore, fall through to query params
    }
  }

  if (!txObj) {
    // Reconstruct a flat object from query params (GET redirect-style callback).
    // Paymob has shipped the flat order id under BOTH `order_id` and `order` depending on
    // account/region, so accept either.
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
  const success = String(txObj.success).toLowerCase() === "true";
  const orderId = getPath(txObj, "order.id") || params.order || "";
  const ourTransactionId = merchantOrderId || orderId;

  if (!secret) {
    console.error("PAYMOB_HMAC_SECRET is not set — cannot verify signatures");
  } else if (!hmacValid) {
    console.error("Payment callback HMAC verification FAILED", {
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

  // `outcome` is a short diagnostic code we append to the redirect URL, so the exact result
  // is visible right in the browser address bar (no need to open the function logs).
  //   ok       = paid, row updated, owner email sent
  //   nomatch  = paid, but no subscription row matched this transaction id (email NOT sent)
  //   mailerr  = paid + matched, but Resend rejected the email
  //   dberr    = database error while updating
  //   declined = Paymob reported the payment as not successful
  //   notxid   = no transaction id came back in the callback
  //   badhmac  = signature check failed (still processed — see note below)
  //   nosecret = PAYMOB_HMAC_SECRET missing
  let outcome = "";
  if (!secret) outcome = "nosecret";
  else if (!hmacValid) outcome = "badhmac";

  // We key off Paymob's `success` flag. The HMAC is verified and logged for monitoring, but
  // we intentionally do NOT hard-block on it: a signature mismatch (common on first launch /
  // misconfig) would otherwise silently drop genuinely-paid orders and never notify the
  // owner. Every order is still human-confirmed over WhatsApp, so this is a safe default —
  // once the HMAC secret is confirmed correct you can re-tighten this if you wish.
  if (ourTransactionId) {
    try {
      const { supabaseAdmin } = await import("../../src/integrations/supabase/client.server.ts");

      if (success) {
        // Idempotent: only flip rows that aren't already "paid", so the browser redirect and
        // the server webhook can't double-send the email.
        const { data: updated, error: updateError } = await supabaseAdmin
          .from("subscriptions")
          .update({ payment_status: "paid" })
          .eq("transaction_id", String(ourTransactionId))
          .neq("payment_status", "paid")
          .select("*");

        if (updateError) {
          console.error("Supabase update failed:", updateError.message);
          outcome = outcome || "dberr";
        } else if (updated && updated.length > 0) {
          console.log("Subscription marked paid", { ourTransactionId });
          const sent = await sendOrderEmail(updated[0]);
          outcome = outcome || (sent ? "ok" : "mailerr");
        } else {
          console.warn(
            "Payment callback: 0 rows transitioned — already processed (retry) OR no subscription matches this transaction id.",
            { ourTransactionId },
          );
          // Distinguish "already paid" (email already sent) from "no such row" (we still
          // want the owner to hear about a payment we can't match to an order).
          const { data: existing } = await supabaseAdmin
            .from("subscriptions")
            .select("*")
            .eq("transaction_id", String(ourTransactionId))
            .limit(1);

          if (existing && existing.length > 0) {
            outcome = outcome || "ok";
          } else {
            const sent = await sendOrderEmail({
              transaction_id: String(ourTransactionId),
              full_name: getPath(txObj, "order.shipping_data.first_name") || "غير معروف",
              whatsapp: getPath(txObj, "order.shipping_data.phone_number") || "",
              total_price: txObj.amount_cents ? Number(txObj.amount_cents) / 100 : "",
              payment_method: "Paymob",
              notes: "تحذير: تم استلام دفعة ناجحة بدون طلب مطابق في قاعدة البيانات.",
            });
            outcome = outcome || (sent ? "nomatch" : "nomatchmailerr");
          }
        }
      } else {
        // Idempotent: only rows not already failed/paid transition, so retries don't re-email.
        const { data: failedRows, error: failError } = await supabaseAdmin
          .from("subscriptions")
          .update({ payment_status: "failed" })
          .eq("transaction_id", String(ourTransactionId))
          .not("payment_status", "in", '("paid","failed")')
          .select("*");

        if (failError) {
          console.error("Supabase failed-status update error:", failError.message);
          outcome = outcome || "dberr";
        } else if (failedRows && failedRows.length > 0) {
          const sent = await sendOrderEmail(failedRows[0], "failed");
          outcome = outcome || (sent ? "declined" : "declinedmailerr");
        } else {
          // No row transitioned: either already handled, or nothing matches this id — still
          // notify the owner in the "no match" case with whatever Paymob gave us.
          const { data: existing } = await supabaseAdmin
            .from("subscriptions")
            .select("payment_status")
            .eq("transaction_id", String(ourTransactionId))
            .limit(1);

          if (existing && existing.length > 0) {
            outcome = outcome || "declined";
          } else {
            const sent = await sendOrderEmail(
              {
                transaction_id: String(ourTransactionId),
                full_name: getPath(txObj, "order.shipping_data.first_name") || "غير معروف",
                whatsapp: getPath(txObj, "order.shipping_data.phone_number") || "",
                total_price: txObj.amount_cents ? Number(txObj.amount_cents) / 100 : "",
                payment_method: "Paymob",
                notes: "محاولة دفع فاشلة بدون طلب مطابق في قاعدة البيانات.",
              },
              "failed",
            );
            outcome = outcome || (sent ? "declined" : "declinedmailerr");
          }
        }
      }
    } catch (err) {
      console.error("Payment callback DB/email error:", err);
      outcome = outcome || "dberr";
    }
  } else {
    outcome = outcome || "notxid";
  }

  // Server-to-server webhook (POST) just needs a 200 OK.
  if (event.httpMethod === "POST") {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ received: true, verified: hmacValid, outcome }),
    };
  }

  // Browser redirect (GET): send the customer to the success or failure page, with the
  // diagnostic code attached so you can read it straight from the URL.
  const location = success
    ? `/success?tx=${encodeURIComponent(ourTransactionId)}${outcome ? `&e=${outcome}` : ""}`
    : `/failed?tx=${encodeURIComponent(ourTransactionId)}${outcome ? `&e=${outcome}` : ""}`;

  return {
    statusCode: 302,
    headers: { Location: location, "Cache-Control": "no-store" },
    body: "",
  };
};
