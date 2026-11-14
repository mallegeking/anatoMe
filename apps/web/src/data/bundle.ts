// The shape of the compiled data for one region (public/data/<region>.json).
// Types only. The app reads it and pipeline/data/src/compile.ts writes it.

// gap names a part the model does not show yet. The info panel shows the text gap.<gap> for it.
export type BundleStructure = { id: string; type: string; english: string; latin?: string; depth: number; paired: boolean; gap?: string };

export type BundleMovement = { id: string; english: string; dof: string; direction: "positive" | "negative" };

// One source backing a claim. ref points to an entry in the bundle's citations.
export type BundleCitationUse = { ref: string; locator: string; says: string; says_kind: "quote" | "summary" };

export type BundleAttachment = {
  id: string;
  muscle: string;
  end: "origin" | "insertion";
  bone: string;
  landmark: string;
  citations: BundleCitationUse[];
  // True when no person has checked the row yet. Only the review build has these.
  draft: boolean;
};

export type BundleAction = {
  id: string;
  structure: string;
  movement: string;
  load: "working" | "stretched" | "pinched";
  role?: "primary" | "secondary";
  when?: { angle: string; min: number; max: number }[];
  applies_to?: string;
  confidence: "high" | "medium" | "low";
  citations: BundleCitationUse[];
  draft: boolean;
  // A question for the reviewer. Only the review build has it.
  review_note?: string;
};

export type BundlePhase = { id: string; english: string; path: { angle: string; from: number; to: number }[]; effort: string[] };

export type BundleExercise = {
  id: string;
  english: string;
  phases: BundlePhase[];
  citations: BundleCitationUse[];
  draft: boolean;
  // A question for the reviewer. Only the review build has it.
  review_note?: string;
};

export type BundleCitation = { id: string; title: string; authors: string; year: number; url: string; license: string };

export type RegionBundle = {
  region: string;
  mode: "normal" | "review";
  structures: BundleStructure[];
  movements: BundleMovement[];
  attachments: BundleAttachment[];
  actions: BundleAction[];
  citations: BundleCitation[];
  // How many unchecked action rows each structure has. Normal mode counts the rows it dropped.
  pendingByStructure: Record<string, number>;
  exercises: BundleExercise[];
  // How many unchecked action rows each movement has.
  pendingByMovement: Record<string, number>;
  // How many unchecked exercise rows this region has.
  pendingExercises: number;
};
