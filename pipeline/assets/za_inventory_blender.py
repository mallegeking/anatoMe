"""List Z-Anatomy structure meshes and match them against the hip targets.

Runs inside Blender, headless, from the repo root:
  tools/blender/blender -b --factory-startup -P pipeline/assets/za_inventory_blender.py

Writes sources/z-anatomy-inventory.jsonl.

What counts as a structure mesh:
  - a mesh object with at least one face
  - in the skeletal, joints or muscular collections (see COLLECTIONS)
  - named with a ".l" or ".r" suffix, or with no dotted suffix (midline structures)
Skipped on purpose:
  - ".j" and ".i" objects, which have no faces (label anchors and leader lines)
  - ".g" and other group helpers
  - the "2: Muscular insertions" collection, which holds small origin and
    insertion patches painted on bones (attachment overlays, not whole structures)
  - every other collection, so the inner ear, kidney and brain white matter
    parts (not licensed for us) are never read
"""
import json
import re
import sys
from pathlib import Path

import bpy

HERE = Path(__file__).resolve().parent if "__file__" in globals() else Path.cwd() / "pipeline" / "assets"
sys.path.insert(0, str(HERE))
from hipmatch import format_table, match_targets, side_of, summarize  # noqa: E402

ROOT = HERE.parents[1]
BLEND = ROOT / "sources" / "z-anatomy" / "Z-Anatomy" / "Startup.blend"
OUT = ROOT / "sources" / "z-anatomy-inventory.jsonl"

COLLECTIONS = ["1: Skeletal system", "3: Joints", "4: Muscular system"]
BYTES_PER_FACE = 50  # rough guess, so the size column is "estimated"

# Name ends with .l or .r, or has no dotted suffix at all.
STRUCTURE_NAME = re.compile(r"^(?:.*\.[lr]|[^.]*)$")


def build_records():
    seen = set()
    records = []
    for coll_name in COLLECTIONS:
        for obj in bpy.data.collections[coll_name].all_objects:
            if obj.type != "MESH" or obj.name in seen:
                continue
            seen.add(obj.name)
            faces = len(obj.data.polygons)
            if faces == 0 or not STRUCTURE_NAME.match(obj.name):
                continue
            english = re.sub(r"\.[lr]$", "", obj.name)
            records.append({
                "source": "z-anatomy",
                "mesh_name": obj.name,
                "english": english,
                "side": side_of(obj.name),
                "faces": faces,
                "bytes": faces * BYTES_PER_FACE,  # estimated
                "fma": None,
            })
    records.sort(key=lambda r: r["mesh_name"])
    return records


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    records = build_records()
    with open(OUT, "w", encoding="utf-8") as f:
        for r in records:
            f.write(json.dumps(r) + "\n")
    print(f"wrote {len(records)} records to {OUT}")
    hip = json.loads((HERE / "regions" / "hip.json").read_text(encoding="utf-8"))
    matches = match_targets(records, hip["targets"])
    print(format_table(summarize(matches, hip["targets"])))


main()
