"""Tests for region_gen.py. Run with: .venv/bin/pytest pipeline/assets/tests -q"""
import re
import sys
from pathlib import Path

# Let the tests import region_gen from the folder above.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from region_gen import (  # noqa: E402
    BONE,
    CONTEXT,
    MUSCLE,
    build_targets,
    latin_for,
    read_latin,
    region_of,
    sid_of,
    strip_side,
    write_structures,
)

HIP_BONES = ["femur", "tibia", "fibula", "patella", "sacrum", "hip-bone"]


def hip_target(sid):
    """A hip bone target in the style of regions/hip.json."""
    name = sid.replace("-", " ")
    return {
        "sid": sid,
        "type": "bone",
        "english": name.capitalize(),
        "patterns": [f"^(?:(?:left|right) )?(?:{name})$"],
        "required": True,
        "source": "bp3d",
    }


def context_bone_classes(sid):
    """FMA classes that give each context bone its home region through region_of."""
    if sid.endswith("-rib"):
        return {BONE, "FMA7574"}
    if sid.endswith("-thoracic-vertebra"):
        return {BONE, "FMA9914"}
    if sid.endswith("-cervical-vertebra") or sid in ("atlas", "axis"):
        return {BONE, "FMA9914", "FMA9915"}
    if sid in ("clavicle", "scapula", "humerus"):
        return {BONE}
    return set()  # manubrium and body of sternum are bones by name


def fixture(named):
    """Records and classes for `named` (english, classes) pairs plus one bone per context sid.

    build_targets stops when a context sid does not exist, so every bone that a CONTEXT
    list names and the hip does not own gets a record here.
    """
    entries = list(named)
    context_sids = sorted({s for sids in CONTEXT.values() for s in sids} - set(HIP_BONES))
    for sid in context_sids:
        name = sid.replace("-", " ")
        classes = context_bone_classes(sid)
        if sid.endswith("-rib") or sid in ("clavicle", "scapula", "humerus"):
            entries += [(f"left {name}", classes), (f"right {name}", classes)]
        else:
            entries.append((name, classes))
    records, classes_of = [], {}
    for i, (english, classes) in enumerate(entries):
        mesh = f"FJ{9000 + i}"
        side = "l" if re.search(r"\bleft\b", english) else "r" if re.search(r"\bright\b", english) else ""
        records.append({"source": "bp3d", "mesh_name": mesh, "english": english, "side": side,
                        "faces": 100, "bytes": 5000, "fma": None})
        classes_of[mesh] = set(classes)
    return records, classes_of


hip_targets = [hip_target(s) for s in HIP_BONES]


def test_sid_of():
    assert sid_of("infraspinatus muscle") == "infraspinatus"
    assert sid_of("Long head of biceps brachii") == "long-head-of-biceps-brachii"
    assert sid_of("navicular bone of foot") == "navicular-bone-of-foot"


def test_strip_side():
    assert strip_side("left femur") == "femur"
    assert strip_side("long head of right biceps brachii") == "long head of biceps brachii"


def test_region_of():
    assert region_of("talus", {BONE, "FMA24491"}) == "lower-leg"
    assert region_of("soleus", {MUSCLE, "FMA22471"}) == "lower-leg"
    assert region_of("medial head of gastrocnemius", set()) == "lower-leg"
    assert region_of("scapula", {BONE}) == "shoulder"
    assert region_of("acromial part of deltoid", set()) == "shoulder"
    assert region_of("radius", {BONE}) == "arm"
    assert region_of("long head of triceps brachii", set()) == "arm"
    assert region_of("atlas", {BONE, "FMA9914", "FMA9915"}) == "neck"
    assert region_of("frontal bone", {BONE}) == "neck"
    assert region_of("splenius capitis", {MUSCLE}) == "neck"
    assert region_of("spinalis", {MUSCLE}) == "neck"
    assert region_of("spinalis thoracis", {MUSCLE}) == "trunk"
    assert region_of("fifth rib", {BONE, "FMA7574"}) == "trunk"
    assert region_of("manubrium", set()) == "trunk"
    assert region_of("diaphragm", {MUSCLE}) == "trunk"
    assert region_of("lateral rectus", {MUSCLE, "FMA49033"}) is None   # eye muscle
    assert region_of("adductor minimus", {MUSCLE}) is None
    assert region_of("stomach", set()) is None


