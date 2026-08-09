import { useMemo, useState } from "react";
import { Loader2, ShoppingBag } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { arabicNumber, durations, getPrice, mealCounts, plans } from "@/lib/meals";

const checkoutSchema = z.object({
  full_name: z.string().trim().min(3, "الاسم قصير جداً").max(100, "الاسم طويل جداً"),
  whatsapp: z
    .string()
    .trim()
    .min(9, "رقم الواتساب غير صحيح")
    .max(20, "رقم الواتساب غير صحيح")
    .regex(/^[0-9+\s-]+$/, "رقم الواتساب غير صحيح"),
  address: z.string().trim().min(10, "الرجاء كتابة عنوان مفصل").max(500, "العنوان طويل جداً"),
});

type Props = {
  planId: string;
  onPlanChange: (planId: string) => void;
};

export function PricingBuilder({ planId, onPlanChange }: Props) {
  const [meals, setMeals] = useState<number>(2);
  const [days, setDays] = useState<number>(20);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", whatsapp: "", address: "" });

  const plan = plans.find((p) => p.id === planId) ?? plans[0]!;
  const price = useMemo(() => getPrice(plan.id, meals, days), [plan.id, meals, days]);
  const perDay = days > 0 ? Math.round(price / days) : 0;

  const submit = async () => {
    const parsed = checkoutSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "تحقق من البيانات");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("subscriptions").insert({
      full_name: parsed.data.full_name,
      whatsapp: parsed.data.whatsapp,
      city: "الطائف",
      address: parsed.data.address,
      plan_id: plan.id,
      plan_name: plan.name,
      meals_per_day: meals,
      duration_days: days,
      total_price: price,
    });
    setSaving(false);

    if (error) {
      toast.error("تعذّر إرسال الطلب، حاول مرة أخرى");
      return;
    }
    toast.success("تم استلام طلبك! سنتواصل معك على الواتساب لتأكيد الاشتراك.");
    setOpen(false);
    setForm({ full_name: "", whatsapp: "", address: "" });
  };

  return (
    <section id="pricing" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-black sm:text-4xl">ابنِ اشتراكك واحسب سعرك</h2>
        <p className="mt-4 text-muted-foreground">
          اختر الباقة وعدد الوجبات ومدة الاشتراك، وسيتحدث السعر فوراً.
        </p>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-[2rem] border border-border bg-card p-6 shadow-soft sm:p-9">
          <Group title="نوع الباقة">
            <div className="grid gap-3 sm:grid-cols-2">
              {plans.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onPlanChange(p.id)}
                  className={`rounded-2xl border p-4 text-right transition-all ${
                    p.id === plan.id
                      ? "border-primary bg-primary/5 shadow-soft"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <span className="block font-display text-lg font-bold">{p.name}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    بروتين {arabicNumber(p.protein)} جرام · كارب {arabicNumber(p.carb)} جرام
                  </span>
                </button>
              ))}
            </div>
          </Group>

          <Group title="عدد الوجبات اليومية">
            <div className="grid grid-cols-3 gap-3">
              {mealCounts.map((m) => (
                <Chip key={m} active={m === meals} onClick={() => setMeals(m)}>
                  {arabicNumber(m)} {m === 1 ? "وجبة" : "وجبات"}
                </Chip>
              ))}
            </div>
          </Group>

          <Group title="مدة الاشتراك">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {durations.map((d) => (
                <Chip key={d} active={d === days} onClick={() => setDays(d)}>
                  {arabicNumber(d)} {d === 1 ? "يوم" : "أيام"}
                </Chip>
              ))}
            </div>
          </Group>
        </div>

        <aside className="h-fit rounded-[2rem] bg-primary p-7 text-primary-foreground shadow-lift sm:p-9 lg:sticky lg:top-28">
          <p className="text-sm text-primary-foreground/70">إجمالي اشتراكك</p>
          <p className="mt-2 font-display text-5xl font-black text-accent">
            {arabicNumber(price)}
            <span className="ms-2 font-sans text-lg font-medium text-primary-foreground/80">
              ريال
            </span>
          </p>

          <ul className="mt-7 space-y-3 text-sm">
            <Row label="الباقة" value={plan.name} />
            <Row label="الوجبات اليومية" value={`${arabicNumber(meals)}`} />
            <Row label="المدة" value={`${arabicNumber(days)} يوم`} />
            <Row label="التكلفة اليومية" value={`${arabicNumber(perDay)} ريال`} />
          </ul>

          <Button
            size="lg"
            variant="secondary"
            onClick={() => setOpen(true)}
            className="mt-8 w-full rounded-full font-display text-base font-bold"
          >
            <ShoppingBag className="size-5" />
            متابعة الطلب
          </Button>
          <p className="mt-3 text-center text-xs text-primary-foreground/60">
            التوصيل داخل مدينة الطائف
          </p>
        </aside>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="text-right sm:max-w-lg">
          <DialogHeader className="text-right">
            <DialogTitle className="font-display text-2xl font-black">إتمام الاشتراك</DialogTitle>
            <DialogDescription>
              {plan.name} · {arabicNumber(meals)} وجبات · {arabicNumber(days)} يوم ·{" "}
              {arabicNumber(price)} ريال
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">الاسم الكامل</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">رقم الواتساب</Label>
              <Input
                id="whatsapp"
                inputMode="tel"
                dir="ltr"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                maxLength={20}
                placeholder="05xxxxxxxx"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">مدينة التوصيل</Label>
              <Input id="city" value="الطائف" readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">العنوان التفصيلي</Label>
              <Textarea
                id="address"
                rows={3}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                maxLength={500}
                placeholder="الحي، الشارع، رقم المبنى، أقرب معلم"
              />
            </div>

            <Button
              onClick={submit}
              disabled={saving}
              size="lg"
              className="w-full rounded-full font-display text-base font-bold"
            >
              {saving ? <Loader2 className="size-5 animate-spin" /> : null}
              تأكيد الطلب
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8 text-right last:mb-0">
      <h3 className="mb-4 font-display text-lg font-bold">{title}</h3>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border px-4 py-3 font-display font-bold transition-all ${
        active
          ? "border-primary bg-primary text-primary-foreground shadow-soft"
          : "border-border hover:border-primary/40"
      }`}
    >
      {children}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between border-b border-primary-foreground/10 pb-2">
      <span className="text-primary-foreground/70">{label}</span>
      <span className="font-display font-bold">{value}</span>
    </li>
  );
}