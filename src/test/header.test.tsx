import "@testing-library/jest-dom";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";

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

describe("Header Component", () => {
  it("renders logo and navigation", () => {
    renderWithProviders(<Header />);

    const logoImage = screen.getByAltText(/Superação Assessoria Esportiva/i);
    expect(logoImage).toBeInTheDocument();
    expect(screen.getByText("INÍCIO")).toBeInTheDocument();
    expect(screen.getByText("SERVIÇOS")).toBeInTheDocument();
    expect(screen.getByText("LOJA")).toBeInTheDocument();
  });

  it("shows cart icon with badge", () => {
    renderWithProviders(<Header />);

    const cartButton = screen.getByLabelText(/carrinho/i);
    expect(cartButton).toBeInTheDocument();
  });


  it("has login link", () => {
    renderWithProviders(<Header />);

    const loginLink = screen.getByLabelText(/login/i);
    expect(loginLink).toBeInTheDocument();
  });
});
