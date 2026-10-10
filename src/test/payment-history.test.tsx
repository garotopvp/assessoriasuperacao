import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PaymentHistory } from "@/components/payment/PaymentHistory";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock hooks
vi.mock("@/contexts/AuthContext", () => ({
  useAuthContext: () => ({
    user: { id: "test-user-id" },
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

describe("PaymentHistory Component", () => {
  it("renders without crashing", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <PaymentHistory />
      </QueryClientProvider>
    );

    expect(screen.getByText(/histórico de pagamentos/i)).toBeInTheDocument();
  });

  it("shows loading state initially", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <PaymentHistory />
      </QueryClientProvider>
    );

    // Check for heading (always visible)
    expect(screen.getByText(/histórico de pagamentos/i)).toBeInTheDocument();
    // Check for loading skeleton
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders payment history card", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <PaymentHistory />
      </QueryClientProvider>
    );

    // Should have the heading
    expect(screen.getByText(/histórico de pagamentos/i)).toBeInTheDocument();
  });
});
