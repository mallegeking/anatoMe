import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import en from "../i18n/en.json";
import { createT } from "../i18n/t";
import { Credits } from "./Credits";

afterEach(cleanup);

test("credits show the licence deeds, the changes and the library licences", () => {
  render(<Credits t={createT(en)} />);
  // The verbatim credit lines stay in the text.
  expect(screen.getByText(en["credits.bodyparts3d"], { exact: false })).toBeTruthy();
  expect(screen.getByText(en["credits.zanatomy"], { exact: false })).toBeTruthy();
  expect(screen.getByText(en["credits.licenceCcBy"]).getAttribute("href")).toBe("https://creativecommons.org/licenses/by/4.0/");
  expect(screen.getByText(en["credits.licenceCcBySa"]).getAttribute("href")).toBe("https://creativecommons.org/licenses/by-sa/4.0/");
  expect(screen.getByText(en["credits.modified"])).toBeTruthy();
  expect(screen.getByText(en["credits.librariesLink"]).getAttribute("href")).toMatch(/third-party-licenses\.txt$/);
});
