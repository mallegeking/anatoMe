"""Tests for hipmatch.py. Run with: .venv/bin/pytest pipeline/assets/tests -q"""
import sys
from pathlib import Path

# Let the tests import hipmatch from the folder above.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from hipmatch import match_targets, side_of, summarize  # noqa: E402


def rec(english, mesh_name=None):
    """A small fake mesh record for tests."""
    name = mesh_name or english
    return {
        "source": "test",
        "mesh_name": name,
        "english": english,
        "side": side_of(name),
        "faces": 100,
        "bytes": 5000,
        "fma": None,
    }


def target(sid, patterns):
    """A small fake target for tests."""
    return {
        "sid": sid,
        "type": "muscle",
        "english": sid.replace("-", " "),
        "patterns": patterns,
        "required": True,
        "source": None,
    }


def test_side_of_handles_both_naming_styles():
    assert side_of("Gluteus maximus muscle.l") == "l"
    assert side_of("Right gluteus maximus") == "r"
    assert side_of("Sacrum") == ""


def test_match_targets_finds_left_and_right():
    recs = [rec("Left gluteus maximus"), rec("Right gluteus maximus"), rec("Left gluteus medius")]
    m = match_targets(recs, [target("gluteus-maximus", [r"gluteus maximus"])])
    assert {r["side"] for r in m["gluteus-maximus"]} == {"l", "r"}


def test_match_targets_does_not_confuse_similar_names():
    recs = [rec("Left adductor magnus"), rec("Left adductor minimus")]
    m = match_targets(recs, [target("adductor-magnus", [r"\badductor magnus\b"])])
    assert [r["english"] for r in m["adductor-magnus"]] == ["Left adductor magnus"]


def test_unmatched_target_maps_to_empty_list():
    assert match_targets([], [target("piriformis", ["piriformis"])])["piriformis"] == []


def test_summarize_counts_sides_and_faces():
    recs = [rec("Left piriformis"), rec("Right piriformis"), rec("Sacrum")]
    targets = [target("piriformis", ["piriformis"]), target("sacrum", ["^sacrum$"])]
    rows = summarize(match_targets(recs, targets), targets)
    assert (rows[0]["left"], rows[0]["right"], rows[0]["mid"], rows[0]["faces"]) == (1, 1, 0, 200)
    assert (rows[1]["left"], rows[1]["right"], rows[1]["mid"]) == (0, 0, 1)


def test_side_of_finds_side_word_in_the_middle_of_a_name():
    assert side_of("Long head of left biceps femoris") == "l"
    assert side_of("Short head of right biceps femoris") == "r"
    assert side_of("Leftover tissue") == ""
