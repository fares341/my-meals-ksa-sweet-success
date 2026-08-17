import { supabase } from "@/integrations/supabase/client";

export type CouponResult = {
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  discount_amount: number;
};

export function discountFor(
  type: "percentage" | "fixed",
  value: number,
  total: number,
): number {
  const raw = type === "percentage" ? (total * value) / 100 : value;
  return Math.min(Math.round(raw), total);
}

// Characters a coupon code is allowed to contain: any unicode letter or digit
// plus a few safe separators. Everything else (notably `%`, `*`, `\` and `,`)
// is rejected before it reaches PostgREST, where those characters would be
// interpreted as LIKE wildcards / filter syntax instead of literal text.
const CODE_SHAPE = /^[\p{L}\p{N}_.+-]{1,64}$/u;

// `_` is still a single-character LIKE wildcard, so escape it. PostgreSQL's
// LIKE/ILIKE uses backslash as the default escape character.
function escapeLikeLiteral(value: string): string {
  return value.replace(/[_]/g, "\\$&");
}

// Invisible characters that ride along when a code is copied out of WhatsApp or
// an RTL document: LRM, RLM, ALM, zero-width space/non-joiner/joiner, BOM.
const INVISIBLES = /[\u200B-\u200F\u061C\uFEFF]/g;

export function normalizeCouponCode(input: string): string {
  return input.replace(INVISIBLES, "").trim();
}

export async function validateCoupon(
  input: string,
  total: number,
): Promise<{ ok: true; coupon: CouponResult } | { ok: false; error: string }> {
  const code = normalizeCouponCode(input);
  if (!code) return { ok: false, error: "أدخل كود الخصم" };
  if (!CODE_SHAPE.test(code)) return { ok: false, error: "كود الخصم غير صحيح أو غير مفعّل" };

  // ILIKE against an escaped literal == exact match, ignoring case. The unique
  // index on lower(code) guarantees at most one row can come back.
  const { data, error } = await supabase
    .from("coupons")
    .select("code, discount_type, discount_value, usage_limit, times_used")
    .ilike("code", escapeLikeLiteral(code))
    .eq("is_active", true)
    .maybeSingle();

  if (error) return { ok: false, error: "تعذّر التحقق من الكود، حاول مرة أخرى" };
  if (!data) return { ok: false, error: "كود الخصم غير صحيح أو غير مفعّل" };
  if (data.usage_limit != null && (data.times_used ?? 0) >= data.usage_limit) {
    return { ok: false, error: "تم استهلاك هذا الكود بالكامل" };
  }

  const type = data.discount_type as "percentage" | "fixed";
  const value = Number(data.discount_value);
  const discount_amount = discountFor(type, value, total);
  if (discount_amount <= 0) return { ok: false, error: "كود الخصم غير قابل للتطبيق" };

  return {
    ok: true,
    coupon: { code: data.code, discount_type: type, discount_value: value, discount_amount },
  };
}
