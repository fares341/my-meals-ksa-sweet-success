import { Flame, ChefHat, Truck, CalendarCheck } from "lucide-react";

const features = [
  {
    icon: Flame,
    title: "سعرات محسوبة",
    text: "كل وجبة موزونة بالجرام مع بروتين وكارب محدد بدقة حسب هدفك.",
  },
  {
    icon: ChefHat,
    title: "طهاة متخصصون",
    text: "فريق مطبخ محترف يحضّر أطباقاً لذيذة بمعايير صحية عالية.",
  },
  {
    icon: Truck,
    title: "توصيل يومي",
    text: "وجباتك تصلك طازجة كل يوم في الوقت الذي يناسبك داخل الطائف.",
  },
  {
    icon: CalendarCheck,
    title: "اشتراك مرن",
    text: "اختر عدد الوجبات والأيام، وأوقف أو عدّل اشتراكك بسهولة.",
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-black sm:text-4xl">لماذا وجباتي؟</h2>
        <p className="mt-4 text-muted-foreground">
          كل ما تحتاجه لتلتزم بنظامك الغذائي بدون طبخ ولا حساب ولا عناء.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <article
            key={f.title}
            className="group rounded-3xl border border-border bg-card p-7 text-right shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-lift"
          >
            <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary/8 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <f.icon className="size-7" />
            </span>
            <h3 className="mt-5 font-display text-xl font-bold">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}