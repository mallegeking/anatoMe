import type { RegionBundle } from "../data/bundle";

// A small bundle for tests. Piriformis has one checked row and one waiting row.
export function makeBundle(mode: "normal" | "review" = "normal"): RegionBundle {
  const cite = [{ ref: "c1", locator: "p. 4", says: "It turns the thigh outwards.", says_kind: "quote" as const }];
  return {
    region: "hip",
    mode,
    structures: [
      { id: "hip-bone", type: "bone", english: "Hip bone", depth: 3 },
      { id: "sacrum", type: "bone", english: "Sacrum", latin: "Os sacrum", depth: 4 },
      { id: "femur", type: "bone", english: "Femur", latin: "Os femoris", depth: 3 },
      { id: "piriformis", type: "muscle", english: "Piriformis", latin: "Musculus piriformis", depth: 2 },
      { id: "rectus-femoris", type: "muscle", english: "Rectus femoris", depth: 1 },
    ],
    movements: [{ id: "hip-ext-rot", english: "Hip external rotation", dof: "hip.rotation", direction: "positive" }],
    attachments: [
      { id: "a1", muscle: "piriformis", end: "origin", bone: "sacrum", landmark: "anterior surface", citations: cite, draft: false },
    ],
    actions: [
      {
        id: "x1",
        structure: "piriformis",
        movement: "hip-ext-rot",
        load: "working",
        role: "primary",
        when: [{ angle: "hip.flexion", min: 0, max: 60 }],
        confidence: "high",
        citations: cite,
        draft: false,
        ...(mode === "review" ? { review_note: "Check the angle" } : {}),
      },
    ],
    citations: [{ id: "c1", title: "Hip anatomy", authors: "Smith", year: 2020, url: "https://example.org", license: "CC-BY" }],
    pendingByStructure: { piriformis: 1 },
  };
}
