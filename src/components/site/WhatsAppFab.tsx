import { MessageCircle } from "lucide-react";

export function WhatsAppFab() {
  return (
    <a
      href="https://wa.me/message/6R7UXKZY5YVQA1"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="تواصل معنا على الواتساب"
      className="fixed bottom-6 left-6 z-50 inline-flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lift transition-transform hover:scale-110"
    >
      <MessageCircle className="size-7" />
    </a>
  );
}