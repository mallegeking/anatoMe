"""Tests for meshfit.py. Run with: .venv/bin/pytest pipeline/assets/tests -q"""
import math
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from meshfit import (  # noqa: E402
    apply_similarity,
    femoral_head_points,
    fit_similarity,
    fit_sphere,
    icp_similarity,
    read_obj,
    rotation_about_z,
    similarity_to_rows,
)


def close(a, b, tol=1e-6):
    return all(abs(x - y) <= tol for x, y in zip(a, b))


def sphere_points(centre, radius, n=400, seed=1):
    """Points spread over a sphere surface."""
    rnd = random.Random(seed)
    pts = []
    for _ in range(n):
        z = rnd.uniform(-1, 1)
        a = rnd.uniform(0, 2 * math.pi)
        r = math.sqrt(1 - z * z)
        pts.append((centre[0] + radius * r * math.cos(a),
                    centre[1] + radius * r * math.sin(a),
                    centre[2] + radius * z))
    return pts


def test_fit_sphere_recovers_centre_and_radius():
    c, r = fit_sphere(sphere_points((0.1, -0.05, 0.8), 0.024))
    assert close(c, (0.1, -0.05, 0.8), 1e-9)
    assert abs(r - 0.024) < 1e-9


def test_fit_sphere_works_on_a_cap_only():
    # The femoral head is only partly a ball, so a cap must be enough.
    cap = [p for p in sphere_points((0.0, 0.0, 0.0), 0.02, 2000) if p[2] > 0.005]
    c, r = fit_sphere(cap)
    assert close(c, (0, 0, 0), 1e-9) and abs(r - 0.02) < 1e-9


def test_fit_similarity_recovers_a_known_transform():
    rnd = random.Random(2)
    src = [(rnd.uniform(-1, 1), rnd.uniform(-1, 1), rnd.uniform(-1, 1)) for _ in range(50)]
    rot = rotation_about_z(0.3)
    truth = (1.07, rot, (0.01, -0.09, 0.06))
    dst = [apply_similarity(truth, p) for p in src]
    s, rot2, t = fit_similarity(src, dst)
    assert abs(s - 1.07) < 1e-9
    assert all(close(a, b, 1e-9) for a, b in zip(rot, rot2))
    assert close(t, (0.01, -0.09, 0.06), 1e-9)


def test_fit_similarity_identity_for_equal_sets():
    pts = [(0, 0, 0), (1, 0, 0), (0, 1, 0), (0, 0, 1)]
    s, rot, t = fit_similarity(pts, pts)
    assert abs(s - 1) < 1e-12 and close(t, (0, 0, 0), 1e-12)
    assert all(close(row, ident, 1e-12) for row, ident in zip(rot, [(1, 0, 0), (0, 1, 0), (0, 0, 1)]))


def test_icp_finds_shift_without_correspondences():
    # The target is a dense sphere, the moving set is a sparse, shifted copy.
    target = sphere_points((0, 0, 0), 0.05, 3000, seed=3)
    truth = (1.0, rotation_about_z(0.0), (0.004, -0.003, 0.002))
    moving = [apply_similarity(truth, p) for p in sphere_points((0, 0, 0), 0.05, 200, seed=4)]

    def nearest(p):
        return min(target, key=lambda q: (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2)

    start = (1.0, rotation_about_z(0.0), (0.0, 0.0, 0.0))
    fit, rms = icp_similarity(moving, nearest, start, iterations=30, keep_fraction=1.0)
    centre = apply_similarity(fit, (0.004, -0.003, 0.002))  # where the moved centre lands
    assert math.dist(centre, (0, 0, 0)) < 0.001
    assert rms[-1] < rms[0]


def test_similarity_to_rows_is_a_4x4_matrix():
    rows = similarity_to_rows((2.0, rotation_about_z(0.0), (1, 2, 3)))
    assert rows == [[2.0, 0.0, 0.0, 1], [0.0, 2.0, 0.0, 2], [0.0, 0.0, 2.0, 3], [0, 0, 0, 1]]


def toy_femur(side):
    """A ball on top of a shaft, placed like a left or right femur (left is +x)."""
    sign = 1 if side == "l" else -1
    head_centre = (sign * 0.08, 0.0, 0.85)
    ball = sphere_points(head_centre, 0.024, 600, seed=5)
    # Shaft runs from the lateral side of the head down to the knee.
    shaft = [(sign * 0.13, 0.0, 0.84 - i * 0.004) for i in range(100)]
    shaft += [(sign * 0.13 + 0.01, 0.01, 0.84 - i * 0.004) for i in range(100)]
    return ball + shaft, head_centre


def test_femoral_head_points_finds_the_ball_on_both_sides():
    for side in ("l", "r"):
        pts, truth = toy_femur(side)
        head, centre, radius = femoral_head_points(pts, side)
        assert math.dist(centre, truth) < 1e-6, side
        assert abs(radius - 0.024) < 1e-6
        assert len(head) > 300


def test_read_obj_scales_and_keeps_axes(tmp_path):
    f = tmp_path / "t.obj"
    f.write_text("# note\nv 1000 2000 3000\nv 0 0 0\nvn 0 0 1\nv 0 1000 0\nf 1//1 2//1 3//1 \n")
    verts, faces = read_obj(f, 0.001)
    assert verts == [(1.0, 2.0, 3.0), (0.0, 0.0, 0.0), (0.0, 1.0, 0.0)]
    assert faces == [(0, 1, 2)]
