import type { MovementPick } from "../movement/state";
import type { Pose } from "../movement/roles";

export type Feeling = "painful" | "fine";
export type EntrySide = "l" | "r" | "both";

export type NotebookEntry = {
  id: string; // a random id made when the entry is saved
  createdAt: number; // milliseconds since 1970
  date: string; // local date, YYYY-MM-DD
  pick: MovementPick; // the movement, or the exercise and phase
  pose: Pose; // the joint angles when it was logged
  feeling: Feeling;
  side: EntrySide;
  note: string; // trimmed, at most NOTE_MAX characters
};

export const NOTE_MAX = 500;

const two = (n: number) => String(n).padStart(2, "0");

// Builds an entry. The date uses the phone's local day, not UTC.
export function makeEntry(
  input: Pick<NotebookEntry, "pick" | "pose" | "feeling" | "side" | "note">,
  now: Date,
  id: string,
): NotebookEntry {
  return {
    id,
    createdAt: now.getTime(),
    date: `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}`,
    pick: input.pick,
    pose: input.pose,
    feeling: input.feeling,
    side: input.side,
    note: input.note.trim().slice(0, NOTE_MAX),
  };
}
