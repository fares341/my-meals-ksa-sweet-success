import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { arabicNumber } from "@/lib/meals";
import {
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

  useEffect(() => {
    setReceipt(readReceipt());
  }, []);

  const displayName = receipt?.full_name || name;
  const displayTx = receipt?.transaction_id || tx;
  const displayAmount = receipt?.total_price || amount;

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

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <section className="rounded-[2rem] border border-border bg-card p-7 shadow-soft">
            <h2 className="font-display text-xl font-bold">تفاصيل العملية</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {displayTx ? <Row label="رقم العملية" value={displayTx} ltr /> : null}
              {displayAmount ? (
                <Row label="المبلغ المدفوع" value={`${arabicNumber(displayAmount)} ريال`} />
              ) : null}
              {receipt ? (
                <Row label="طريقة الدفع" value={labelOf(paymentMethods, receipt.payment_method)} />
              ) : null}
              <Row label="حالة الدفع" value="مدفوع" highlight />
            </ul>
          </section>

          <section className="rounded-[2rem] border border-border bg-card p-7 shadow-soft">
            <h2 className="font-display text-xl font-bold">ملخص الاشتراك</h2>
            {receipt ? (
              <ul className="mt-4 space-y-3 text-sm">
                <Row label="الباقة" value={receipt.plan_name} />
                <Row label="الوجبات اليومية" value={arabicNumber(receipt.meals_per_day)} />
                <Row
                  label="أنواع الوجبات"
                  value={receipt.meal_types.map((m) => labelOf(mealTypeOptions, m)).join(" · ")}
                />
                <Row label="المدة" value={`${arabicNumber(receipt.duration_days)} يوم`} />
                <Row
                  label="أيام التوصيل"
                  value={receipt.delivery_days.map((d) => labelOf(weekDays, d)).join(" · ")}
                />
                <Row label="الحي" value={`${receipt.neighborhood} - الطائف`} />
                <Row label="موعد التوصيل" value={labelOf(timeSlots, receipt.time_slot)} />
                <Row label="تاريخ البداية" value={receipt.start_date} ltr />
                <Row label="تاريخ النهاية" value={receipt.end_date} ltr />
                <Row label="الجوال" value={receipt.whatsapp} ltr />
                <Row label="العنوان" value={receipt.address} />
                {receipt.notes ? <Row label="ملاحظات" value={receipt.notes} /> : null}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                تفاصيل الاشتراك محفوظة في نظامنا، وسنراجعها معك عند التواصل لتأكيد التوصيل.
              </p>
            )}
          </section>
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

function Row({
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
    <li className="flex items-start justify-between gap-3 border-b border-border pb-2 last:border-0">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span
        className={`text-left font-display font-bold ${highlight ? "text-primary" : ""}`}
        dir={ltr ? "ltr" : "auto"}
      >
        {value}
      </span>
    </li>
  );
}
