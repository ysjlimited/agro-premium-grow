import { type ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { WhatsAppFab } from "./WhatsAppFab";
import { ScrollToTop } from "./ScrollToTop";
import { Preloader } from "./Preloader";
import { useReveal } from "@/hooks/use-reveal";

export function SiteShell({ children }: { children: ReactNode }) {
  useReveal();
  return (
    <>
      <Preloader />
      <Header />
      <main className="pt-20">{children}</main>
      <Footer />
      <WhatsAppFab />
      <ScrollToTop />
    </>
  );
}
