import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertCircle, ArrowRight, CreditCard, Loader2, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { arabicNumber } from "@/lib/meals";
import {
  labelOf,
  makeTransactionId,
  mealTypeOptions,
  paymentMethods,
  readDraft,
  saveReceipt,
  tabbyTotal,
  timeSlots,
  weekDays,
  type OrderDraft,
} from "@/lib/order";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "إتمام الدفع - وجباتي My Meals KSA" },
      {
        name: "description",
        content: "أكمل دفع اشتراك وجباتي بأمان عبر مدى أو البطاقة الائتمانية أو Apple Pay.",
      },
      { property: "og:title", content: "إتمام الدفع - وجباتي My Meals KSA" },
      {
        property: "og:description",
        content: "صفحة الدفع الآمنة لاشتراكات الوجبات الصحية في الطائف.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const [draft, setDraft] = useState<OrderDraft | null>(null);
  const [ready, setReady] = useState(false);
  const [method, setMethod] = useState<string>("mada");
  const [paying, setPaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [returnedFailed, setReturnedFailed] = useState(false);
  const isTabby = method === "tabby";
  const baseTotal = draft?.total_price ?? 0;
  const tabbyFee = isTabby ? tabbyTotal(baseTotal) - baseTotal : 0;
  const amountDue = baseTotal + tabbyFee;

  useEffect(() => {
    setDraft(readDraft());
    setReady(true);
    // If Paymob (or the callback) sent the customer back here after a cancelled/failed
    // payment, show a friendly retry banner instead of a blank page.
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("status") === "failed") setReturnedFailed(true);
    }
  }, []);

  const pay = async () => {
    if (!draft) return;
    setPaying(true);
    setErrorMsg(null);
    setReturnedFailed(false);
    const transaction_id = makeTransactionId();

    const { error } = await supabase.from("subscriptions").insert({
      full_name: draft.full_name,
      whatsapp: draft.whatsapp,
      city: "الطائف",
      address: draft.address,
      height_cm: draft.height_cm ? Number(draft.height_cm) : null,
      weight_kg: draft.weight_kg ? Number(draft.weight_kg) : null,
      birth_date: draft.birth_date || null,
      neighborhood: draft.neighborhood,
      time_slot: draft.time_slot,
      delivery_days: draft.delivery_days,
      meal_types: draft.meal_types,
      start_date: draft.start_date,
      end_date: draft.end_date,
      plan_id: draft.plan_id,
      plan_name: draft.plan_name,
      meals_per_day: draft.meals_per_day,
      duration_days: draft.duration_days,
      total_price: amountDue,
      payment_method: method,
      payment_status: "pending",
      transaction_id,
      coupon_code: draft.coupon_code || null,
      discount_amount: draft.discount_amount ?? 0,
      notes: [draft.free_gift ? `هدية: ${draft.free_gift}` : null, isTabby ? "تقسيط تابي (٤ أقساط) + رسوم ٨٪" : null]
        .filter(Boolean)
        .join(" · ") || null,
    });

    if (error) {
      setPaying(false);
      setErrorMsg("تعذّر حفظ الطلب. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.");
      toast.error("تعذّر إتمام العملية، حاول مرة أخرى");
      return;
    }

    saveReceipt({
      ...draft,
      total_price: amountDue,
      transaction_id,
      payment_method: method,
      paid_at: new Date().toISOString(),
    });

    try {
      const res = await fetch("/.netlify/functions/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountDue,
          paymentMethod: method,
          transactionId: transaction_id,
          customer: {
            name: draft.full_name,
            phone: draft.whatsapp,
            address: draft.address,
            city: "Taif",
          },
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        checkoutUrl?: string;
        error?: string;
      };

      if (!res.ok) {
        console.error("create-payment error:", data.error || res.status);
        throw new Error(data.error || `فشل الطلب (HTTP ${res.status})`);
      }
      if (!data.checkoutUrl) {
        console.error("create-payment missing fields:", data);
        throw new Error("لم يتم استلام رابط الدفع من السيرفر، حاول مرة أخرى");
      }

      // NOTE: we intentionally keep the saved draft here. If the customer cancels or the
      // payment fails on Paymob, they come back to this page with their order intact and can
      // simply press "ادفع الآن" again — no need to rebuild the subscription.
      window.location.href = data.checkoutUrl;
      return;
    } catch (err) {
      setPaying(false);
      const message = err instanceof Error ? err.message : "خطأ غير معروف";
      console.error("Payment error:", message);
      setErrorMsg(`تعذّر بدء عملية الدفع: ${message}`);
      toast.error(`تعذّر بدء عملية الدفع: ${message}`);
    }
  };

  if (!ready) return null;

  if (!draft) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center">
          {returnedFailed ? (
            <div className="mb-8 w-full rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-center">
              <p className="flex items-center justify-center gap-2 font-display font-bold text-destructive">
                <AlertCircle className="size-5" />
                لم تكتمل عملية الدفع
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                لو تم خصم أي مبلغ فسيتم مراجعته تلقائياً. تقدر تعيد بناء اشتراكك وتحاول مرة أخرى.
              </p>
            </div>
          ) : null}
          <h1 className="font-display text-3xl font-black">لا يوجد اشتراك للدفع</h1>
          <p className="mt-3 text-muted-foreground">
            الرجاء بناء اشتراكك وإدخال بياناتك أولاً ثم المتابعة إلى الدفع.
          </p>
          <Button asChild size="lg" className="mt-8 rounded-full font-display font-bold">
            <Link to="/">العودة لبناء الاشتراك</Link>
          </Button>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowRight className="size-4" />
          تعديل الاشتراك
        </Link>

        <h1 className="mt-4 font-display text-3xl font-black sm:text-4xl">الدفع وإتمام الاشتراك</h1>
        <p className="mt-3 text-muted-foreground">
          اختر طريقة الدفع المناسبة لك وأكمل العملية لتأكيد اشتراكك.
        </p>

        {returnedFailed ? (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div>
              <p className="font-display font-bold text-destructive">لم تكتمل عملية الدفع</p>
              <p className="mt-1 text-sm text-muted-foreground">
                لو تم خصم أي مبلغ فسيتم مراجعته تلقائياً. بياناتك محفوظة — تقدر تضغط "ادفع الآن"
                لإعادة المحاولة.
              </p>
            </div>
          </div>
        ) : null}

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-[2rem] border border-border bg-card p-6 shadow-soft sm:p-9">
            <h2 className="font-display text-xl font-bold">طريقة الدفع</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {paymentMethods.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setMethod(p.id)}
                  className={`rounded-2xl border p-4 text-right transition-all ${
                    method === p.id
                      ? "border-primary bg-primary/5 shadow-soft"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <span className="block font-display font-bold">{p.label}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{p.hint}</span>
                </button>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-border bg-secondary/40 p-6 text-center">
              <p className="font-display text-lg font-bold">
                {isTabby
                  ? "الدفع بالتقسيط عبر تابي (Tabby)"
                  : method === "apple_pay"
                  ? "الدفع عبر Apple Pay"
                  : method === "mada"
                    ? "الدفع عبر بطاقة مدى"
                    : "الدفع بالبطاقة الائتمانية"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {isTabby
                  ? "عند اختيار تابي سيتم إرسال رابط دفع مباشرةً على جوالك / الواتساب لإكمال التقسيط على ٤ دفعات، مع إضافة رسوم خدمة ٨٪ على الإجمالي."
                  : "سيتم تحويلك لصفحة الدفع الآمنة لإدخال بيانات البطاقة وإتمام العملية بأمان."}
              </p>
            </div>

            <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="size-4 text-primary" />
              بيئة دفع آمنة ومشفّرة عبر Paymob — يتم خصم المبلغ فعلياً عند إتمام العملية.
            </p>
          </div>

          <aside className="h-fit rounded-[2rem] bg-primary p-7 text-primary-foreground shadow-lift sm:p-9 lg:sticky lg:top-28">
            <p className="text-sm text-primary-foreground/70">ملخص الطلب</p>
            <p className="mt-2 font-display text-4xl font-black text-accent">
              {arabicNumber(amountDue)}
              <span className="ms-2 font-sans text-base font-medium text-primary-foreground/80">
                ريال
              </span>
            </p>

            <ul className="mt-6 space-y-3 text-sm">
              <Row label="الباقة" value={draft.plan_name} />
              {draft.discount_amount ? (
                <>
                  <Row
                    label="قيمة الاشتراك قبل الخصم"
                    value={`${arabicNumber(draft.subtotal_price ?? baseTotal)} ريال`}
                  />
                  <Row
                    label={`الخصم${draft.coupon_code ? ` (${draft.coupon_code})` : ""}`}
                    value={`- ${arabicNumber(draft.discount_amount)} ريال`}
                  />
                </>
              ) : null}
              {draft.free_gift ? <Row label="الهدية المجانية" value={draft.free_gift} /> : null}
              <Row label="الوجبات اليومية" value={arabicNumber(draft.meals_per_day)} />
              <Row
                label="أنواع الوجبات"
                value={draft.meal_types.map((m) => labelOf(mealTypeOptions, m)).join(" · ")}
              />
              <Row label="المدة" value={`${arabicNumber(draft.duration_days)} يوم`} />
              <Row
                label="أيام التوصيل"
                value={draft.delivery_days.map((d) => labelOf(weekDays, d)).join(" · ")}
              />
              <Row label="الحي" value={draft.neighborhood} />
              <Row label="الموعد" value={labelOf(timeSlots, draft.time_slot)} />
              <Row label="من" value={draft.start_date} />
              <Row label="إلى" value={draft.end_date} />
              <Row label="الاسم" value={draft.full_name} />
              <Row label="الجوال" value={draft.whatsapp} />
              {isTabby ? (
                <>
                  <Row label="قيمة الاشتراك" value={`${arabicNumber(baseTotal)} ريال`} />
                  <Row label="رسوم تابي (٨٪)" value={`${arabicNumber(tabbyFee)} ريال`} />
                  <Row label="الإجمالي بعد الرسوم" value={`${arabicNumber(amountDue)} ريال`} />
                </>
              ) : null}
            </ul>

            <Button
              size="lg"
              variant="secondary"
              onClick={pay}
              disabled={paying}
              className="mt-8 w-full rounded-full font-display text-base font-bold"
            >
              {paying ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  جاري التحويل لصفحة الدفع...
                </>
              ) : (
                <>
                  <CreditCard className="size-5" />
                  ادفع الآن
                </>
              )}
            </Button>

            {errorMsg ? (
              <div className="mt-4 flex items-start gap-2 rounded-2xl bg-primary-foreground/10 p-3 text-sm">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-accent" />
                <div className="flex-1">
                  <p>{errorMsg}</p>
                  <button
                    onClick={pay}
                    disabled={paying}
                    className="mt-1 font-display font-bold text-accent underline disabled:opacity-60"
                  >
                    إعادة المحاولة
                  </button>
                </div>
              </div>
            ) : null}

            <p className="mt-3 flex items-center justify-center gap-2 text-xs text-primary-foreground/60">
              <ShieldCheck className="size-4" />
              معاملة مشفّرة بالكامل
            </p>
          </aside>
        </div>
      </main>
      <SiteFooter />
      <Toaster position="top-center" />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-start justify-between gap-3 border-b border-primary-foreground/10 pb-2">
      <span className="shrink-0 text-primary-foreground/70">{label}</span>
      <span className="text-left font-display font-bold" dir="auto">
        {value}
      </span>
    </li>
  );
}
