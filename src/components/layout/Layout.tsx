import { forwardRef, ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CartModal } from "./CartModal";
import { CookieConsent } from "@/components/common/CookieConsent";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = forwardRef<HTMLDivElement, LayoutProps>(({ children }, ref) => {
  return (
    <div ref={ref} className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartModal />
      <CookieConsent />
    </div>
  );
});

Layout.displayName = "Layout";
