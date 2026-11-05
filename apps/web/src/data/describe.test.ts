import { expect, test } from "vitest";
import en from "../i18n/en.json";
import { createT } from "../i18n/t";
import { describeAction, describeCondition, jointOf, loadWord, roleWord } from "./describe";

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
test("the joining word comes from the text file", () =>
  expect(
    describeCondition(
      [
        { angle: "hip.flexion", min: 0, max: 60 },
        { angle: "hip.rotation", min: 0, max: 30 },
      ],
      createT({ ...en, "when.and": "{first} plus {second}" }),
    ),
  ).toBe("with the hip bent between 0 and 60 degrees plus with the hip turned between 0 and 30 degrees"));
test("no condition gives empty text", () => expect(describeCondition(undefined, t)).toBe(""));
test("load and role words", () => {
  expect(loadWord("stretched", t)).toBe("is stretched");
  expect(roleWord("secondary", t)).toBe("helper");
});

test("a whole working row reads as one sentence", () =>
  expect(
    describeAction(
      { id: "x", structure: "piriformis", movement: "hip-external-rotation", load: "working", role: "primary", when: [{ angle: "hip.flexion", min: 0, max: 45 }], confidence: "high", citations: [], draft: false },
      t,
    ),
  ).toBe("works (main), with the hip bent between 0 and 45 degrees"));
test("a stretched row without a condition is just the load word", () =>
  expect(describeAction({ id: "x", structure: "piriformis", movement: "hip-internal-rotation", load: "stretched", confidence: "low", citations: [], draft: false }, t)).toBe(
    "is stretched",
  ));
test("the joint comes from the start of the dof", () => {
  expect(jointOf({ id: "knee-flexion", english: "Knee flexion", dof: "knee.flexion", direction: "positive" })).toBe("knee");
  expect(jointOf({ id: "hip-abduction", english: "Hip abduction", dof: "hip.abduction", direction: "positive" })).toBe("hip");
});
