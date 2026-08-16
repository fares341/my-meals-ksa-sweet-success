import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2, CreditCard, Loader2, X } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { arabicNumber, durations, getPrice, mealCounts, plans } from "@/lib/meals";
import { validateCoupon, discountFor, type CouponResult } from "@/lib/coupons";
import {
  addDays,
  allowedWeeklyDays,
  computeEndDate,
  freeGiftLabel,
  isFriday,
  mealTypeOptions,
  isOutOfZone,
  neighborhoods,
  nextDeliveryDate,
  saveDraft,
  slotsForNeighborhood,
  timeSlots,
  unavailableDeliveryDays,
  weekDays,
  weeklyDaysHint,
} from "@/lib/order";

const detailsSchema = z.object({
  full_name: z.string().trim().min(3, "الاسم قصير جداً").max(100, "الاسم طويل جداً"),
  whatsapp: z
    .string()
    .trim()
    .min(9, "رقم الواتساب غير صحيح")
    .max(20, "رقم الواتساب غير صحيح")
    .regex(/^[0-9+\s-]+$/, "رقم الواتساب غير صحيح"),
  address: z.string().trim().max(500, "العنوان طويل جداً").optional(),
});

type Props = {
  planId: string;
  onPlanChange: (planId: string) => void;
};

const today = () => new Date().toISOString().slice(0, 10);
// No same-day booking: the earliest allowed start is tomorrow.
const tomorrow = () => addDays(today(), 1);

