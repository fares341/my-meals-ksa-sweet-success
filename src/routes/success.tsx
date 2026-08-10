import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { arabicNumber } from "@/lib/meals";

type SuccessSearch = { tx?: string; amount?: number; name?: string };

export const Route = createFileRoute("/success")({
  validateSearch: (search: Record<string, unknown>): SuccessSearch => ({
    tx: typeof search['tx'] === "string" ? (search['tx'] as string) : undefined,
    amount: Number.isFinite(Number(search['amount'])) ? Number(search['amount']) : undefined,
    name: typeof search['name'] === "string" ? (search['name'] as string) : undefined,
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

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <div className="mx-auto inline-flex size-20 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="size-11 text-primary" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-black sm:text-4xl">
          تم الدفع وتأكيد اشتراكك بنجاح
        </h1>
        <p className="mt-4 text-muted-foreground">
          {name ? `شكراً لك ${name}، ` : ""}تم حفظ طلبك في نظامنا، وسيتواصل فريقنا معك على الواتساب
          لتأكيد أول توصيل.
        </p>

        <div className="mx-auto mt-10 max-w-md rounded-[2rem] border border-border bg-card p-7 text-right shadow-soft">
          <ul className="space-y-3 text-sm">
            {tx ? (
              <li className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">رقم العملية</span>
                <span className="font-display font-bold" dir="ltr">
                  {tx}
                </span>
              </li>
            ) : null}
            {amount ? (
              <li className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">المبلغ المدفوع</span>
                <span className="font-display font-bold">{arabicNumber(amount)} ريال</span>
              </li>
            ) : null}
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">حالة الدفع</span>
              <span className="font-display font-bold text-primary">مدفوع</span>
            </li>
          </ul>
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
