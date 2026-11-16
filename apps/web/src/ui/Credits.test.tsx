import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import en from "../i18n/en.json";
import { createT } from "../i18n/t";
import { CORRECTION_URL, REPO_URL } from "../config";
import { CreditsBody, EducationalLine } from "./Credits";
import { LanguagePicker } from "./LanguagePicker";

afterEach(cleanup);

test("credits show the licence deeds, the changes and the library licences", () => {
  render(<CreditsBody t={createT(en)} />);
  // The verbatim credit lines stay in the text.
  expect(screen.getByText(en["credits.bodyparts3d"], { exact: false })).toBeTruthy();
  expect(screen.getByText(en["credits.zanatomy"], { exact: false })).toBeTruthy();
  expect(screen.getByText(en["credits.licenceCcBy"]).getAttribute("href")).toBe("https://creativecommons.org/licenses/by/4.0/");
  expect(screen.getByText(en["credits.licenceCcBySa"]).getAttribute("href")).toBe("https://creativecommons.org/licenses/by-sa/4.0/");
  expect(screen.getByText(en["credits.modified"])).toBeTruthy();
  expect(screen.getByText(en["credits.librariesLink"]).getAttribute("href")).toMatch(/third-party-licenses\.txt$/);
});

test("the educational line does not sit inside a details element", () => {
  render(
    <>
      <EducationalLine t={createT(en)} />
      <CreditsBody t={createT(en)} />
    </>,
  );
  const line = screen.getByText(en["about.educational"]);
  expect(line.closest("details")).toBeNull();
});

test("the brackets around a licence link come from en.json", () => {
  render(<CreditsBody t={createT({ ...en, "credits.withLicence": "{credit} [{licence}]" })} />);
  expect(screen.getAllByText(/\[/).length).toBe(2);
  expect(screen.queryByText(/\(/)).toBeNull();
});

test("the credits show the version and the two links", () => {
  render(<CreditsBody t={createT(en)} />);
  expect(screen.getByText(/^Version \d+\.\d+\.\d+$/)).toBeTruthy();
  expect(screen.getByRole("link", { name: "Source code" }).getAttribute("href")).toBe(REPO_URL);
  const report = screen.getByRole("link", { name: "Report a mistake in the data" });
  expect(report.getAttribute("href")).toBe(CORRECTION_URL);
  expect(report.getAttribute("rel")).toBe("noopener noreferrer");
});

test("the language picker reports the choice and shows its label only when asked", () => {
  const onLang = vi.fn();
  const { rerender } = render(<LanguagePicker t={createT(en)} lang="en" onLang={onLang} showLabel />);
  expect(screen.getByText(en["lang.label"]).tagName).toBe("SPAN");
  const select = screen.getByLabelText(en["lang.label"]);
  fireEvent.change(select, { target: { value: "de" } });
  expect(onLang).toHaveBeenCalledWith("de");
  rerender(<LanguagePicker t={createT(en)} lang="en" onLang={onLang} showLabel={false} />);
  expect(screen.getByRole("combobox", { name: en["lang.label"] }).getAttribute("aria-label")).toBe(en["lang.label"]);
  expect(screen.queryByText(en["lang.label"])).toBeNull();
});

test("a template with the licence before the credit still fills in the credit", () => {
  const { container } = render(<CreditsBody t={createT({ ...en, "credits.withLicence": "{licence}: {credit}" })} />);
  expect(container.textContent).toContain(`${en["credits.licenceCcBy"]}: ${en["credits.bodyparts3d"]}`);
  expect(container.textContent).not.toContain("{credit}");
});
