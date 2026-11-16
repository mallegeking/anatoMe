import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { Card, Chip, Chips, KeyValue, PanelTitle, SectionHeading } from "./pieces";

afterEach(cleanup);

test("PanelTitle is a level 2 heading with an optional muted line", () => {
  render(<PanelTitle sub="Musculus piriformis">Piriformis</PanelTitle>);
  const h = screen.getByRole("heading", { level: 2, name: "Piriformis" });
  expect(h.classList.contains("panel-title")).toBe(true);
  expect(screen.getByText("Musculus piriformis").classList.contains("panel-sub")).toBe(true);
});

test("PanelTitle without a sub renders no sub line", () => {
  const { container } = render(<PanelTitle>Name</PanelTitle>);
  expect(container.querySelector(".panel-sub")).toBeNull();
});

test("Chip is a span with the chip class, and the warn tone adds chip--warn", () => {
  render(
    <Chips>
      <Chip>Muscle</Chip>
      <Chip tone="warn" icon={<svg data-testid="ic" />}>
        Hurts
      </Chip>
    </Chips>,
  );
  const plain = screen.getByText("Muscle");
  expect(plain.tagName).toBe("SPAN");
  expect(plain.classList.contains("chip")).toBe(true);
  expect(plain.classList.contains("chip--warn")).toBe(false);
  const warn = screen.getByText("Hurts");
  expect(warn.classList.contains("chip--warn")).toBe(true);
  expect(warn.contains(screen.getByTestId("ic"))).toBe(true);
  expect(plain.closest(".chips")).not.toBeNull();
});

test("SectionHeading is a level 3 heading, and a swatch is hidden from assistive tech", () => {
  const { container } = render(<SectionHeading swatch="#d1495b">Main movers</SectionHeading>);
  const h = screen.getByRole("heading", { level: 3, name: "Main movers" });
  expect(h.classList.contains("section-heading")).toBe(true);
  const swatch = container.querySelector(".swatch") as HTMLElement;
  expect(swatch.getAttribute("aria-hidden")).toBe("true");
  expect(swatch.style.background).toBe("rgb(209, 73, 91)");
});

test("SectionHeading without a swatch has none", () => {
  const { container } = render(<SectionHeading>Hip</SectionHeading>);
  expect(container.querySelector(".swatch")).toBeNull();
});

test("Card is a div by default, an li on request, and current adds card--current", () => {
  const { container } = render(
    <ul>
      <Card as="li" current>
        One
      </Card>
    </ul>,
  );
  const li = screen.getByText("One");
  expect(li.tagName).toBe("LI");
  expect(li.classList.contains("card")).toBe(true);
  expect(li.classList.contains("card--current")).toBe(true);
  cleanup();
  render(<Card>Two</Card>);
  expect(screen.getByText("Two").tagName).toBe("DIV");
  expect(screen.getByText("Two").classList.contains("card--current")).toBe(false);
  expect(container).toBeTruthy();
});

test("KeyValue renders a dl of dt and dd pairs", () => {
  const { container } = render(<KeyValue rows={[{ key: "Starts at", value: <b>sacrum</b> }, { key: "Ends at", value: "femur" }]} />);
  const dl = container.querySelector("dl") as HTMLElement;
  expect(dl.classList.contains("kv")).toBe(true);
  expect(screen.getByText("Starts at").tagName).toBe("DT");
  expect(screen.getByText("sacrum").parentElement!.tagName).toBe("DD");
  expect(screen.getByText("femur").tagName).toBe("DD");
});
