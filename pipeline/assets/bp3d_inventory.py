"""List every BodyParts3D element mesh and match it against the hip targets.

Plain Python, no extra packages. Writes sources/bp3d-inventory.jsonl.
Run from the repo root: .venv/bin/python pipeline/assets/bp3d_inventory.py
"""
import csv
import json
import sys
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from hipmatch import format_table, match_targets, side_of, summarize  # noqa: E402

ROOT = HERE.parents[1]
BP3D = ROOT / "sources" / "bp3d"
OBJ_DIR = BP3D / "isa_BP3D_4.0_obj_99"
OUT = ROOT / "sources" / "bp3d-inventory.jsonl"


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
    records = []
    for obj in sorted(OBJ_DIR.glob("*.obj")):
        element = obj.stem
        concept = pick_concept(concepts_of[element], elements_of, name_of)
        english = name_of[concept]
        records.append({
            "source": "bp3d",
            "mesh_name": element,
            "english": english,
            "side": side_of(english),
            "faces": count_faces(obj),
            "bytes": obj.stat().st_size,
            "fma": concept,
        })
    return records


def main():
    records = build_records()
    with open(OUT, "w", encoding="utf-8") as f:
        for r in records:
            f.write(json.dumps(r) + "\n")
    print(f"wrote {len(records)} records to {OUT}")
    hip = json.loads((HERE / "regions" / "hip.json").read_text(encoding="utf-8"))
    matches = match_targets(records, hip["targets"])
    print(format_table(summarize(matches, hip["targets"])))


if __name__ == "__main__":
    main()
