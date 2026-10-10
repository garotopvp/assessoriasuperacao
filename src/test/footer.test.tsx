import "@testing-library/jest-dom";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";

describe("Footer Component", () => {
  it("renders copyright text", () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );

    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument();
  });

  it("has social media links", () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );

    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
  });

  it("renders company info section", () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );

    const elements = screen.getAllByText(/Superação/i);
    expect(elements.length).toBeGreaterThan(0);
  });
});
