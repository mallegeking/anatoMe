import type { BundleAction, BundleStructure, RegionBundle } from "../data/bundle";

// A small hip bundle for the movement tests. The numbers are hand-checked, so change them with care.
export function makeMovementBundle(mode: "normal" | "review" = "normal"): RegionBundle {
  const cite = [{ ref: "c1", locator: "p. 4", says: "A short note.", says_kind: "summary" as const }];
  const s = (id: string, english: string, type: string, depth: number, paired = true): BundleStructure => ({ id, type, english, depth, paired });
  const mv = (id: string, dof: string, direction: "positive" | "negative") => ({
    id,
    english: id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, " "),
    dof,
    direction,
  });
  const act = (
    id: string,
    structure: string,
    movement: string,
    load: BundleAction["load"],
    role?: "primary" | "secondary",
    when?: BundleAction["when"],
  ): BundleAction => ({
    id,
    structure,
    movement,
    load,
    ...(role ? { role } : {}),
    ...(when ? { when } : {}),
    confidence: "high",
    citations: cite,
    draft: false,
  });
  const squatEffort = ["hip-extension", "knee-extension"];
  return {
    region: "hip",
    mode,
    structures: [
      s("femur", "Femur", "bone", 4),
      s("sacrum", "Sacrum", "bone", 4, false),
      s("gluteus-maximus", "Gluteus maximus", "muscle", 1),
      s("piriformis", "Piriformis", "muscle", 2),
      s("obturator-externus", "Obturator externus", "muscle", 3),
      s("ischiofemoral-ligament", "Ischiofemoral ligament", "ligament", 3),
      s("acetabular-labrum", "Acetabular labrum", "labrum", 3),
    ],
    movements: [
      mv("hip-flexion", "hip.flexion", "positive"),
      mv("hip-extension", "hip.flexion", "negative"),
      mv("hip-internal-rotation", "hip.rotation", "positive"),
      mv("hip-external-rotation", "hip.rotation", "negative"),
      mv("knee-flexion", "knee.flexion", "positive"),
      mv("knee-extension", "knee.flexion", "negative"),
    ],
    attachments: [],
    actions: [
      act("m1", "piriformis", "hip-external-rotation", "working", "primary", [{ angle: "hip.flexion", min: 0, max: 45 }]),
      act("m2", "piriformis", "hip-internal-rotation", "working", "secondary", [{ angle: "hip.flexion", min: 90, max: 105 }]),
      act("m3", "gluteus-maximus", "hip-external-rotation", "working", "secondary"),
      act("m4", "gluteus-maximus", "hip-extension", "working", "primary"),
      act("m5", "ischiofemoral-ligament", "hip-internal-rotation", "stretched"),
      act("m6", "acetabular-labrum", "hip-flexion", "pinched", undefined, [{ angle: "hip.flexion", min: 90, max: 120 }]),
      act("m7", "obturator-externus", "hip-external-rotation", "working", "primary", [{ angle: "hip.flexion", min: 0, max: 60 }]),
      act("m8", "obturator-externus", "hip-external-rotation", "working", "secondary", [{ angle: "hip.flexion", min: 75, max: 90 }]),
    ],
    citations: [{ id: "c1", title: "Hip anatomy", authors: "Smith", year: 2020, url: "https://example.org", license: "CC-BY" }],
    pendingByStructure: {},
    exercises: [
      {
        id: "squat",
        english: "Bodyweight squat",
        phases: [
          {
            id: "lowering",
            english: "Lowering",
            path: [
              { angle: "hip.flexion", from: 0, to: 100 },
              { angle: "knee.flexion", from: 0, to: 110 },
            ],
            effort: squatEffort,
          },
          {
            id: "rising",
            english: "Rising",
            path: [
              { angle: "hip.flexion", from: 100, to: 0 },
              { angle: "knee.flexion", from: 110, to: 0 },
            ],
            effort: squatEffort,
          },
        ],
        citations: cite,
        draft: false,
      },
      ...(mode === "review"
        ? [
            {
              id: "bridge",
              english: "Glute bridge",
              phases: [{ id: "lifting", english: "Lifting", path: [{ angle: "hip.flexion", from: 60, to: 0 }], effort: ["hip-extension"] }],
              citations: cite,
              draft: true,
              review_note: "Is the range right?",
            },
          ]
        : []),
    ],
    pendingByMovement: { "knee-flexion": 2 },
    pendingExercises: mode === "review" ? 1 : 0,
  };
}
