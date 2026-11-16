"""Generate the target lists and structure files of the five new regions from BodyParts3D.

Plain Python, no extra packages. Run from the repo root:
  .venv/bin/python pipeline/assets/region_gen.py targets
      writes pipeline/assets/regions/<region>.json for every region in REGIONS
  .venv/bin/python pipeline/assets/region_gen.py structures
      writes data/structures/<region>.yaml from those files and sources/<region>-depths.json

Needs sources/bp3d-inventory.jsonl (run bp3d_inventory.py first), the BodyParts3D part lists
and Z-Anatomy's TA2.csv. The depths files come from build_region_blender.py --depths-out.
"""
import json
import re
import sys
from collections import defaultdict
from datetime import date
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
BP3D = ROOT / "sources" / "bp3d"
INVENTORY = ROOT / "sources" / "bp3d-inventory.jsonl"
TA2 = ROOT / "sources" / "z-anatomy" / "TA2.csv"
REGIONS_DIR = HERE / "regions"
STRUCTURES_DIR = ROOT / "data" / "structures"

# --- The rules ----------------------------------------------------------------

BONE, MUSCLE = "FMA5018", "FMA5022"   # bone organ, muscle organ
REGIONS = ["lower-leg", "shoulder", "arm", "neck", "trunk"]
MAX_TRIANGLES_PER_MESH = 2000

# Parts the two classes miss: muscles stored as heads or parts, the sternum, the Achilles tendon.
EXTRA = re.compile(
    r"part of (deltoid|pectoralis major|trapezius|longus colli)"
    r"|head of (triceps brachii|biceps brachii|gastrocnemius|flexor carpi ulnaris|pronator teres"
    r"|adductor hallucis|adductor pollicis|flexor hallucis brevis|flexor pollicis brevis)"
    r"|^set of (dorsal interossei of hand|palmar interossei of hand|lumbricals of hand"
    r"|levatores costarum \w+|interspinales \w+|\w+ cervical intertransversarii)$"
    r"|^(manubrium|body of sternum|xiphoid process|calcaneal tendon)$")

# Out of scope: eye, larynx, pharynx, palate, tongue, perineum, anal sphincter.
OUT_CLASSES = {"FMA49033", "FMA46562", "FMA46619", "FMA46726", "FMA46689", "FMA9623", "FMA21930"}
OUT_NAMES = re.compile(
    r"levator palpebrae|coccygeus|genioglossus|hyoglossus|uvular|arytenoid|vocalis|pharyn"
    r"|veli palatini|perineal|adductor minimus")


def region_of(name, classes):
    is_bone = BONE in classes or re.search(r"^(manubrium|body of sternum|xiphoid process)$", name)
    if not (is_bone or MUSCLE in classes or EXTRA.search(name)):
        return None
    if not is_bone and (classes & OUT_CLASSES or OUT_NAMES.search(name)):
        return None
    if is_bone:
        if classes & {"FMA24491", "FMA24492", "FMA24493", "FMA45096"}:   # tarsal, metatarsal, toe, sesamoid of foot
            return "lower-leg"
        if classes & {"FMA23889", "FMA9612", "FMA23914"} or name in ("radius", "ulna"):   # carpal, metacarpal, finger
            return "arm"
        if name in ("clavicle", "scapula", "humerus"):
            return "shoulder"
        if "FMA9915" in classes:                                          # cervical vertebra
            return "neck"
        if classes & {"FMA9914", "FMA7574"} or re.search(r"sternum|manubrium|xiphoid", name):   # vertebra, rib
            return "trunk"
        return "neck"                                                     # skull, mandible, hyoid
    if classes & {"FMA22471", "FMA37369"} or re.search(r"gastrocnemius|hallucis|calcaneal", name):   # leg, foot
        return "lower-leg"
    if classes & {"FMA37347", "FMA33531"} or re.search(
            r"deltoid|pectoralis|trapezius|serratus anterior|subclavius|rhomboid|levator scapulae", name):
        return "shoulder"
    if "FMA37348" in classes or re.search(r"triceps|biceps brachii|carpi|pronator|pollicis|of hand", name):
        return "arm"
    if classes & {"FMA9617", "FMA9616"} or re.search(r"capitis|cervicis|cervical|platysma", name):   # neck, head
        return "neck"
    return "trunk"


# Bones drawn in a region that is not their home. Keys are regions, values are sids.
ORDINALS = "first second third fourth fifth sixth seventh eighth ninth tenth eleventh twelfth".split()
CONTEXT = {
    "lower-leg": ["femur", "tibia", "fibula", "patella"],
    "arm": ["humerus", "scapula"],
    "shoulder": [f"{o}-rib" for o in ORDINALS] + ["manubrium", "body-of-sternum", "atlas", "axis"]
                + [f"{o}-cervical-vertebra" for o in ORDINALS[2:7]]
                + [f"{o}-thoracic-vertebra" for o in ORDINALS],
    "neck": ["clavicle", "scapula", "manubrium", "first-rib", "second-rib"]
            + [f"{o}-thoracic-vertebra" for o in ORDINALS[:6]],
    "trunk": ["sacrum", "hip-bone", "seventh-cervical-vertebra"],
}

