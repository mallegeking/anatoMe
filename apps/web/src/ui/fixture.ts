import type { RegionBundle } from "../data/bundle";
import { SHORT_QUERY, WIDE_QUERY } from "./useMedia";

// A small bundle for tests. Piriformis has one checked row and one waiting row. The review bundle adds the waiting rows as drafts.
export function makeBundle(mode: "normal" | "review" = "normal"): RegionBundle {
  const cite = [{ ref: "c1", locator: "p. 4", says: "It turns the thigh outwards.", says_kind: "quote" as const }];
  return {
    region: "hip",
    mode,
    structures: [
      { id: "hip-bone", type: "bone", english: "Hip bone", depth: 3, paired: true },
      { id: "sacrum", type: "bone", english: "Sacrum", latin: "Os sacrum", depth: 4, paired: false },
      { id: "femur", type: "bone", english: "Femur", latin: "Os femoris", depth: 3, paired: true },
      { id: "piriformis", type: "muscle", english: "Piriformis", latin: "Musculus piriformis", depth: 2, paired: true },
      { id: "rectus-femoris", type: "muscle", english: "Rectus femoris", depth: 1, paired: true, gap: "quadriceps-tendon" },
    ],
    movements: [{ id: "hip-ext-rot", english: "Hip external rotation", dof: "hip.rotation", direction: "positive" }],
    attachments: [
      { id: "a1", muscle: "piriformis", end: "origin", bone: "sacrum", landmark: "anterior surface", citations: cite, draft: false },
      ...(mode === "review"
        ? [{ id: "a2", muscle: "piriformis", end: "insertion" as const, bone: "femur", landmark: "greater trochanter", citations: cite, draft: true }]
        : []),
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
      ...(mode === "review"
        ? [
            {
              id: "x2",
              structure: "piriformis",
              movement: "hip-ext-rot",
              load: "stretched" as const,
              when: [{ angle: "hip.flexion", min: 0, max: 30 }],
              applies_to: "Test hips only",
              confidence: "low" as const,
              citations: cite,
              draft: true,
              review_note: "Does the piriformis turn the thigh outwards at every angle?",
            },
          ]
        : []),
    ],
    citations: [{ id: "c1", title: "Hip anatomy", authors: "Smith", year: 2020, url: "https://example.org", license: "CC-BY" }],
    pendingByStructure: { piriformis: 1 },
    exercises: [],
    pendingByMovement: {},
    pendingExercises: 0,
  };
}

// The screen the matchMedia stub answers for, and who listens to it.
let viewport: "phone" | "wide" | "short" = "phone";
const viewportListeners = new Set<() => void>();

function stubMatchMedia(query: string): MediaQueryList {
  return {
    media: query,
    get matches() {
      return (query === WIDE_QUERY && viewport === "wide") || (query === SHORT_QUERY && viewport === "short");
    },
    onchange: null,
    addEventListener: (_type: string, listener: () => void) => viewportListeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) => viewportListeners.delete(listener),
    addListener: (listener: () => void) => viewportListeners.add(listener),
    removeListener: (listener: () => void) => viewportListeners.delete(listener),
    dispatchEvent: () => false,
  } as unknown as MediaQueryList;
}

// For tests: makes window.matchMedia answer the layout queries as on a phone, a wide screen or a short phone,
// and tells every listener, as a browser does when the window changes size.
export function setViewport(kind: "phone" | "wide" | "short"): void {
  viewport = kind;
  window.matchMedia = stubMatchMedia;
  for (const listener of [...viewportListeners]) listener();
}
