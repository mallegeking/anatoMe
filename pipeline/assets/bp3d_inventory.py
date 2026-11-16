"""List every BodyParts3D element mesh and match it against a region's targets (the hip by default).

Plain Python, no extra packages. Writes sources/bp3d-inventory.jsonl.
Run from the repo root: .venv/bin/python pipeline/assets/bp3d_inventory.py [--region <id>]
"""
import argparse
import csv
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from hipmatch import format_table, match_targets, side_of, strip_side_suffix, summarize  # noqa: E402

ROOT = HERE.parents[1]
BP3D = ROOT / "sources" / "bp3d"
OBJ_DIR = BP3D / "isa_BP3D_4.0_obj_99"
OUT = ROOT / "sources" / "bp3d-inventory.jsonl"
REGIONS = HERE / "regions"


def read_tsv(path):
    with open(path, newline="", encoding="utf-8") as f:
        rows = list(csv.reader(f, delimiter="\t"))
    return rows[1:]  # skip the header line


def count_faces(path):
    n = 0
    with open(path, "rb") as f:
        for line in f:
            if line.startswith(b"f "):
                n += 1
    return n


# The header line with the mesh's box in millimetres: "# Bounds(mm): (x1,y1,z1)-(x2,y2,z2)".
_BOUNDS = re.compile(r"^# Bounds\(mm\): \(([-\d.]+),[-\d.]+,[-\d.]+\)-\(([-\d.]+),[-\d.]+,[-\d.]+\)")


def bounds_centre_x(path):
    """The centre of the x range in the OBJ header's Bounds(mm) line, or None when it has none."""
    with open(path, encoding="utf-8", errors="replace") as f:
        for line in f:
            if not line.startswith("#"):
                return None
            m = _BOUNDS.match(line)
            if m:
                return (float(m.group(1)) + float(m.group(2))) / 2
    return None


def target_patterns(regions_dir):
    """Every pattern of every target in the target lists of regions_dir, compiled as match_targets does."""
    patterns = []
    for path in sorted(Path(regions_dir).glob("*.json")):
        for t in json.loads(path.read_text(encoding="utf-8"))["targets"]:
            patterns.extend(re.compile(p, re.IGNORECASE) for p in t["patterns"])
    return patterns


def side_by_position(record, centre_x, patterns):
    """The record with the side its position gives, when the side in its name disagrees.

    Only a record that one of the patterns matches is checked, so a region's mesh gets the side
    it lies on. In BodyParts3D left is x > 0. The English name stays as the source has it.
    A corrected record is printed.
    """
    if record["side"] == "" or centre_x is None or centre_x == 0:
        return record
    if not any(p.search(strip_side_suffix(record["english"])) for p in patterns):
        return record
    side = "l" if centre_x > 0 else "r"
    if side == record["side"]:
        return record
    print(f"side corrected: {record['mesh_name']} {record['english']!r} is named {record['side']} "
          f"but lies at x = {centre_x:.0f} mm, side set to {side}")
    return {**record, "side": side}


def pick_concept(concepts, elements_of, name_of):
    """Choose the most specific concept for one element.

    A concept that covers only this element wins (for example "left femur").
    Ties prefer a name that starts with left or right, then the lower FMA number.
    """
    def key(c):
        sided = side_of(name_of[c]) != ""
        return (len(elements_of[c]), not sided, int(c.replace("FMA", "")))
    return min(concepts, key=key)


def build_records():
    elements_of = defaultdict(set)   # concept -> set of element ids
    concepts_of = defaultdict(set)   # element -> set of concept ids
    for concept, _name, element in read_tsv(BP3D / "isa_element_parts.txt"):
        elements_of[concept].add(element)
        concepts_of[element].add(concept)
    name_of = {}  # concept -> English name from the parts list
    for concept, _rep, en in read_tsv(BP3D / "isa_parts_list_e.txt"):
        name_of[concept] = en
    patterns = target_patterns(REGIONS)
    records = []
    for obj in sorted(OBJ_DIR.glob("*.obj")):
        element = obj.stem
        concept = pick_concept(concepts_of[element], elements_of, name_of)
        english = name_of[concept]
        record = {
            "source": "bp3d",
            "mesh_name": element,
            "english": english,
            "side": side_of(english),
            "faces": count_faces(obj),
            "bytes": obj.stat().st_size,
            "fma": concept,
        }
        records.append(side_by_position(record, bounds_centre_x(obj), patterns))
    return records


def main():
    ap = argparse.ArgumentParser(prog="bp3d_inventory.py")
    ap.add_argument("--region", default="hip", help="the target file in regions/ to print the match table for")
    args = ap.parse_args()
    records = build_records()
    with open(OUT, "w", encoding="utf-8") as f:
        for r in records:
            f.write(json.dumps(r) + "\n")
    print(f"wrote {len(records)} records to {OUT}")
    region = json.loads((HERE / "regions" / f"{args.region}.json").read_text(encoding="utf-8"))
    matches = match_targets(records, region["targets"])
    print(format_table(summarize(matches, region["targets"])))


if __name__ == "__main__":
    main()