# --- Names ----------------------------------------------------------------------

_SIDE_WORD = re.compile(r"\b(?:left|right) ", re.IGNORECASE)


def strip_side(name: str) -> str:
    """Remove the word "left " or "right " wherever it stands, and trim."""
    return _SIDE_WORD.sub("", name).strip()


def sid_of(name: str) -> str:
    """Lower case, no trailing " muscle", every run outside a-z0-9 becomes one "-"."""
    s = name.lower()
    if s.endswith(" muscle"):
        s = s[: -len(" muscle")]
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def is_bone_part(name, classes):
    """The same bone test region_of uses."""
    return bool(BONE in classes or re.search(r"^(manubrium|body of sternum|xiphoid process)$", name))


# --- Targets --------------------------------------------------------------------


def build_targets(records, classes_of, hip_targets):
    """Return ({region: [targets]}, [dropped name and reason]).

    `classes_of` maps a mesh name (the element file id) to every FMA class it belongs to.
    """
    groups = defaultdict(list)
    for r in records:
        groups[strip_side(r["english"]).lower()].append(r)

    hip_patterns = [re.compile(p, re.IGNORECASE) for t in hip_targets for p in t["patterns"]]
    hip_sids = {t["sid"] for t in hip_targets}
    own = {region: [] for region in REGIONS}
    dropped = []
    seen = {}  # sid -> group name
    for name in sorted(groups):
        recs = groups[name]
        if any(p.search(name) for p in hip_patterns):
            continue  # the hip owns it
        classes = set().union(*(classes_of.get(r["mesh_name"], set()) for r in recs))
        region = region_of(name, classes)
        if region is None:
            continue
        sides = {r["side"] for r in recs}
        if sides == {"l", "r"}:
            midline = False
        elif sides == {""}:
            midline = True
        else:
            reason = "only one side" if sides in ({"l"}, {"r"}) else "sided and unsided meshes mixed"
            dropped.append(f"{name}: {reason} ({', '.join(sorted(r['mesh_name'] for r in recs))})")
            continue
        sid = sid_of(name)
        if sid in seen:
            sys.exit(f"two groups give the sid {sid}: {seen[sid]!r} and {name!r}")
        if sid in hip_sids:
            sys.exit(f"the sid {sid} of {name!r} is already a hip structure")
        seen[sid] = name
        if is_bone_part(name, classes):
            type_ = "bone"
        elif name == "calcaneal tendon":
            type_ = "tendon"
        else:
            type_ = "muscle"
        target = {
            "sid": sid,
            "type": type_,
            "english": name[:1].upper() + name[1:],
            "patterns": ["^" + re.escape(e) + "$" for e in sorted({r["english"] for r in recs})],
            "required": True,
            "source": "bp3d",
        }
        if midline:
            target["midline"] = True
        own[region].append(target)

    by_sid = {t["sid"]: t for t in hip_targets}
    by_sid.update({t["sid"]: t for ts in own.values() for t in ts})
    result = {}
    for region in REGIONS:
        context = []
        for sid in CONTEXT[region]:
            if sid not in by_sid:
                sys.exit(f"context bone {sid} of {region} does not exist")
            context.append({**by_sid[sid], "context": True})
        result[region] = sorted(own[region], key=lambda t: t["sid"]) + sorted(context, key=lambda t: t["sid"])
    return result, dropped


# --- Latin and FMA --------------------------------------------------------------


def read_latin(path):
    """English name (lower case) -> set of Latin terms, from Z-Anatomy's TA2.csv."""
    latin = defaultdict(set)
    with open(path, encoding="utf-8-sig") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            fields = line.strip('"').split(";")
            if len(fields) < 3:
                continue
            latin[fields[1].lower()].add(fields[2])
    return dict(latin)


def latin_for(name, latin):
    """The Latin term of a name, or None when TA2 has none or more than one."""
    name = name.lower()
    keys = [name, name + " muscle"]
    if name.endswith(" muscle"):
        keys.append(name[: -len(" muscle")])
    for key in keys:
        if key in latin:
            terms = latin[key]
            return next(iter(terms)) if len(terms) == 1 else None
    return None


def read_tsv(path):
    with open(path, encoding="utf-8") as f:
        rows = [line.rstrip("\n").split("\t") for line in f]
    return rows[1:]  # skip the header line


def read_fma(path):
    """Lower-case name -> concept id, from isa_parts_list_e.txt."""
    return {en.lower(): concept for concept, _rep, en in read_tsv(path)}


# --- Structure files ------------------------------------------------------------

_PLAIN = re.compile(r"^[A-Za-z][A-Za-z0-9 ()'./-]*[A-Za-z0-9)'.]$|^[A-Za-z]$")
_RESERVED = {"true", "false", "yes", "no", "on", "off", "null", "y", "n"}


def scalar(value):
    """A YAML flow value: plain when that is safe, else in double quotes."""
    text = str(value)
    if _PLAIN.match(text) and text.lower() not in _RESERVED:
        return text
    return json.dumps(text, ensure_ascii=False)


