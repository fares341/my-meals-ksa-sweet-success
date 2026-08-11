import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, CreditCard, Loader2, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { arabicNumber } from "@/lib/meals";
import {
  clearDraft,
  labelOf,
  makeTransactionId,
  mealTypeOptions,
  paymentMethods,
  readDraft,
  saveReceipt,
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
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvc: "" });

  useEffect(() => {
    setDraft(readDraft());
    setReady(true);
  }, []);

  const pay = async () => {
    if (!draft) return;
    setPaying(true);
    const transaction_id = makeTransactionId();

    const { error } = await supabase.from("subscriptions").insert({
      full_name: draft.full_name,
      whatsapp: draft.whatsapp,
      city: "الطائف",
      address: draft.address,
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
      total_price: draft.total_price,
      payment_method: method,
      payment_status: "pending",
      transaction_id,
    });

    if (error) {
      setPaying(false);
      toast.error("تعذّر إتمام العملية، حاول مرة أخرى");
      return;
    }

    saveReceipt({
      ...draft,
      transaction_id,
      payment_method: method,
      paid_at: new Date().toISOString(),
    });

    try {
      const res = await fetch("/.netlify/functions/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: draft.total_price,
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
        paymentToken?: string;
        iframeId?: string | null;
        iframeUrl?: string | null;
        error?: string;
      };

      if (!res.ok) {
        console.error("create-payment error:", data.error || res.status);
        throw new Error(data.error || `فشل الطلب (HTTP ${res.status})`);
      }
      if (!data.paymentToken || !data.iframeUrl) {
        console.error("create-payment missing fields:", data);
        throw new Error("لم يتم استلام paymentToken أو iframeUrl من السيرفر");
      }

      clearDraft();
      window.location.href = data.iframeUrl;
      return;
    } catch (err) {
      setPaying(false);
      const message = err instanceof Error ? err.message : "خطأ غير معروف";
      console.error("Payment error:", message);
      toast.error(`تعذّر بدء عملية الدفع: ${message}`);
    }
  };

  if (!ready) return null;

  if (!draft) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center">
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

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-[2rem] border border-border bg-card p-6 shadow-soft sm:p-9">
            <h2 className="font-display text-xl font-bold">طريقة الدفع</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
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

            {method === "apple_pay" ? (
              <div className="mt-8 rounded-2xl border border-border bg-secondary/40 p-6 text-center">
                <p className="font-display text-lg font-bold">الدفع عبر Apple Pay</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  سيتم تأكيد العملية عبر جهازك عند الضغط على «ادفع الآن».
                </p>
              </div>
            ) : (
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="card_number">رقم البطاقة</Label>
                  <Input
                    id="card_number"
                    dir="ltr"
                    inputMode="numeric"
                    maxLength={19}
                    placeholder="4242 4242 4242 4242"
                    value={card.number}
                    onChange={(e) => setCard({ ...card, number: e.target.value })}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="card_name">الاسم على البطاقة</Label>
                  <Input
                    id="card_name"
                    maxLength={100}
                    value={card.name}
                    onChange={(e) => setCard({ ...card, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="card_expiry">تاريخ الانتهاء</Label>
                  <Input
                    id="card_expiry"
                    dir="ltr"
                    placeholder="MM/YY"
                    maxLength={5}
                    value={card.expiry}
                    onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="card_cvc">رمز التحقق CVC</Label>
                  <Input
                    id="card_cvc"
                    dir="ltr"
                    inputMode="numeric"
                    maxLength={4}
                    value={card.cvc}
                    onChange={(e) => setCard({ ...card, cvc: e.target.value })}
                  />
                </div>
              </div>
            )}

            <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="size-4 text-primary" />
              بيئة دفع آمنة .
            </p>
          </div>

          <aside className="h-fit rounded-[2rem] bg-primary p-7 text-primary-foreground shadow-lift sm:p-9 lg:sticky lg:top-28">
            <p className="text-sm text-primary-foreground/70">ملخص الطلب</p>
            <p className="mt-2 font-display text-4xl font-black text-accent">
              {arabicNumber(draft.total_price)}
              <span className="ms-2 font-sans text-base font-medium text-primary-foreground/80">
                ريال
              </span>
            </p>

            <ul className="mt-6 space-y-3 text-sm">
              <Row label="الباقة" value={draft.plan_name} />
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
            </ul>

            <Button
              size="lg"
              variant="secondary"
              onClick={pay}
              disabled={paying}
              className="mt-8 w-full rounded-full font-display text-base font-bold"
            >
              {paying ? <Loader2 className="size-5 animate-spin" /> : <CreditCard className="size-5" />}
              ادفع الآن
            </Button>
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
