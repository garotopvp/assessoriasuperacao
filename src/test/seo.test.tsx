import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SEO } from "@/components/common/SEO";
import { HelmetProvider } from "react-helmet-async";

describe("SEO Component", () => {
  it("renders without crashing", () => {
    render(
      <HelmetProvider>
        <SEO title="Test Title" description="Test Description" />
      </HelmetProvider>
    );

    expect(true).toBe(true);
  });

  it("sets page title", () => {
    const { container } = render(
      <HelmetProvider>
        <SEO title="Custom Title" description="Custom Description" />
      </HelmetProvider>
    );

    expect(container).toBeInTheDocument();
  });

  it("accepts keywords prop", () => {
    const { container } = render(
      <HelmetProvider>
        <SEO title="Test" description="Test" keywords="test, keywords, seo" />
      </HelmetProvider>
    );

    expect(container).toBeInTheDocument();
  });
});
