export type PlanGroup = "A" | "B";

export type Plan = {
  id: string;
  name: string;
  latin: string;
  protein: number;
  carb: number;
  group: PlanGroup;
  description: string;
  highlights: string[];
};

export const plans: Plan[] = [
  {
    id: "lifestyle",
    name: "الأكل الصحي",
    latin: "Lifestyle",
    protein: 150,
    carb: 150,
    group: "A",
    description:
      "نمط غذائي متوازن يناسب الحياة اليومية، وجبات مشبعة بمكوّنات طازجة وسعرات محسوبة بدقة.",
    highlights: ["١٥٠ جرام بروتين", "١٥٠ جرام كارب", "مناسب للمحافظة على الوزن"],
  },
  {
    id: "lowcarb",
    name: "اللوكارب",
    latin: "Low-Carb",
    protein: 150,
    carb: 80,
    group: "A",
    description:
      "كاربوهيدرات أقل وبروتين عالي، الخيار الأمثل لخسارة الوزن مع الحفاظ على الطاقة خلال اليوم.",
    highlights: ["١٥٠ جرام بروتين", "٨٠ جرام كارب", "الأفضل لخسارة الوزن"],
  },
  {
    id: "bulking",
    name: "التضخيم",
    latin: "Bulking",
    protein: 200,
    carb: 200,
    group: "B",
    description:
      "سعرات وبروتين أعلى لدعم بناء العضلات وزيادة الكتلة، مع كارب كافٍ لتغذية تمارينك.",
    highlights: ["٢٠٠ جرام بروتين", "٢٠٠ جرام كارب", "لبناء الكتلة العضلية"],
  },
  {
    id: "cutting",
    name: "التنشيف",
    latin: "Cutting",
    protein: 200,
    carb: 150,
    group: "B",
    description:
      "بروتين مرتفع مع كارب متوازن للحفاظ على العضلات أثناء تقليل نسبة الدهون.",
    highlights: ["٢٠٠ جرام بروتين", "١٥٠ جرام كارب", "حفاظ على العضل مع تنشيف"],
  },
  {
    id: "keto",
    name: "بروتين بدون كارب",
    latin: "Keto",
    protein: 200,
    carb: 0,
    group: "B",
    description:
      "بروتين خالص وخضار طازج بدون أي كاربوهيدرات، لحرق الدهون بأقصى سرعة.",
    highlights: ["٢٠٠ جرام بروتين", "بدون كارب", "حرق دهون مكثّف"],
  },
];

export const durations = [1, 5, 20, 24] as const;
export const mealCounts = [1, 2, 3] as const;

type Matrix = Record<number, Record<number, number>>;

const groupA: Matrix = {
  1: { 1: 30, 5: 160, 20: 495, 24: 535 },
  2: { 1: 50, 5: 260, 20: 865, 24: 965 },
  3: { 1: 70, 5: 320, 20: 999, 24: 1149 },
};

const groupB: Matrix = {
  1: { 1: 35, 5: 180, 20: 530, 24: 580 },
  2: { 1: 55, 5: 280, 20: 969, 24: 1069 },
  3: { 1: 80, 5: 360, 20: 1155, 24: 1310 },
};

export function getPrice(planId: string, meals: number, days: number): number {
  const plan = plans.find((p) => p.id === planId);
  const matrix = plan?.group === "B" ? groupB : groupA;
  return matrix[meals]?.[days] ?? 0;
}

export const arabicNumber = (value: number | string) =>
  String(value).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]!);