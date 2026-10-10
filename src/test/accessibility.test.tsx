import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";

expect.extend(toHaveNoViolations);

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <CartProvider>
          <AuthProvider>{ui}</AuthProvider>
        </CartProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe("Accessibility Tests", () => {
  it("Header should not have accessibility violations", async () => {
    const { container } = renderWithProviders(<Header />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("Footer should not have accessibility violations", async () => {
    const { container } = render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("Button component should not have accessibility violations", async () => {
    const { container } = render(<Button>Test Button</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
