import { expect, test } from "vitest";
import en from "../i18n/en.json";
import { createT } from "../i18n/t";
import { describeCondition, loadWord, roleWord } from "./describe";

const t = createT(en);

test("one range", () =>
  expect(describeCondition([{ angle: "hip.flexion", min: 0, max: 45 }], t)).toBe("with the hip bent between 0 and 45 degrees"));
test("two ranges join with and", () =>
  expect(
    describeCondition(
      [
        { angle: "hip.flexion", min: 0, max: 60 },
        { angle: "hip.rotation", min: 0, max: 30 },
      ],
      t,
    ),
  ).toBe("with the hip bent between 0 and 60 degrees and with the hip turned between 0 and 30 degrees"));
test("no condition gives empty text", () => expect(describeCondition(undefined, t)).toBe(""));
test("load and role words", () => {
  expect(loadWord("stretched", t)).toBe("is stretched");
  expect(roleWord("secondary", t)).toBe("helper");
});
