import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, CheckCircle2, Copy, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { arabicNumber } from "@/lib/meals";
import {
  clearDraft,
  labelOf,
  mealTypeOptions,
  paymentMethods,
  readReceipt,
  timeSlots,
  weekDays,
  type OrderReceipt,
} from "@/lib/order";

type SuccessSearch = { tx: string; amount: number; name: string };

export const Route = createFileRoute("/success")({
  validateSearch: (search: Record<string, unknown>): SuccessSearch => ({
    tx: typeof search['tx'] === "string" ? (search['tx'] as string) : "",
    amount: Number.isFinite(Number(search['amount'])) ? Number(search['amount']) : 0,
    name: typeof search['name'] === "string" ? (search['name'] as string) : "",
  }),
  head: () => ({
    meta: [
      { title: "تم تأكيد اشتراكك - وجباتي My Meals KSA" },
      {
        name: "description",
        content: "تم استلام دفعتك وتأكيد اشتراك الوجبات الصحية، وسنتواصل معك لتأكيد التوصيل.",
      },
      { property: "og:title", content: "تم تأكيد اشتراكك - وجباتي My Meals KSA" },
      {
        property: "og:description",
        content: "شكراً لاشتراكك في وجباتي، وجباتك الصحية في الطريق إليك.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SuccessPage,
});

function SuccessPage() {
  const { tx, amount, name } = Route.useSearch();
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setReceipt(readReceipt());
    // Payment is confirmed at this point, so clear the draft. (We no longer clear it before
    // redirecting to Paymob, so a cancelled/failed payment can be retried from checkout.)
    clearDraft();
  }, []);

  const displayName = receipt?.full_name || name;
  const displayTx = receipt?.transaction_id || tx;
  const displayAmount = receipt?.total_price || amount;

  const copyTx = async () => {
    if (!displayTx) return;
    try {
      await navigator.clipboard.writeText(displayTx);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — silently ignore.
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <div className="mx-auto inline-flex size-20 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="size-11 text-primary" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-black sm:text-4xl">
            مبروك! تم تأكيد اشتراكك بنجاح 🎉
          </h1>
          <p className="mt-4 text-muted-foreground">
            {displayName ? `شكراً لك ${displayName}، ` : ""}تم استلام الدفع وحفظ طلبك في نظامنا،
            وسيتواصل فريقنا معك على الواتساب خلال ٢٤ ساعة لتأكيد أول توصيل.
          </p>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-xs font-bold text-primary">
            <Sparkles className="size-4 text-accent" />
            احتفظ برقم العملية للمراجعة مع خدمة العملاء
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-2xl overflow-hidden rounded-[2rem] border border-border bg-card shadow-soft">
          <div className="flex items-center justify-between border-b border-dashed border-border bg-secondary/30 px-7 py-5">
            <div>
              <p className="font-display text-lg font-black">إيصال الطلب</p>
              <p className="mt-0.5 text-xs text-muted-foreground">وجباتي My Meals KSA — الطائف</p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              مدفوع
            </span>
          </div>

          {displayTx ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-7 py-5">
              <div>
                <p className="text-xs text-muted-foreground">رقم العملية</p>
                <p className="mt-1 font-display text-lg font-black" dir="ltr">
                  {displayTx}
                </p>
              </div>
              <button
                onClick={copyTx}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-bold text-primary transition-colors hover:border-primary/40"
                aria-label="نسخ رقم العملية"
              >
                {copied ? (
                  <>
                    <Check className="size-4" />
                    تم النسخ
                  </>
                ) : (
                  <>
                    <Copy className="size-4" />
                    نسخ
                  </>
                )}
              </button>
            </div>
          ) : null}

          <div className="grid gap-x-8 gap-y-3 px-7 py-6 text-sm sm:grid-cols-2">
            {displayAmount ? (
              <ReceiptRow label="المبلغ المدفوع" value={`${arabicNumber(displayAmount)} ريال`} highlight />
            ) : null}
            {receipt ? (
              <ReceiptRow label="طريقة الدفع" value={labelOf(paymentMethods, receipt.payment_method)} />
            ) : null}
            {receipt ? <ReceiptRow label="الباقة" value={receipt.plan_name} /> : null}
            {receipt ? (
              <ReceiptRow label="الوجبات اليومية" value={arabicNumber(receipt.meals_per_day)} />
            ) : null}
            {receipt ? (
              <ReceiptRow
                label="أنواع الوجبات"
                value={receipt.meal_types.map((m) => labelOf(mealTypeOptions, m)).join(" · ")}
              />
            ) : null}
            {receipt ? (
              <ReceiptRow label="المدة" value={`${arabicNumber(receipt.duration_days)} يوم`} />
            ) : null}
            {receipt ? (
              <ReceiptRow
                label="أيام التوصيل"
                value={receipt.delivery_days.map((d) => labelOf(weekDays, d)).join(" · ")}
              />
            ) : null}
            {receipt ? (
              <ReceiptRow label="موعد التوصيل" value={labelOf(timeSlots, receipt.time_slot)} />
            ) : null}
            {receipt ? <ReceiptRow label="الحي" value={`${receipt.neighborhood} - الطائف`} /> : null}
            {receipt ? <ReceiptRow label="العنوان" value={receipt.address} /> : null}
            {receipt ? <ReceiptRow label="تاريخ البداية" value={receipt.start_date} ltr /> : null}
            {receipt ? <ReceiptRow label="تاريخ النهاية" value={receipt.end_date} ltr /> : null}
            {receipt ? <ReceiptRow label="الجوال" value={receipt.whatsapp} ltr /> : null}
            {receipt?.notes ? <ReceiptRow label="ملاحظات" value={receipt.notes} /> : null}
          </div>

          {!receipt ? (
            <p className="border-t border-border px-7 py-5 text-sm text-muted-foreground">
              تفاصيل الاشتراك محفوظة في نظامنا، وسنراجعها معك عند التواصل لتأكيد التوصيل.
            </p>
          ) : null}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="rounded-full font-display font-bold">
            <Link to="/">العودة للرئيسية</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full font-display font-bold">
            <a href="https://wa.me/message/6R7UXKZY5YVQA1" target="_blank" rel="noopener noreferrer">
              <MessageCircle className="size-5" />
              تواصل معنا
            </a>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function ReceiptRow({
  label,
  value,
  ltr,
  highlight,
}: {
  label: string;
  value: string;
  ltr?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-dashed border-border/70 pb-2 last:border-0">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span
        className={`text-left font-display font-bold ${highlight ? "text-primary" : ""}`}
        dir={ltr ? "ltr" : "auto"}
      >
        {value}
      </span>
    </div>
  );
}
