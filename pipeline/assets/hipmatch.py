"""Match mesh names from a source against the hip target list.

Standard library only, so Blender's bundled Python can import it too.
"""
import re
from typing import Literal, Optional, TypedDict


class MeshRecord(TypedDict):
    source: str          # "bp3d" or "z-anatomy"
    mesh_name: str       # file stem (bp3d) or object name (z-anatomy)
    english: str         # English name used for matching
    side: Literal["l", "r", ""]
    faces: int
    bytes: int           # real file size (bp3d) or estimated (z-anatomy)
    fma: Optional[str]   # FMA concept id when the source has one


# Z-Anatomy style suffix: "Femur.l", also "Femur.l.001" after a Blender copy.
_SUFFIX = re.compile(r"\.([lr])(\.\d+)?$", re.IGNORECASE)
# BodyParts3D style: "Left femur" at the start, or "Long head of left biceps femoris" inside.
_WORD = re.compile(r"\b(left|right)\b", re.IGNORECASE)


def side_of(name: str) -> Literal["l", "r", ""]:
    """Return "l" or "r" from a name's suffix or side word, or "" for midline or unknown."""
    m = _SUFFIX.search(name.strip())
    if m:
        return m.group(1).lower()  # type: ignore[return-value]
    m = _WORD.search(name)
    if m:
        return m.group(1)[0].lower()  # type: ignore[return-value]
    return ""


def strip_side_suffix(name: str) -> str:
    """Remove a trailing ".l" or ".r" so patterns see the plain name."""
    return _SUFFIX.sub("", name.strip())


def match_targets(records: list, targets: list) -> dict:
    """Map each target sid to the records whose English name matches any of its patterns."""
    result = {}
    for t in targets:
        patterns = [re.compile(p, re.IGNORECASE) for p in t["patterns"]]
        result[t["sid"]] = [
            r for r in records
            if any(p.search(strip_side_suffix(r["english"])) for p in patterns)
        ]
    return result


def summarize(matches: dict, targets: list) -> list:
    """One row per target with left, right and midline match counts and total faces."""
    rows = []
    for t in targets:
        found = matches.get(t["sid"], [])
        rows.append({
            "sid": t["sid"],
            "type": t["type"],
            "required": t["required"],
            "left": sum(1 for r in found if r["side"] == "l"),
            "right": sum(1 for r in found if r["side"] == "r"),
            "mid": sum(1 for r in found if r["side"] == ""),
            "faces": sum(r["faces"] for r in found),
        })
    return rows


def format_table(rows: list) -> str:
    """Plain text table for the console."""
    lines = [f"{'target':32} {'type':9} {'req':3} {'L':>3} {'R':>3} {'mid':>3} {'faces':>8}"]
    for r in rows:
        lines.append(
            f"{r['sid']:32} {r['type']:9} {'yes' if r['required'] else 'no':3} "
            f"{r['left']:>3} {r['right']:>3} {r['mid']:>3} {r['faces']:>8}"
        )
    return "\n".join(lines)
