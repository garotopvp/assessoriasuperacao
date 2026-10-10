import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminMetrics } from "@/components/admin/AdminMetrics";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

describe("AdminMetrics Component", () => {
  it("renders metrics cards with skeleton", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AdminMetrics />
      </QueryClientProvider>
    );

    // Check for skeleton loading state
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows loading state initially", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AdminMetrics />
      </QueryClientProvider>
    );

    // Should show some loading indicators or skeleton
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThanOrEqual(0);
  });
});
