import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import en from "../i18n/en.json";
import { createT } from "../i18n/t";
import { CORRECTION_URL, REPO_URL } from "../config";
import { Credits, EducationalLine } from "./Credits";

afterEach(cleanup);

test("credits show the licence deeds, the changes and the library licences", () => {
  render(<Credits t={createT(en)} lang="en" onLang={() => {}} />);
  // The verbatim credit lines stay in the text.
  expect(screen.getByText(en["credits.bodyparts3d"], { exact: false })).toBeTruthy();
  expect(screen.getByText(en["credits.zanatomy"], { exact: false })).toBeTruthy();
  expect(screen.getByText(en["credits.licenceCcBy"]).getAttribute("href")).toBe("https://creativecommons.org/licenses/by/4.0/");
  expect(screen.getByText(en["credits.licenceCcBySa"]).getAttribute("href")).toBe("https://creativecommons.org/licenses/by-sa/4.0/");
  expect(screen.getByText(en["credits.modified"])).toBeTruthy();
  expect(screen.getByText(en["credits.librariesLink"]).getAttribute("href")).toMatch(/third-party-licenses\.txt$/);
});

test("educational line is visible without opening credits", () => {
  render(
    <>
      <EducationalLine t={createT(en)} />
      <Credits t={createT(en)} lang="en" onLang={() => {}} />
    </>,
  );
  const line = screen.getByText(en["about.educational"]);
  // Text inside a closed <details> is hidden until someone opens it, so the line must sit outside.
  expect(line.closest("details")).toBeNull();
});

test("the brackets around a licence link come from en.json", () => {
  render(<Credits t={createT({ ...en, "credits.withLicence": "{credit} [{licence}]" })} lang="en" onLang={() => {}} />);
  // The credit lines live inside the closed details, but they are still in the document.
  expect(screen.getAllByText(/\[/).length).toBe(2);
  expect(screen.queryByText(/\(/)).toBeNull();
});

test("the credits show the version and the two links", () => {
  render(<Credits t={createT(en)} lang="en" onLang={() => {}} />);
  expect(screen.getByText(/^Version \d+\.\d+\.\d+$/)).toBeTruthy();
  expect(screen.getByRole("link", { name: "Source code" }).getAttribute("href")).toBe(REPO_URL);
  const report = screen.getByRole("link", { name: "Report a mistake in the data" });
  expect(report.getAttribute("href")).toBe(CORRECTION_URL);
  expect(report.getAttribute("rel")).toBe("noopener noreferrer");
});

test("the language switch reports the choice", () => {
  const onLang = vi.fn();
  render(<Credits t={createT(en)} lang="en" onLang={onLang} />);
  const select = screen.getByRole("combobox", { name: "Language" });
  const deutsch = screen.getByRole("option", { name: "Deutsch" }) as HTMLOptionElement;
  fireEvent.change(select, { target: { value: deutsch.value } });
  expect(onLang).toHaveBeenCalledWith("de");
});

test("a template with the licence before the credit still fills in the credit", () => {
  const { container } = render(<Credits t={createT({ ...en, "credits.withLicence": "{licence}: {credit}" })} lang="en" onLang={() => {}} />);
  expect(container.textContent).toContain(`${en["credits.licenceCcBy"]}: ${en["credits.bodyparts3d"]}`);
  expect(container.textContent).not.toContain("{credit}");
});
