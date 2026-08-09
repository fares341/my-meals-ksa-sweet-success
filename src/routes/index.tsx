import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Hero } from "@/components/site/Hero";
import { Features } from "@/components/site/Features";
import { BmrCalculator } from "@/components/site/BmrCalculator";
import { PlansShowcase } from "@/components/site/PlansShowcase";
import { HowItWorks } from "@/components/site/HowItWorks";
import { PricingBuilder } from "@/components/site/PricingBuilder";
import { SiteFooter } from "@/components/site/SiteFooter";
import { WhatsAppFab } from "@/components/site/WhatsAppFab";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "وجباتي - وجبات صحية بسعرات محسوبة في الطائف" },
      {
        name: "description",
        content:
          "اشترك في وجبات صحية تُحضَّر يومياً في الطائف: سعرات محسوبة، خمس باقات غذائية، وتوصيل يومي إلى بابك.",
      },
      { property: "og:title", content: "وجباتي - وجبات صحية بسعرات محسوبة في الطائف" },
      {
        property: "og:description",
        content:
          "خمس باقات غذائية، حاسبة سعرات ذكية، وأسعار مرنة تبدأ من ٣٠ ريال لليوم مع توصيل يومي في الطائف.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [planId, setPlanId] = useState("lowcarb");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <h1 className="sr-only">وجباتي - اشتراكات وجبات صحية في الطائف</h1>
        <Hero />
        <Features />
        <BmrCalculator onSuggest={setPlanId} />
        <PlansShowcase onChoose={setPlanId} />
        <HowItWorks />
        <PricingBuilder planId={planId} onPlanChange={setPlanId} />
      </main>
      <SiteFooter />
      <WhatsAppFab />
      <Toaster position="top-center" />
    </div>
  );
}