export function PricingBuilder({ planId, onPlanChange }: Props) {
  const navigate = useNavigate();
  const [meals, setMeals] = useState<number>(2);
  const [days, setDays] = useState<number>(20);
  const [mealTypes, setMealTypes] = useState<string[]>(["lunch", "dinner"]);
  const [deliveryDays, setDeliveryDays] = useState<string[]>([
    "sun",
    "mon",
    "tue",
    "wed",
    "thu",
  ]);
  const [neighborhood, setNeighborhood] = useState<string>(neighborhoods[0] ?? "");
  const [timeSlot, setTimeSlot] = useState<string>(slotsForNeighborhood(neighborhoods[0] ?? "")[0] ?? "");
  const [startDate, setStartDate] = useState<string>(tomorrow());
  const [wantsSalad, setWantsSalad] = useState(true);
  const [form, setForm] = useState({ full_name: "", whatsapp: "", address: "" });
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<CouponResult | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const plan = plans.find((p) => p.id === planId) ?? plans[0]!;
  const price = useMemo(() => getPrice(plan.id, meals, days), [plan.id, meals, days]);
  const discount = coupon ? discountFor(coupon.discount_type, coupon.discount_value, price) : 0;
  const total = Math.max(price - discount, 0);
  const perDay = days > 0 ? Math.round(total / days) : 0;
  const endDate = useMemo(
    () => computeEndDate(startDate, days, deliveryDays),
    [startDate, days, deliveryDays],
  );
  const gift = freeGiftLabel(meals, wantsSalad);
  const allowedDays = allowedWeeklyDays(days);
  const maxDays = Math.max(...allowedDays);
  const daysRuleOk = allowedDays.includes(deliveryDays.length);
  const availableSlots = useMemo(
    () => timeSlots.filter((t) => slotsForNeighborhood(neighborhood).includes(t.id)),
    [neighborhood],
  );
  const outOfZone = isOutOfZone(neighborhood);

  useEffect(() => {
    setTimeSlot((prev) =>
      availableSlots.some((t) => t.id === prev) ? prev : (availableSlots[0]?.id ?? ""),
    );
  }, [availableSlots]);

  useEffect(() => {
    setMealTypes((prev) => (prev.length === meals ? prev : mealTypeOptions.slice(0, meals).map((m) => m.id)));
  }, [meals]);

  // Keep the selected delivery days within the rules of the chosen duration.
  useEffect(() => {
    setDeliveryDays((prev) => (prev.length > maxDays ? prev.slice(0, maxDays) : prev));
  }, [maxDays]);

  // Fridays and unselected weekdays can't be a start date.
  useEffect(() => {
    setStartDate((prev) => {
      const next = nextDeliveryDate(prev, deliveryDays);
      return next && next !== prev ? next : prev;
    });
  }, [deliveryDays]);

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const toggleDeliveryDay = (id: string) => {
    if (deliveryDays.includes(id)) {
      setDeliveryDays(deliveryDays.filter((d) => d !== id));
      return;
    }
    if (deliveryDays.length >= maxDays) {
      toast.error(weeklyDaysHint(days));
      return;
    }
    setDeliveryDays([...deliveryDays, id]);
  };

  const applyCoupon = async () => {
    setCheckingCoupon(true);
    setCouponError(null);
    const res = await validateCoupon(couponInput, price);
    setCheckingCoupon(false);
    if (!res.ok) {
      setCoupon(null);
      setCouponError(res.error);
      return;
    }
    setCoupon(res.coupon);
    setCouponInput(res.coupon.code);
    toast.success("تم تطبيق كود الخصم بنجاح!");
  };

  const clearCoupon = () => {
    setCoupon(null);
    setCouponInput("");
    setCouponError(null);
  };

  const proceed = () => {
    if (mealTypes.length !== meals) {
      toast.error(`اختر ${arabicNumber(meals)} نوع وجبة بحسب عدد الوجبات اليومية`);
      return;
    }
    if (outOfZone) {
      toast.error("نعتذر، هذا الحي خارج نطاق التوصيل حالياً");
      return;
    }
    if (!timeSlot) {
      toast.error("اختر موعد التوصيل");
      return;
    }
    if (!daysRuleOk) {
      toast.error(weeklyDaysHint(days));
      return;
    }
    if (startDate < tomorrow()) {
      toast.error("تاريخ البداية يجب أن يكون من الغد على الأقل (لا يوجد حجز في نفس اليوم)");
      return;
    }
    if (isFriday(startDate)) {
      toast.error("لا يوجد توصيل يوم الجمعة، اختر تاريخ بداية آخر");
      return;
    }
    const parsed = detailsSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "تحقق من البيانات");
      return;
    }

    saveDraft({
      plan_id: plan.id,
      plan_name: plan.name,
      meals_per_day: meals,
      duration_days: days,
      total_price: total,
      subtotal_price: price,
      coupon_code: coupon?.code ?? "",
      discount_amount: discount,
      meal_types: mealTypes,
      delivery_days: deliveryDays,
      neighborhood,
      time_slot: timeSlot,
      start_date: startDate,
      end_date: endDate,
      full_name: parsed.data.full_name,
      whatsapp: parsed.data.whatsapp,
      address: parsed.data.address ?? "",
      free_gift: gift,
    });
    navigate({ to: "/checkout" });
  };

  return (
    <section id="pricing" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-black sm:text-4xl">ابنِ اشتراكك واحسب سعرك</h2>
        <p className="mt-4 text-muted-foreground">
          اختر الباقة والوجبات وأيام التوصيل والحي والموعد، ثم أدخل بياناتك وانتقل للدفع.
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

          <Group title={`أنواع الوجبات (اختر ${arabicNumber(meals)})`}>
            <div className="grid grid-cols-3 gap-3">
              {mealTypeOptions.map((m) => (
                <Chip
                  key={m.id}
                  active={mealTypes.includes(m.id)}
                  onClick={() => setMealTypes(toggle(mealTypes, m.id))}
                >
                  {m.label}
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

          <Group title="أيام التوصيل">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {weekDays.map((d) => (
                <Chip
                  key={d.id}
                  active={deliveryDays.includes(d.id)}
                  disabled={unavailableDeliveryDays.includes(d.id)}
                  onClick={() => setDeliveryDays(toggle(deliveryDays, d.id))}
                >
                  {d.label}
                </Chip>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">لا يوجد توصيل يوم الجمعة.</p>
          </Group>

          <Group title="الهدايا المجانية">
            <div className="rounded-2xl border border-border bg-secondary/40 p-4">
              <p className="font-display font-bold text-primary">
                {meals >= 3 ? "اشتراكك يشمل: سلطة + سناك هدية 🎁" : "اشتراكك يشمل: سلطة هدية 🎁"}
              </p>
              <label className="mt-3 flex cursor-pointer items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--color-primary)]"
                  checked={!wantsSalad}
                  onChange={(e) => setWantsSalad(!e.target.checked)}
                />
                لا أريد السلطة المجانية
              </label>
            </div>
          </Group>

          <Group title="حي التوصيل في الطائف">
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="h-12 rounded-2xl border border-border bg-background px-4 font-display font-bold"
                aria-label="حي التوصيل"
              >
                {neighborhoods.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                disabled={outOfZone}
                className="h-12 rounded-2xl border border-border bg-background px-4 font-display font-bold disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                aria-label="موعد التوصيل"
              >
                {outOfZone ? (
                  <option value="">خارج التغطية</option>
                ) : (
                  availableSlots.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))
                )}
              </select>
            </div>
            {outOfZone ? (
              <p className="mt-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm font-bold text-destructive">
                نعتذر، هذا الحي خارج نطاق التوصيل حالياً
              </p>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                مواعيد التوصيل المتاحة لحي {neighborhood}:{" "}
                {availableSlots.map((t) => t.label).join(" · ")}
              </p>
            )}
          </Group>

          <Group title="تاريخ البداية والنهاية">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start_date">تاريخ البداية</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={startDate}
                  min={tomorrow()}
                  onChange={(e) => {
                    const picked = e.target.value || tomorrow();
                    // Guard against same-day / past dates even if typed manually.
                    setStartDate(picked < tomorrow() ? tomorrow() : picked);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">تاريخ النهاية</Label>
                <Input id="end_date" value={endDate} readOnly className="bg-muted" />
              </div>
            </div>
          </Group>

          <Group title="بياناتك الشخصية">
            <div className="grid gap-4 sm:grid-cols-2">
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
                <Label htmlFor="whatsapp">رقم الجوال / الواتساب</Label>
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
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">العنوان التفصيلي</Label>
                <span className="ms-2 text-xs text-muted-foreground">(اختياري)</span>
                <Textarea
                  id="address"
                  rows={3}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  maxLength={500}
                  placeholder="الحي، الشارع، رقم المبنى، أقرب معلم"
                />
              </div>
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
            <Row label="الحي" value={neighborhood} />
            <Row label="أيام التوصيل" value={`${arabicNumber(deliveryDays.length)} أيام`} />
            <Row label="الهدية المجانية" value={gift || "بدون هدية"} />
            <Row label="التكلفة اليومية" value={`${arabicNumber(perDay)} ريال`} />
          </ul>

          <Button
            size="lg"
            variant="secondary"
            onClick={proceed}
            className="mt-8 w-full rounded-full font-display text-base font-bold"
          >
            <CreditCard className="size-5" />
            المتابعة إلى الدفع
          </Button>
          <p className="mt-3 text-center text-xs text-primary-foreground/60">
            التوصيل داخل مدينة الطائف
          </p>
        </aside>
      </div>
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
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      className={`rounded-2xl border px-4 py-3 font-display font-bold transition-all ${
        disabled
          ? "cursor-not-allowed border-border bg-muted text-muted-foreground opacity-60"
          : ""
      } ${
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
