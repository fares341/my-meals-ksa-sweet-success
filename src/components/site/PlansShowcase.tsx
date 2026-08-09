import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { plans } from "@/lib/meals";
import heroImage from "@/assets/hero-meals.jpg";
import lowcarbImage from "@/assets/plan-lowcarb.jpg";
import bulkingImage from "@/assets/plan-bulking.jpg";

const images: Record<string, string> = {
  lifestyle: heroImage,
  lowcarb: lowcarbImage,
  bulking: bulkingImage,
  cutting: heroImage,
  keto: lowcarbImage,
};

export function PlansShowcase({ onChoose }: { onChoose: (planId: string) => void }) {
  return (
    <section id="plans" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-black sm:text-4xl">باقاتنا الغذائية</h2>
        <p className="mt-4 text-muted-foreground">
          خمس باقات مصممة بمقادير محددة من البروتين والكارب لتناسب كل هدف.
        </p>
      </div>

      <div className="mt-16 space-y-20">
        {plans.map((plan, index) => (
          <div
            key={plan.id}
            className="grid items-center gap-10 lg:grid-cols-2"
          >
            <div className={index % 2 === 0 ? "lg:order-2" : "lg:order-1"}>
              <div className="overflow-hidden rounded-[2rem] shadow-lift">
                <img
                  src={images[plan.id]}
                  alt={plan.name}
                  loading="lazy"
                  width={1000}
                  height={800}
                  className="h-72 w-full object-cover sm:h-96"
                />
              </div>
            </div>

            <div className={`text-right ${index % 2 === 0 ? "lg:order-1" : "lg:order-2"}`}>
              <span className="text-sm font-semibold tracking-widest text-accent-foreground/80 uppercase">
                {plan.latin}
              </span>
              <h3 className="mt-2 font-display text-3xl font-black sm:text-4xl">{plan.name}</h3>
              <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">
                {plan.description}
              </p>
              <ul className="mt-6 space-y-3">
                {plan.highlights.map((h) => (
                  <li key={h} className="flex items-center gap-3">
                    <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Check className="size-4" />
                    </span>
                    <span className="text-base">{h}</span>
                  </li>
                ))}
              </ul>
              <Button
                size="lg"
                onClick={() => {
                  onChoose(plan.id);
                  document
                    .querySelector("#pricing")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="mt-8 rounded-full px-8 font-display font-bold shadow-soft"
              >
                اختر هذه الباقة
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}