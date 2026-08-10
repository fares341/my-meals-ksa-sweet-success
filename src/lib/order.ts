export const neighborhoods = [
  "الشهداء الشمالية",
  "الشهداء الجنوبية",
  "الفيصلية",
  "القمرية",
  "الحوية",
  "الوشحاء",
  "معشي",
  "السلامة",
  "النزهة",
  "الربيع",
  "شهار",
  "السداد",
] as const;

export const timeSlots = [
  { id: "morning", label: "صباحاً (٧ - ١٠)" },
  { id: "noon", label: "ظهراً (١٢ - ٣)" },
  { id: "evening", label: "مساءً (٥ - ٩)" },
] as const;

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

export const paymentMethods = [
  { id: "mada", label: "مدى", hint: "بطاقة مدى البنكية" },
  { id: "card", label: "بطاقة ائتمانية", hint: "Visa / Mastercard" },
  { id: "apple_pay", label: "Apple Pay", hint: "الدفع السريع من جهازك" },
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
  notes?: string;
};

const KEY = "mymeals_order_draft";

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