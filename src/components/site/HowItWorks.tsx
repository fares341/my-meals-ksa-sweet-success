const steps = [
  { n: "١", title: "اختر الباقة", text: "حدد النظام الغذائي المناسب لهدفك من بين خمس باقات." },
  { n: "٢", title: "حدد وجباتك", text: "اختر عدد الوجبات اليومية ومدة الاشتراك التي تناسبك." },
  { n: "٣", title: "استمتع بوجبتك", text: "نحضّرها طازجة كل صباح ونوصلها إليك في الوقت المحدد." },
];

export function HowItWorks() {
  return (
    <section className="bg-forest-dark py-20 text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-black sm:text-4xl">كيف يعمل الاشتراك؟</h2>
          <p className="mt-4 text-primary-foreground/70">ثلاث خطوات فقط تفصلك عن وجباتك اليومية.</p>
        </div>

        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.title} className="text-right">
              <span className="font-display text-6xl font-black text-accent">{s.n}</span>
              <h3 className="mt-4 font-display text-2xl font-bold">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-primary-foreground/70">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}