def header(region, today):
    return "\n".join([
        f"# Structures of the {region} region. Generated by pipeline/assets/region_gen.py on {today}.",
        "# Do not edit by hand. Change the generator rules and run it again.",
        "# Names, ids and FMA ids come from the BodyParts3D part lists (isa_parts_list_e.txt).",
        "# latin is from Z-Anatomy's TA2.csv by exact match of the English name, not checked one by one.",
        "# It is left out when TA2 has no term or more than one for the name.",
        "# depth is the layer from the skin inwards, measured by sending rays out from each soft part's surface",
        "# and taking the share that meet no other part, bone or soft.",
        "# A share of 0.20 or more is depth 1, 0.05 or more is depth 2, less is depth 3, and bones are 4.",
        "# also_in lists the other regions that draw this bone too.",
    ]) + "\n"


def write_structures(region, targets, depths, latin_of, fma_of, today):
    """The YAML text of data/structures/<region>.yaml, one row per own target."""
    lines = [header(region, today)]
    for t in targets:
        if t.get("context"):
            continue
        sid = t["sid"]
        fields = [f"id: {scalar(sid)}", f"type: {scalar(t['type'])}", f"english: {scalar(t['english'])}"]
        if latin_of.get(sid):
            fields.append(f"latin: {scalar(latin_of[sid])}")
        if fma_of.get(sid):
            fields.append(f"fma: {json.dumps(fma_of[sid])}")
        fields.append(f"region: {region}")
        if t["type"] == "bone":
            fields.append("depth: 4")
        else:
            if sid not in depths:
                sys.exit(f"{region}: no measured depth for {sid}")
            fields.append(f"depth: {depths[sid]['depth']}")
        if t.get("midline"):
            fields.append("midline: true")
        also_in = [r for r in REGIONS if sid in CONTEXT[r]]
        if also_in:
            fields.append(f"also_in: [{', '.join(also_in)}]")
        if t["type"] != "bone":
            n = round(depths[sid]["free"] * 100)
            note = (f"Measured from the model on {today}: {n} percent of the rays from its surface "
                    "meet no other part. See the header.")
            fields.append(f"depth_note: {json.dumps(note)}")
        lines.append("- {" + ", ".join(fields) + "}\n")
    return "".join(lines)


# --- Command line ---------------------------------------------------------------


def load_records():
    if not INVENTORY.exists():
        sys.exit(f"missing {INVENTORY}, run bp3d_inventory.py first")
    with open(INVENTORY, encoding="utf-8") as f:
        return [json.loads(line) for line in f]


def read_classes():
    """Element file id -> every FMA class id it belongs to, from isa_element_parts.txt."""
    classes_of = defaultdict(set)
    for concept, _name, element in read_tsv(BP3D / "isa_element_parts.txt"):
        classes_of[element].add(concept)
    return dict(classes_of)


def cmd_targets():
    hip = json.loads((REGIONS_DIR / "hip.json").read_text(encoding="utf-8"))
    targets, dropped = build_targets(load_records(), read_classes(), hip["targets"])
    for region in REGIONS:
        data = {"region": region, "max_triangles_per_mesh": MAX_TRIANGLES_PER_MESH, "targets": targets[region]}
        (REGIONS_DIR / f"{region}.json").write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
        own = [t for t in targets[region] if not t.get("context")]
        meshes = sum(1 if t.get("midline") else 2 for t in own)
        print(f"{region:10s} {len(own):4d} structures {meshes:4d} meshes "
              f"{len(targets[region]) - len(own):3d} context targets")
    print(f"dropped {len(dropped)}:")
    for d in dropped:
        print(f"  {d}")


def cmd_structures():
    latin = read_latin(TA2)
    fma_by_name = read_fma(BP3D / "isa_parts_list_e.txt")
    today = date.today().isoformat()
    for region in REGIONS:
        targets = json.loads((REGIONS_DIR / f"{region}.json").read_text(encoding="utf-8"))["targets"]
        depths_path = ROOT / "sources" / f"{region}-depths.json"
        if not depths_path.exists():
            sys.exit(f"missing {depths_path}, build the region with --depths-out first")
        depths = json.loads(depths_path.read_text(encoding="utf-8"))
        own = [t for t in targets if not t.get("context")]
        latin_of = {t["sid"]: latin_for(t["english"], latin) for t in own}
        latin_of = {k: v for k, v in latin_of.items() if v}
        fma_of = {t["sid"]: fma_by_name[t["english"].lower()] for t in own if t["english"].lower() in fma_by_name}
        out = STRUCTURES_DIR / f"{region}.yaml"
        out.write_text(write_structures(region, targets, depths, latin_of, fma_of, today), encoding="utf-8")
        print(f"{region:10s} {len(own):4d} structures, Latin for {len(latin_of)}, FMA for {len(fma_of)}: wrote {out.relative_to(ROOT)}")


def main():
    commands = {"targets": cmd_targets, "structures": cmd_structures}
    if len(sys.argv) != 2 or sys.argv[1] not in commands:
        sys.exit("usage: region_gen.py targets|structures")
    commands[sys.argv[1]]()


if __name__ == "__main__":
    main()
