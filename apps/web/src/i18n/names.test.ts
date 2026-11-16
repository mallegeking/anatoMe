import { expect, test } from "vitest";
import { nameOf } from "./names";

test("German when asked for and present", () => expect(nameOf({ english: "Hip bone", german: "Hüftbein" }, "de")).toBe("Hüftbein"));
test("English when the German name is missing", () => expect(nameOf({ english: "Hip bone" }, "de")).toBe("Hip bone"));
test("English when English is asked for", () => expect(nameOf({ english: "Hip bone", german: "Hüftbein" }, "en")).toBe("Hip bone"));
