import { Mail, MapPin, MessageCircle } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 text-center sm:px-6 lg:grid-cols-3 lg:text-right">
        <div className="flex flex-col items-center lg:items-start">
          <img
            src="/assets/logo.png"
            alt="وجباتي My Meals KSA"
            className="h-14 w-auto"
            loading="lazy"
          />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            وجباتي — اشتراكات وجبات صحية تُحضَّر يومياً بسعرات محسوبة، وتوصيل يومي داخل مدينة
            الطائف.
          </p>
        </div>

        <div>
          <h3 className="font-display text-lg font-bold">تواصل معنا</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-center justify-center gap-2 lg:justify-start">
              <Mail className="size-4 shrink-0 text-primary" />
              <a href="mailto:mymealsksa@gmail.com" className="hover:text-primary" dir="ltr">
                mymealsksa@gmail.com
              </a>
            </li>
            <li className="flex items-center justify-center gap-2 lg:justify-start">
              <MessageCircle className="size-4 shrink-0 text-primary" />
              <a
                href="https://wa.me/message/6R7UXKZY5YVQA1"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary"
              >
                واتساب خدمة العملاء
              </a>
            </li>
            <li className="flex items-center justify-center gap-2 lg:justify-start">
              <MapPin className="size-4 shrink-0 text-primary" />
              الطائف، المملكة العربية السعودية
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-lg font-bold">السجل التجاري</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            منشأة مسجّلة رسمياً في وزارة التجارة.
          </p>
          <div className="mt-4 inline-block overflow-hidden rounded-2xl border border-border bg-card p-3 shadow-soft">
            <img
              src="/assets/commercial-registration.png"
              alt="السجل التجاري - وزارة التجارة"
              className="h-40 w-auto object-contain"
              loading="lazy"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-border py-5 text-center text-sm text-muted-foreground">
        جميع الحقوق محفوظة © وجباتي My Meals KSA
      </div>
    </footer>
  );
}