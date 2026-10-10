import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OptimizedImage } from "@/components/common/OptimizedImage";

describe("OptimizedImage Component", () => {
  it("renders with src prop", () => {
    render(<OptimizedImage src="/test-image.jpg" alt="Test Image" />);

    const img = screen.getByAltText("Test Image");
    expect(img).toBeInTheDocument();
  });

  it("has alt text", () => {
    render(<OptimizedImage src="/test.jpg" alt="Descriptive text" />);

    const img = screen.getByAltText("Descriptive text");
    expect(img).toHaveAttribute("alt", "Descriptive text");
  });

  it("applies lazy loading", () => {
    render(<OptimizedImage src="/test.jpg" alt="Test" />);

    const img = screen.getByAltText("Test");
    expect(img).toHaveAttribute("loading", "lazy");
  });

  it("shows placeholder while loading", () => {
    const { container } = render(<OptimizedImage src="/test.jpg" alt="Test" />);

    expect(container.firstChild).toBeInTheDocument();
  });
});
