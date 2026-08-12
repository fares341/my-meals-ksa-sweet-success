import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, MessageCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

type FailedSearch = { tx: string; e: string };

const reasons: Record<string, string> = {
  declined: "تم رفض العملية من قِبل البنك أو بوابة الدفع.",
  cancelled: "تم إلغاء عملية الدفع قبل إتمامها.",
  notxid: "لم نستلم رقم عملية من بوابة الدفع.",
  badhmac: "تعذّر التحقق من صحة بيانات العملية.",
  nosecret: "إعدادات بوابة الدفع غير مكتملة.",
  dberr: "حدث خطأ أثناء حفظ الطلب.",
};

export const Route = createFileRoute("/failed")({
  validateSearch: (search: Record<string, unknown>): FailedSearch => ({
    tx: typeof search["tx"] === "string" ? (search["tx"] as string) : "",
    e: typeof search["e"] === "string" ? (search["e"] as string) : "",
  }),
  head: () => ({
    meta: [
      { title: "لم تكتمل عملية الدفع - وجباتي My Meals KSA" },
      {
        name: "description",
        content: "لم تكتمل عملية الدفع لاشتراك الوجبات الصحية، يمكنك إعادة المحاولة أو التواصل معنا.",
      },
      { property: "og:title", content: "لم تكتمل عملية الدفع - وجباتي My Meals KSA" },
      {
        property: "og:description",
        content: "حدث خطأ في عملية الدفع، أعد المحاولة أو تواصل مع فريق وجباتي.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FailedPage,
});

function FailedPage() {
  const { tx, e } = Route.useSearch();
  const reason = reasons[e] ?? "لم تكتمل عملية الدفع.";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
        <div className="text-center">
          <div className="mx-auto inline-flex size-20 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="size-11 text-destructive" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-black sm:text-4xl">
            عذراً، فشلت عملية الدفع
          </h1>
          <p className="mt-4 text-muted-foreground">
            {reason} لم يتم خصم أي مبلغ ولم يتم تأكيد اشتراكك. يمكنك إعادة المحاولة الآن، وبياناتك
            المحفوظة ما زالت موجودة في صفحة الدفع.
          </p>
          {tx ? (
            <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-xs font-bold text-primary">
              رقم المحاولة:
              <span dir="ltr">{tx}</span>
            </p>
          ) : null}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="rounded-full font-display font-bold">
            <Link to="/checkout">
              <RefreshCcw className="size-5" />
              إعادة المحاولة
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full font-display font-bold">
            <a href="https://wa.me/message/6R7UXKZY5YVQA1" target="_blank" rel="noopener noreferrer">
              <MessageCircle className="size-5" />
              تواصل معنا
            </a>
          </Button>
          <Button asChild size="lg" variant="ghost" className="rounded-full font-display font-bold">
            <Link to="/">العودة للرئيسية</Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}