"""Tests for bp3d_inventory.py. Run with: .venv/bin/pytest pipeline/assets/tests -q"""
import json
import re
import sys
from pathlib import Path

# Let the tests import bp3d_inventory from the folder above.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from bp3d_inventory import bounds_centre_x, side_by_position, target_patterns  # noqa: E402

HEADER = """#
# File ID : FJ1469
# Concept ID : FMA37389
# English name : Left flexor pollicis brevis
# Bounds(mm): (-301.249900,-153.157000,766.555200)-(-256.014300,-125.253100,794.075800)
#
v 1.0 2.0 3.0
"""


def record(english, side):
    return {"source": "bp3d", "mesh_name": "FJ1", "english": english, "side": side,
            "faces": 10, "bytes": 100, "fma": "FMA1"}


def test_bounds_centre_x(tmp_path):
    path = tmp_path / "FJ1469.obj"
    path.write_text(HEADER, encoding="utf-8")
    assert bounds_centre_x(path) == (-301.2499 + -256.0143) / 2


def test_bounds_centre_x_without_a_bounds_line(tmp_path):
    path = tmp_path / "FJ1.obj"
    path.write_text("# English name : Left femur\nv 1.0 2.0 3.0\n", encoding="utf-8")
    assert bounds_centre_x(path) is None


# The patterns of one target, as a target list in pipeline/assets/regions/ writes them.
FPB = [re.compile(p, re.IGNORECASE) for p in
       ["^left\\ flexor\\ pollicis\\ brevis$", "^right\\ flexor\\ pollicis\\ brevis$"]]


def test_side_by_position(capsys):
    # In BodyParts3D left is x > 0.
    left_on_right = record("left flexor pollicis brevis", "l")
    fixed = side_by_position(left_on_right, -278.6, FPB)
    assert fixed["side"] == "r"
    assert fixed["english"] == "left flexor pollicis brevis"   # the name stays as the source has it

    right_on_left = record("right flexor pollicis brevis", "r")
    assert side_by_position(right_on_left, 278.6, FPB)["side"] == "l"

    agreeing = record("right flexor pollicis brevis", "r")
    assert side_by_position(agreeing, -280.0, FPB) == agreeing

    unsided = record("external intercostal muscle", "")
    assert side_by_position(unsided, -40.0, FPB) == unsided
    assert side_by_position(unsided, 40.0, FPB) == unsided

    out = capsys.readouterr().out.splitlines()
    assert out == [
        "side corrected: FJ1 'left flexor pollicis brevis' is named l but lies at x = -279 mm, side set to r",
        "side corrected: FJ1 'right flexor pollicis brevis' is named r but lies at x = 279 mm, side set to l",
    ]


def test_side_by_position_leaves_a_record_no_target_matches(capsys):
    # "Right ventricle" names a part of the heart, not a side of the body. No region asks for it.
    heart = record("cavity of right ventricle", "r")
    assert side_by_position(heart, 30.0, FPB) is heart
    assert capsys.readouterr().out == ""


def test_target_patterns(tmp_path):
    (tmp_path / "a.json").write_text(json.dumps({"targets": [
        {"sid": "x", "patterns": ["^left\\ x$", "^right\\ x$"]}]}), encoding="utf-8")
    (tmp_path / "b.json").write_text(json.dumps({"targets": [
        {"sid": "y", "patterns": ["^y$"]}]}), encoding="utf-8")
    patterns = target_patterns(tmp_path)
    assert sorted(p.pattern for p in patterns) == ["^left\\ x$", "^right\\ x$", "^y$"]
    assert all(p.flags & re.IGNORECASE for p in patterns)
