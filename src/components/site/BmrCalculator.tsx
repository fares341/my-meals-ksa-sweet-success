import { useState } from "react";
import { Activity, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { arabicNumber, plans } from "@/lib/meals";

type Goal = "loss" | "maintain" | "muscle" | "extreme";

const goals: { value: Goal; label: string; factor: number; planId: string }[] = [
  { value: "loss", label: "خسارة الوزن", factor: -0.2, planId: "lowcarb" },
  { value: "maintain", label: "المحافظة على الوزن", factor: 0, planId: "lifestyle" },
  { value: "muscle", label: "بناء العضلات", factor: 0.15, planId: "bulking" },
  { value: "extreme", label: "حرق دهون مكثّف", factor: -0.35, planId: "keto" },
];

type Result = {
  bmr: number;
  tdee: number;
  target: number;
  protein: number;
  carb: number;
  fat: number;
  planName: string;
  planId: string;
};

export function BmrCalculator({ onSuggest }: { onSuggest: (planId: string) => void }) {
  const [gender, setGender] = useState("male");
  const [age, setAge] = useState("28");
  const [height, setHeight] = useState("175");
  const [weight, setWeight] = useState("80");
  const [goal, setGoal] = useState<Goal>("loss");
  const [result, setResult] = useState<Result | null>(null);

  const calculate = () => {
    const a = Number(age);
    const h = Number(height);
    const w = Number(weight);
    if (!a || !h || !w) return;

    const bmr =
      gender === "male"
        ? 10 * w + 6.25 * h - 5 * a + 5
        : 10 * w + 6.25 * h - 5 * a - 161;
    const tdee = bmr * 1.45;
    const selected = goals.find((g) => g.value === goal)!;
    const target = tdee * (1 + selected.factor);
    const protein = (target * 0.35) / 4;
    const carb = (target * 0.4) / 4;
    const fat = (target * 0.25) / 9;
    const plan = plans.find((p) => p.id === selected.planId)!;

    setResult({
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      target: Math.round(target),
      protein: Math.round(protein),
      carb: Math.round(carb),
      fat: Math.round(fat),
      planName: plan.name,
      planId: plan.id,
    });
    onSuggest(plan.id);
  };

  return (
    <section id="calculator" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="overflow-hidden rounded-[2rem] border border-primary/15 bg-card/70 p-6 shadow-lift backdrop-blur-xl sm:p-10">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="text-right">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-4 py-1.5 text-sm font-semibold text-accent-foreground">
              <Sparkles className="size-4" />
              حاسبة السعرات الذكية
            </span>
            <h2 className="mt-5 font-display text-3xl font-black sm:text-4xl">
              اعرف احتياجك اليومي بدقة
            </h2>
            <p className="mt-3 text-muted-foreground">
              أدخل بياناتك وسنحسب معدل الحرق الأساسي واحتياجك اليومي من السعرات، ثم نرشّح لك
              الباقة الأنسب لهدفك.
            </p>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>الجنس</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">ذكر</SelectItem>
                    <SelectItem value="female">أنثى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">العمر</Label>
                <Input
                  id="age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  min={10}
                  max={90}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">الطول (سم)</Label>
                <Input
                  id="height"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">الوزن (كجم)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>الهدف الأساسي</Label>
                <Select value={goal} onValueChange={(v) => setGoal(v as Goal)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {goals.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              size="lg"
              onClick={calculate}
              className="mt-6 w-full rounded-full font-display text-base font-bold shadow-soft sm:w-auto sm:px-10"
            >
              <Activity className="size-5" />
              احسب الآن
            </Button>
          </div>

          <div className="rounded-3xl bg-primary p-7 text-primary-foreground sm:p-9">
            {result ? (
              <div className="text-right">
                <p className="text-sm text-primary-foreground/70">سعراتك اليومية المستهدفة</p>
                <p className="mt-1 font-display text-5xl font-black text-accent">
                  {arabicNumber(result.target)}
                </p>
                <p className="text-sm text-primary-foreground/70">كالوري / يوم</p>

                <div className="mt-7 grid grid-cols-2 gap-4">
                  <Stat label="معدل الحرق الأساسي" value={`${arabicNumber(result.bmr)} كالوري`} />
                  <Stat label="الحرق اليومي الكلي" value={`${arabicNumber(result.tdee)} كالوري`} />
                  <Stat label="بروتين" value={`${arabicNumber(result.protein)} جرام`} />
                  <Stat label="كارب" value={`${arabicNumber(result.carb)} جرام`} />
                  <Stat label="دهون" value={`${arabicNumber(result.fat)} جرام`} />
                </div>

                <div className="mt-7 rounded-2xl bg-primary-foreground/10 p-5">
                  <p className="text-sm text-primary-foreground/70">الباقة المقترحة لك</p>
                  <p className="mt-1 font-display text-2xl font-black">{result.planName}</p>
                  <Button
                    variant="secondary"
                    className="mt-4 w-full rounded-full font-display font-bold"
                    onClick={() =>
                      document
                        .querySelector("#pricing")
                        ?.scrollIntoView({ behavior: "smooth", block: "start" })
                    }
                  >
                    اشترك في هذه الباقة
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-72 flex-col items-center justify-center text-center">
                <Activity className="size-12 text-accent" />
                <p className="mt-4 font-display text-xl font-bold">نتيجتك ستظهر هنا</p>
                <p className="mt-2 max-w-xs text-sm text-primary-foreground/70">
                  أكمل بياناتك واضغط «احسب الآن» لتظهر سعراتك وماكروزك والباقة الأنسب لك.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-primary-foreground/8 p-4">
      <p className="text-xs text-primary-foreground/70">{label}</p>
      <p className="mt-1 font-display text-lg font-bold">{value}</p>
    </div>
  );
}