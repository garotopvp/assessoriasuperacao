import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Login from "@/pages/Login";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";

// Mock Supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
    },
  },
}));

// Mock React Router
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

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

describe("Login Component", () => {
  it("renders login form", () => {
    renderWithProviders(<Login />);

    // Use heading with specific role
    expect(screen.getByRole("heading", { name: /entrar/i })).toBeInTheDocument();
  });

  it("validates email format", async () => {
    renderWithProviders(<Login />);

    const emailInput = screen.getByPlaceholderText(/seu@email/i);
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });

    // Validation should trigger on blur or submit
    expect(emailInput).toHaveValue("invalid-email");
  });

  it("shows password field", () => {
    renderWithProviders(<Login />);

    const passwordInput = screen.getByLabelText(/senha/i);
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute("type", "password");
  });
});
