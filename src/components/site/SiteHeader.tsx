import { Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const links = [
  { href: "#home", label: "الرئيسية" },
  { href: "#features", label: "المميزات" },
  { href: "#plans", label: "الباقات" },
  { href: "#pricing", label: "الأسعار" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  const scrollTo = (href: string) => {
    setOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="#home" className="flex shrink-0 items-center gap-3">
          <img
            src="https://incredible-croissant-8e5f83.netlify.app/assets/logo.png"
            alt="وجباتي My Meals KSA"
            className="h-12 w-auto"
          />
        </a>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollTo(link.href)}
              className="text-base font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => scrollTo("#pricing")}
            className="rounded-full px-6 font-display font-bold shadow-soft"
          >
            اشترك الآن
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="القائمة"
            onClick={() => setOpen((v) => !v)}
          >
            <Menu />
          </Button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border bg-background px-6 py-4 lg:hidden">
          <ul className="flex flex-col gap-3">
            {links.map((link) => (
              <li key={link.href}>
                <button
                  onClick={() => scrollTo(link.href)}
                  className="w-full text-right text-base font-medium text-muted-foreground"
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}