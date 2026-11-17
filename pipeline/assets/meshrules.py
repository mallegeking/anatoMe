"""Small mesh rules shared by the build script and the generator.

Standard library only, so Blender's bundled Python can import it too.
"""


def depth_from_free(free: float) -> int:
    """Layer of a soft part from `free`, the share of rays from its surface that meet no other part.

    0.20 or more is the outer layer (1), 0.05 or more the middle layer (2), less the deep layer (3).
    Bones are 4 and are not measured.
    """
    if free >= 0.20:
        return 1
    if free >= 0.05:
        return 2
    return 3


def decimate_ratio(tris: int, ratio: float, cap: int | None, min_faces: int = 120) -> float:
    """The ratio the decimate modifier gets for a mesh with `tris` triangles.

    Without a cap this is the old rule: `ratio`, but never under `min_faces` faces.
    With a cap, a result that would keep more than `cap` faces is lowered to `cap / tris`.
    """
    r = max(ratio, min(1.0, min_faces / tris))
    if cap is not None and r > cap / tris:
        r = cap / tris
    return r


def cap_for(kind: str, cap: int | None, bone_cap: int | None) -> int | None:
    """The triangle cap for one mesh: the bone cap for a bone when there is one, else the general cap."""
    if kind == "bone" and bone_cap is not None:
        return bone_cap
    return cap