def test_build_targets_sides_and_hip():
    # records: left+right talus, two unsided "external intercostal muscle", one left-only
    # "inferior oblique part of longus colli", left+right femur (hip owns it), left+right soleus
    records, classes_of = fixture([
        ("left talus", {BONE, "FMA24491"}),
        ("right talus", {BONE, "FMA24491"}),
        ("external intercostal muscle", {MUSCLE}),
        ("external intercostal muscle", {MUSCLE}),
        ("inferior oblique part of left longus colli", set()),
        ("left femur", {BONE}),
        ("right femur", {BONE}),
        ("left soleus", {MUSCLE, "FMA22471"}),
        ("right soleus", {MUSCLE, "FMA22471"}),
    ])
    targets, dropped = build_targets(records, classes_of, hip_targets)
    assert [t["sid"] for t in targets["lower-leg"] if not t.get("context")] == ["soleus", "talus"]
    assert [t["sid"] for t in targets["lower-leg"] if t.get("context")] == ["femur", "fibula", "patella", "tibia"]
    assert next(t for t in targets["trunk"] if t["sid"] == "external-intercostal")["midline"] is True
    assert any("longus colli" in d for d in dropped)
    assert all("femur" != t["sid"] or t.get("context") for ts in targets.values() for t in ts)


def test_build_targets_patterns_are_exact():
    # records: "long head of left biceps brachii" and "long head of right biceps brachii"
    records, classes_of = fixture([
        ("long head of left biceps brachii", set()),
        ("long head of right biceps brachii", set()),
    ])
    targets, _ = build_targets(records, classes_of, hip_targets)
    t = next(t for t in targets["arm"] if t["sid"] == "long-head-of-biceps-brachii")
    assert len(t["patterns"]) == 2
    assert any(re.search(p, "long head of left biceps brachii") for p in t["patterns"])
    assert not any(re.search(p, "left biceps brachii") for p in t["patterns"])
    assert not any(re.search(p, "long head of left biceps brachii tendon") for p in t["patterns"])


def test_write_structures_row():
    # targets: scapula (bone), teres-major (muscle), humerus (bone), and first-rib as a context target
    def target(sid, type_, english, context=False):
        t = {"sid": sid, "type": type_, "english": english, "patterns": [f"^{english.lower()}$"],
             "required": True, "source": "bp3d"}
        if context:
            t["context"] = True
        return t
    targets = [
        target("humerus", "bone", "Humerus"),
        target("scapula", "bone", "Scapula"),
        target("teres-major", "muscle", "Teres major"),
        target("first-rib", "bone", "First rib", context=True),
    ]
    text = write_structures("shoulder", targets, {"teres-major": {"depth": 2, "free": 0.09, "samples": 600}},
                            {"scapula": "Scapula"}, {"scapula": "FMA13394"}, "2026-11-15")
    assert '- {id: scapula, type: bone, english: Scapula, latin: Scapula, fma: "FMA13394", region: shoulder, depth: 4, also_in: [arm, neck]}' in text
    assert ('- {id: teres-major, type: muscle, english: Teres major, region: shoulder, depth: 2, depth_note: "Measured from '
            'the model on 2026-11-15: 9 percent of the rays from its surface meet no other part. See the header."}') in text
    assert text.startswith("#")
    assert "id: humerus" in text and "id: first-rib" not in text   # own targets only


def test_latin_lookup(tmp_path):
    # a TA2.csv with a byte order mark and these lines, each wholly inside double quotes:
    #   "1180;Humerus;Humerus;x"   "2;Soleus muscle;Musculus soleus;x"   "3;Atlas;Atlas;x"   "4;Atlas;Atlas [C I];x"
    path = tmp_path / "TA2.csv"
    lines = ["1180;Humerus;Humerus;x", "2;Soleus muscle;Musculus soleus;x", "3;Atlas;Atlas;x", "4;Atlas;Atlas [C I];x"]
    path.write_text("﻿" + "".join(f'"{line}"\n' for line in lines), encoding="utf-8")
    latin = read_latin(path)
    assert latin_for("humerus", latin) == "Humerus"
    assert latin_for("soleus", latin) == "Musculus soleus"      # found as "soleus muscle"
    assert latin_for("atlas", latin) is None                    # two different Latin terms: no Latin
    assert latin_for("talus", latin) is None


def test_latin_skips_rows_with_typos(tmp_path):
    path = tmp_path / "TA2.csv"
    lines = ["1265*1;First metacarpal bone;Os primum metarcapi;x", "2;Humerus;Humerus;x"]
    path.write_text("".join(f'"{line}"\n' for line in lines), encoding="utf-8")
    latin = read_latin(path)
    assert latin_for("first metacarpal bone", latin) is None
    assert latin_for("humerus", latin) == "Humerus"
