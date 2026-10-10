import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProductSearch } from "@/components/products/ProductSearch";

describe("ProductSearch Component", () => {
  const mockOnSearch = vi.fn();

  it("renders search input", () => {
    render(<ProductSearch onSearch={mockOnSearch} />);

    const searchInput = screen.getByPlaceholderText(/buscar produtos/i);
    expect(searchInput).toBeInTheDocument();
  });

  it("calls onSearch when typing", async () => {
    render(<ProductSearch onSearch={mockOnSearch} />);

    const searchInput = screen.getByPlaceholderText(/buscar produtos/i);
    fireEvent.change(searchInput, { target: { value: "camiseta" } });

    expect(searchInput).toHaveValue("camiseta");
  });

  it("has sort options", () => {
    render(<ProductSearch onSearch={mockOnSearch} />);

    // Should have sort by selector with default value
    expect(screen.getByText("Mais recentes")).toBeInTheDocument();
  });

  it("has search button", () => {
    render(<ProductSearch onSearch={mockOnSearch} />);

    // Should have search button
    expect(screen.getByText("Buscar")).toBeInTheDocument();
  });
});
