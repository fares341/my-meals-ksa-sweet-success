import { MapPin, Calculator, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-meals.jpg";

export function Hero() {
  const scrollTo = (href: string) =>
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <section id="home" className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
        <div className="order-1 text-right">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <MapPin className="size-4" />
            متواجدون في الطائف
          </span>

          <h1 className="mt-6 font-display text-4xl leading-[1.15] font-black tracking-tight sm:text-5xl lg:text-6xl">
            وجبات <span className="text-primary">صحية</span> تُحضَّر
            <br />
            <span className="text-primary">يومياً</span> من أجلك
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            سعرات محسوبة بدقة، مكوّنات طازجة، وطهاة متخصصون يجهّزون وجباتك كل يوم ويوصلونها
            إلى بابك. اختر باقتك وابدأ رحلتك نحو هدفك بدون تعقيد.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              size="lg"
              onClick={() => scrollTo("#calculator")}
              className="rounded-full px-8 font-display text-base font-bold shadow-lift"
            >
              <Calculator className="size-5" />
              احسب سعراتك
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => scrollTo("#plans")}
              className="rounded-full border-primary/30 bg-transparent px-8 font-display text-base font-bold text-primary hover:bg-primary/5"
            >
              <UtensilsCrossed className="size-5" />
              تصفّح الباقات
            </Button>
          </div>

          <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 text-right">
            {[
              { k: "٥", v: "باقات غذائية" },
              { k: "٢٠+", v: "يوم اشتراك" },
              { k: "١٠٠٪", v: "طازج يومياً" },
            ].map((s) => (
              <div key={s.v}>
                <dt className="font-display text-2xl font-black text-primary">{s.k}</dt>
                <dd className="text-sm text-muted-foreground">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative order-2">
          <div className="overflow-hidden rounded-[2rem] shadow-lift">
            <img
              src={heroImage}
              alt="صناديق وجبات صحية جاهزة"
              width={1200}
              height={1200}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-6 left-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-lift sm:left-8">
            <p className="font-display text-lg font-black text-primary">٢٠ يوماً</p>
            <p className="text-sm text-muted-foreground">في الاشتراك الشهري</p>
          </div>
        </div>
      </div>
    </section>
  );
}