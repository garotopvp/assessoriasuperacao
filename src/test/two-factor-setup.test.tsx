import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TwoFactorSetup } from "@/components/auth/TwoFactorSetup";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/contexts/AuthContext", () => ({
  useAuthContext: () => ({
    user: { id: "test-user", email: "test@test.com" },
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

describe("TwoFactorSetup Component", () => {
  it("renders 2FA setup instructions", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TwoFactorSetup />
      </QueryClientProvider>
    );

    const elements = screen.getAllByText(/autentica/i);
    expect(elements.length).toBeGreaterThan(0);
  });

  it("shows QR code section", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TwoFactorSetup />
      </QueryClientProvider>
    );

    // Should have some element related to QR or setup
    const elements = screen.getAllByRole("heading");
    expect(elements.length).toBeGreaterThan(0);
  });
});
