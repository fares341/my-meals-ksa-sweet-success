// Full catalog of delivery slots (used for labels everywhere).
export const timeSlots = [
  { id: "0700", label: "٧:٠٠ صباحاً" },
  { id: "0800", label: "٨:٠٠ صباحاً" },
  { id: "0930", label: "٩:٣٠ صباحاً" },
  { id: "1100", label: "١١:٠٠ صباحاً" },
  { id: "1800", label: "٦:٠٠ مساءً" },
  { id: "2000", label: "٨:٠٠ مساءً" },
  { id: "2100", label: "٩:٠٠ مساءً" },
] as const;

export type NeighborhoodInfo = {
  name: string;
  slots: string[];
};

// Taif neighborhood delivery schedule.
export const neighborhoodSchedule: NeighborhoodInfo[] = [
  // Group 1 — 9:30 AM only
  ...["القاعدة الجوية", "الحوية (وما حولها)", "السيل الصغير", "مدينة الورود", "مستشفى الحرس"].map(
    (name) => ({ name, slots: ["0930"] }),
  ),
  // Group 2 — 11:00 AM / 9:00 PM
  ...[
    "الفيصلية بالطائف",
    "القمرية",
    "البيعة",
    "جبرة",
    "الجال",
    "السحيلي",
    "النسيم",
    "الصناعية",
  ].map((name) => ({ name, slots: ["1100", "2100"] })),
  // Group 3 — 7:00 AM / 11:00 AM / 6:00 PM
  ...["الحلقة", "القيم", "الشرفية", "الصيانة"].map((name) => ({
    name,
    slots: ["0700", "1100", "1800"],
  })),
  // Group 4 — 8:00 AM / 8:00 PM
  ...[
    "الوسام",
    "المثناة",
    "قروى",
    "ام العراد",
    "ام السباع",
    "شهار",
    "الشهداء",
    "الريان",
    "نخب",
    "عودة",
    "البخارية",
    "الوشحاء",
    "النزهه",
    "السلامة",
    "العزيزية",
    "الشرقية",
    "السداد",
    "مستشفى الملك عبدالعزيز",
    "مستشفى الملك فيصل",
  ].map((name) => ({ name, slots: ["0800", "2000"] })),
  // Out of delivery zone
  ...["الهداء", "الشفاء", "طريق الجنوب", "العرفاء", "السيل الكبير"].map((name) => ({
    name,
    slots: [],
  })),
];

export const neighborhoods = neighborhoodSchedule.map((n) => n.name);

export function slotsForNeighborhood(name: string): string[] {
  return neighborhoodSchedule.find((n) => n.name === name)?.slots ?? [];
}

export function isOutOfZone(name: string) {
  return slotsForNeighborhood(name).length === 0;
}

export const mealTypeOptions = [
  { id: "breakfast", label: "فطور" },
  { id: "lunch", label: "غداء" },
  { id: "dinner", label: "عشاء" },
] as const;

export const weekDays = [
  { id: "sun", label: "الأحد" },
  { id: "mon", label: "الاثنين" },
  { id: "tue", label: "الثلاثاء" },
  { id: "wed", label: "الأربعاء" },
  { id: "thu", label: "الخميس" },
  { id: "fri", label: "الجمعة" },
  { id: "sat", label: "السبت" },
] as const;

// No delivery on Fridays.
export const unavailableDeliveryDays: string[] = ["fri"];

// Free gift depends on the number of daily meals; the salad can be opted out.
export function freeGiftLabel(mealsPerDay: number, wantsSalad: boolean) {
  const gifts: string[] = [];
  if (wantsSalad) gifts.push("سلطة هدية");
  if (mealsPerDay >= 3) gifts.push("سناك هدية");
  return gifts.join(" + ");
}

export const TABBY_FEE_RATE = 0.08;

export function tabbyTotal(amount: number) {
  return Math.round(amount * (1 + TABBY_FEE_RATE));
}

export const paymentMethods = [
  { id: "mada", label: "مدى", hint: "بطاقة مدى البنكية" },
  { id: "card", label: "بطاقة ائتمانية", hint: "Visa / Mastercard" },
  { id: "apple_pay", label: "Apple Pay", hint: "الدفع السريع من جهازك" },
  { id: "tabby", label: "تابي (تقسيط)", hint: "٤ أقساط · رسوم خدمة ٨٪" },
] as const;

export type OrderDraft = {
  plan_id: string;
  plan_name: string;
  meals_per_day: number;
  duration_days: number;
  total_price: number;
  meal_types: string[];
  delivery_days: string[];
  neighborhood: string;
  time_slot: string;
  start_date: string;
  end_date: string;
  full_name: string;
  whatsapp: string;
  address: string;
  free_gift?: string;
  notes?: string;
};

const KEY = "mymeals_order_draft";
const RECEIPT_KEY = "mymeals_order_receipt";

export type OrderReceipt = OrderDraft & {
  transaction_id: string;
  payment_method: string;
  paid_at: string;
};

export function saveReceipt(receipt: OrderReceipt) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(RECEIPT_KEY, JSON.stringify(receipt));
}

export function readReceipt(): OrderReceipt | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(RECEIPT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OrderReceipt;
  } catch {
    return null;
  }
}

export function saveDraft(draft: OrderDraft) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(draft));
}

export function readDraft(): OrderDraft | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OrderDraft;
  } catch {
    return null;
  }
}

export function clearDraft() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}

export function labelOf(list: readonly { id: string; label: string }[], id: string) {
  return list.find((i) => i.id === id)?.label ?? id;
}

export function makeTransactionId() {
  return `MM-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

export function addDays(date: string, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}