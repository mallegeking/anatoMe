"""Tests for meshrules.py. Run with: .venv/bin/pytest pipeline/assets/tests -q"""
import sys
from pathlib import Path

# Let the tests import meshrules from the folder above.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from meshrules import cap_for, decimate_ratio, depth_from_free  # noqa: E402


def test_depth_from_free():
    assert [depth_from_free(f) for f in (1.0, 0.34, 0.20)] == [1, 1, 1]
    assert [depth_from_free(f) for f in (0.19, 0.06, 0.05)] == [2, 2, 2]
    assert [depth_from_free(f) for f in (0.04, 0.0)] == [3, 3]


def test_decimate_ratio():
    assert decimate_ratio(2374, 0.6, None) == 0.6                 # the hip bone, no cap: as before
    assert decimate_ratio(500, 0.14, None) == 120 / 500           # the 120 face floor, as before
    assert decimate_ratio(100, 0.14, None) == 1.0                 # already under the floor
    assert decimate_ratio(223652, 0.14, 2000) == 2000 / 223652    # external oblique, capped
    assert decimate_ratio(5000, 0.14, 2000) == 0.14               # 700 faces, under the cap
    assert decimate_ratio(100, 0.14, 2000) == 1.0


def test_cap_for():
    assert cap_for("bone", 400, 1000) == 1000
    assert cap_for("muscle", 400, 1000) == 400
    assert cap_for("tendon", 400, 1000) == 400
    assert cap_for("bone", 2000, None) == 2000    # a region file without a bone cap builds as before
    assert cap_for("bone", None, None) is None    # the hip: no cap at all
