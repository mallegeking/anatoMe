"""Build one region's mesh file (GLB with Draco) from BodyParts3D or Z-Anatomy.

Runs inside Blender, headless, from the repo root:
  tools/blender/blender -b --factory-startup -P pipeline/assets/build_region_blender.py -- \
      --region hip --source bp3d --out models/hip.glb
  tools/blender/blender -b --factory-startup -P pipeline/assets/build_region_blender.py -- \
      --region hip --source z-anatomy --out models/hip-z-anatomy.glb

What it does:
  1. Reads regions/<region>.json and picks the targets whose "source" matches --source.
     With --whole-region (Z-Anatomy only) it instead takes every target Z-Anatomy has.
  2. Finds the meshes for those targets with the inventories from Task 3
     (sources/bp3d-inventory.jsonl, sources/z-anatomy-inventory.jsonl) and hipmatch.py.
  3. Builds one Blender object per target and side, in metres.
  4. For Z-Anatomy parts that sit on BodyParts3D bones, moves them onto the BodyParts3D
     skeleton with a per-side fit (see align_z_anatomy_side) and prints how well the
     hip joints line up. If either hip joint is off by more than 5 mm, nothing is
     written and the script says to use --whole-region instead.
  5. Strips materials, UVs and colours, decimates, sets the glTF extras
     (sid, label, side, kind, source) and exports a Y up GLB with Draco.

Needs the inventories, so run bp3d_inventory.py and za_inventory_blender.py first.
"""
import argparse
import json
import math
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix
from mathutils.bvhtree import BVHTree

HERE = Path(__file__).resolve().parent if "__file__" in globals() else Path.cwd() / "pipeline" / "assets"
sys.path.insert(0, str(HERE))
from hipmatch import match_targets  # noqa: E402
from meshfit import (  # noqa: E402
    apply_similarity,
    femoral_head_points,
    icp_similarity,
    read_obj,
    similarity_to_rows,
)

ROOT = HERE.parents[1]
BP3D_OBJ_DIR = ROOT / "sources" / "bp3d" / "isa_BP3D_4.0_obj_99"
ZA_BLEND = ROOT / "sources" / "z-anatomy" / "Z-Anatomy" / "Startup.blend"
INVENTORY = {
    "bp3d": ROOT / "sources" / "bp3d-inventory.jsonl",
    "z-anatomy": ROOT / "sources" / "z-anatomy-inventory.jsonl",
}

# The only Z-Anatomy collections we may read (same list as za_inventory_blender.py).
# This keeps the inner ear, kidney and brain white matter parts out for good.
ZA_COLLECTIONS = ["1: Skeletal system", "3: Joints", "4: Muscular system"]

# Decimation. Muscles and the floor are free-muscles' starting values (build-anatomy.py).
# Bones keep 60 percent, not free-muscles' 12, because BodyParts3D bones start out
# light (the hip bone has 2,374 triangles) and looked too coarse for a learning viewer.
# The whole hip region still stays far under TRIANGLE_BUDGET.
BONE_RATIO, OTHER_RATIO, MIN_FACES = 0.6, 0.14, 120
TRIANGLE_BUDGET = 150_000  # for all files of the region together

# Rough Z-Anatomy to BodyParts3D move from docs/phase0/mesh-source-decision.md
# (scale 1.0139, then shift). The per-side fit starts from here.
GLOBAL_START = (1.0139, [(1.0, 0.0, 0.0), (0.0, 1.0, 0.0), (0.0, 0.0, 1.0)], (0.0009, -0.0915, -0.0635))
MAX_HIP_JOINT_ERROR = 0.005  # 5 mm, from controller ruling R9


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser(prog="build_region_blender.py")
    ap.add_argument("--region", required=True)
    ap.add_argument("--source", required=True, choices=["bp3d", "z-anatomy"])
    ap.add_argument("--out", required=True)
    ap.add_argument("--whole-region", action="store_true",
                    help="Z-Anatomy only: export every target Z-Anatomy has, unaligned")
    args = ap.parse_args(argv)
    if args.whole_region and args.source != "z-anatomy":
        ap.error("--whole-region only works with --source z-anatomy")
    return args


def load_records(source):
    path = INVENTORY[source]
    if not path.exists():
        sys.exit(f"missing {path}, run the inventory script for {source} first")
    with open(path, encoding="utf-8") as f:
        return [json.loads(line) for line in f]


def load_targets(region):
    return json.loads((HERE / "regions" / f"{region}.json").read_text(encoding="utf-8"))["targets"]


def pick_meshes(region, source, whole_region):
    """Return [(target, [records])] for the targets this run exports."""
    targets = load_targets(region)
    if not whole_region:
        targets = [t for t in targets if t["source"] == source]
    matches = match_targets(load_records(source), targets)
    picked = []
    for t in targets:
        found = matches[t["sid"]]
        if not found:
            if whole_region:
                continue  # Z-Anatomy simply does not have this one
            sys.exit(f"target {t['sid']} has source {source} but no mesh matched")
        picked.append((t, found))
    return picked


# --- Getting meshes into Blender, in metres -----------------------------------


def import_bp3d(record):
    """Import one BodyParts3D OBJ as a Blender mesh in metres.

    The OBJ files are in millimetres with left = +x and up = +z, which is already
    Blender's own frame. So we ask the importer for forward = +y and up = +z,
    which means "do not turn anything".
    """
    before = set(bpy.data.objects)
    bpy.ops.wm.obj_import(
        filepath=str(BP3D_OBJ_DIR / f"{record['mesh_name']}.obj"),
        global_scale=0.001,
        forward_axis="Y",
        up_axis="Z",
        use_split_objects=False,
        use_split_groups=False,
    )
    new = [o for o in bpy.data.objects if o not in before]
    assert len(new) == 1, f"{record['mesh_name']}: expected one object, got {len(new)}"
    obj = new[0]
    mesh = obj.data
    mesh.transform(obj.matrix_world)  # bake any import transform into the vertices
    bpy.data.objects.remove(obj)  # we only need the mesh, build_objects makes the object
    return mesh


def za_allowed_names():
    names = set()
    for coll in ZA_COLLECTIONS:
        names.update(o.name for o in bpy.data.collections[coll].all_objects)
    return names


def za_world_mesh(name, allowed, depsgraph):
    """A copy of a Z-Anatomy object as it looks in the scene: modifiers applied, in world space."""
    if name not in allowed:
        sys.exit(f"{name} is not in the allowed Z-Anatomy collections")
    obj = bpy.data.objects[name]
    mesh = bpy.data.meshes.new_from_object(obj.evaluated_get(depsgraph))
    mesh.transform(obj.matrix_world)
    if obj.matrix_world.determinant() < 0:
        mesh.flip_normals()  # left side parts are mirrored copies, keep their faces pointing out
    return mesh


def mesh_points(mesh):
    return [tuple(v.co) for v in mesh.vertices]


def mesh_bvh(meshes):
    """One BVH tree for fast closest-point lookups over several meshes."""
    verts, polys = [], []
    for me in meshes:
        base = len(verts)
        verts.extend(tuple(v.co) for v in me.vertices)
        polys.extend([base + i for i in p.vertices] for p in me.polygons)
    return BVHTree.FromPolygons(verts, polys)


def bvh_from_obj(paths):
    verts, faces = [], []
    for path in paths:
        v, f = read_obj(path, 0.001)
        base = len(verts)
        verts.extend(v)
        faces.extend(tuple(base + i for i in tri) for tri in f)
    return BVHTree.FromPolygons(verts, faces), verts


# --- Lining Z-Anatomy up with BodyParts3D -------------------------------------


def align_z_anatomy_side(za_points, bp3d_tree):
    """Per-side similarity fit (scale, rotation, shift) from Z-Anatomy onto BodyParts3D.

    The two sources have different vertices, so there are no known point pairs.
    We use ICP: pair every Z-Anatomy vertex with the closest point on the BodyParts3D
    surface, fit, and repeat. It starts from the rough global move in the decision doc.
    """
    def nearest(p):
        return tuple(bp3d_tree.find_nearest(p)[0])
    return icp_similarity(za_points, nearest, GLOBAL_START, iterations=60, keep_fraction=0.9, tol=1e-8)


def mean_surface_distance(points, tree):
    return sum(tree.find_nearest(p)[3] for p in points) / len(points)


def hip_joint_report(side, sim, za_hip, za_femur, bp_hip_tree, bp_femur_tree, bp_femur_points):
    """How well one hip joint lines up after moving Z-Anatomy with `sim`.

    Head centre error: a sphere is fitted to the femoral head in each source
    (meshfit.femoral_head_points) and we measure the distance between the two centres.
    Femoral head and acetabulum distances: the mean distance from the moved Z-Anatomy
    vertices to the closest point on the BodyParts3D surface.
    """
    _, bp_centre, bp_radius = femoral_head_points(bp_femur_points, side)
    za_femur_moved = [apply_similarity(sim, p) for p in za_femur]
    za_head, za_centre, za_radius = femoral_head_points(za_femur_moved, side)
    # The acetabulum is the part of the hip bone that wraps around the femoral head.
    za_hip_moved = [apply_similarity(sim, p) for p in za_hip]
    acetabulum = [p for p in za_hip_moved if math.dist(p, za_centre) < za_radius + 0.008]
    return {
        "head_centre_mm": 1000 * math.dist(bp_centre, za_centre),
        "head_radius_mm": (1000 * bp_radius, 1000 * za_radius),
        "head_nn_mm": 1000 * mean_surface_distance(za_head, bp_femur_tree),
        "head_points": len(za_head),
        "acetabulum_nn_mm": 1000 * mean_surface_distance(acetabulum, bp_hip_tree),
        "acetabulum_points": len(acetabulum),
    }


def fit_both_sides(region, depsgraph, allowed):
    """Fit Z-Anatomy onto BodyParts3D for each side.

    Returns ({side: 4x4 Matrix}, True if both hip joints are within MAX_HIP_JOINT_ERROR).
    """
    bones = [t for t in load_targets(region) if t["sid"] in ("hip-bone", "femur")]
    found = match_targets(load_records("bp3d"), bones)
    matrices, ok = {}, True
    for side in ("l", "r"):
        bp_hip = [r for r in found["hip-bone"] if r["side"] == side][0]
        bp_fem = [r for r in found["femur"] if r["side"] == side][0]
        hip_tree, _ = bvh_from_obj([BP3D_OBJ_DIR / f"{bp_hip['mesh_name']}.obj"])
        fem_tree, fem_points = bvh_from_obj([BP3D_OBJ_DIR / f"{bp_fem['mesh_name']}.obj"])
        both_tree, _ = bvh_from_obj([BP3D_OBJ_DIR / f"{r['mesh_name']}.obj" for r in (bp_hip, bp_fem)])

        za_hip_mesh = za_world_mesh(f"Hip bone.{side}", allowed, depsgraph)
        za_fem_mesh = za_world_mesh(f"Femur.{side}", allowed, depsgraph)
        za_hip, za_fem = mesh_points(za_hip_mesh), mesh_points(za_fem_mesh)
        bpy.data.meshes.remove(za_hip_mesh)
        bpy.data.meshes.remove(za_fem_mesh)

        sim, rms = align_z_anatomy_side(za_hip + za_fem, both_tree)
        s, rot, t = sim
        angle = math.degrees(math.acos(max(-1.0, min(1.0, (rot[0][0] + rot[1][1] + rot[2][2] - 1) / 2))))
        print(f"ALIGN side {side}: ICP {len(rms)} rounds, rms {1000 * rms[0]:.1f} mm -> {1000 * rms[-1]:.1f} mm, "
              f"scale {s:.4f}, rotation {angle:.2f} deg, shift ({t[0]:+.4f}, {t[1]:+.4f}, {t[2]:+.4f}) m")
        for name, used in (("global start", GLOBAL_START), ("per-side fit", sim)):
            rep = hip_joint_report(side, used, za_hip, za_fem, hip_tree, fem_tree, fem_points)
            print(f"HIPJOINT side {side} {name:12}: head centre error {rep['head_centre_mm']:.1f} mm, "
                  f"head radius bp3d {rep['head_radius_mm'][0]:.1f} / z-anatomy {rep['head_radius_mm'][1]:.1f} mm, "
                  f"femoral head mean distance {rep['head_nn_mm']:.1f} mm ({rep['head_points']} points), "
                  f"acetabulum mean distance {rep['acetabulum_nn_mm']:.1f} mm ({rep['acetabulum_points']} points)")
            if used is sim and rep["head_centre_mm"] > 1000 * MAX_HIP_JOINT_ERROR:
                ok = False
        matrices[side] = Matrix(similarity_to_rows(sim))
    return matrices, ok


# --- Cleaning, decimating, exporting ------------------------------------------


def join_meshes(meshes, name):
    """Merge several meshes into one new mesh."""
    bm = bmesh.new()
    for me in meshes:
        bm.from_mesh(me)
    out = bpy.data.meshes.new(name)
    bm.to_mesh(out)
    bm.free()
    return out


def triangles(mesh):
    mesh.calc_loop_triangles()
    return len(mesh.loop_triangles)


def clean_and_decimate(obj, ratio):
    """Drop materials, UVs and colours, then decimate (never below MIN_FACES)."""
    me = obj.data
    me.materials.clear()
    for uv in list(me.uv_layers):
        me.uv_layers.remove(uv)
    for name in [a.name for a in me.color_attributes]:
        me.color_attributes.remove(me.color_attributes[name])
    tris = triangles(me)
    r = max(ratio, min(1.0, MIN_FACES / tris))
    if r < 1.0:
        mod = obj.modifiers.new("decimate", "DECIMATE")
        mod.ratio = r
        dg = bpy.context.evaluated_depsgraph_get()
        new = bpy.data.meshes.new_from_object(obj.evaluated_get(dg))
        obj.modifiers.clear()
        old, obj.data = obj.data, new
        bpy.data.meshes.remove(old)
        me = new
    if me.has_custom_normals:
        with bpy.context.temp_override(object=obj, active_object=obj, selected_objects=[obj]):
            bpy.ops.mesh.customdata_custom_splitnormals_clear()
    me.shade_smooth()


def build_objects(picked, source, mesh_for_record, side_matrix):
    """One object per target and side, with the glTF extras set."""
    scene_coll = bpy.context.scene.collection
    built = []
    for target, records in picked:
        sides = sorted({r["side"] for r in records})
        for side in sides:
            parts = [mesh_for_record(r) for r in records if r["side"] == side]
            name = f"{target['sid']}.{side}" if side else target["sid"]
            mesh = join_meshes(parts, name)
            for me in parts:
                bpy.data.meshes.remove(me)
            if side_matrix is not None:
                if side not in side_matrix:
                    sys.exit(f"{name}: no alignment for side '{side}', only left and right are fitted")
                mesh.transform(side_matrix[side])
            obj = bpy.data.objects.new(name, mesh)
            scene_coll.objects.link(obj)
            clean_and_decimate(obj, BONE_RATIO if target["type"] == "bone" else OTHER_RATIO)
            # These become glTF extras, which three.js shows as userData.
            obj["sid"] = target["sid"]
            obj["label"] = target["english"]
            obj["side"] = side
            obj["kind"] = target["type"]
            obj["source"] = source
            built.append(obj)
    return built


def report(objs):
    stats = {}
    for o in objs:
        s = stats.setdefault(o["kind"], [0, 0])
        s[0] += 1
        s[1] += triangles(o.data)
    for kind, (n, f) in sorted(stats.items()):
        print(f"{kind:10s} {n:4d} meshes {f:7d} faces")
    total = sum(f for _, f in stats.values())
    print(f"TOTAL {sum(n for n, _ in stats.values())} meshes {total} faces")
    if total > TRIANGLE_BUDGET:
        print(f"WARNING over the {TRIANGLE_BUDGET} triangle budget for the region")


def clear_scene_properties(scene):
    """Drop the scene's own custom properties so they do not become glTF scene extras.

    Startup.blend carries add-on settings (MeasureIt, stored views, theme flags).
    Object properties, which hold our mesh extras, are not touched.
    """
    for key in list(scene.keys()):
        del scene[key]
    system = scene.bl_system_properties_get()
    if system is not None:
        for key in list(system.keys()):
            del system[key]


def export(objs, out):
    clear_scene_properties(bpy.context.scene)
    for o in bpy.context.view_layer.objects:
        o.select_set(False)
    for o in objs:
        o.select_set(True)
    out.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(out),
        export_format="GLB",
        use_selection=True,
        export_extras=True,
        export_yup=True,
        export_apply=False,  # every modifier is already applied by hand
        export_materials="NONE",
        export_vertex_color="NONE",
        export_texcoords=False,
        export_normals=True,
        export_animations=False,
        export_cameras=False,
        export_lights=False,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=10,
        export_draco_position_quantization=14,
        export_draco_normal_quantization=8,
    )
    print(f"WROTE {out.relative_to(ROOT) if out.is_relative_to(ROOT) else out} ({out.stat().st_size} bytes)")


def main():
    args = parse_args()
    out = Path(args.out)
    out = out if out.is_absolute() else ROOT / out
    picked = pick_meshes(args.region, args.source, args.whole_region)

    if args.source == "bp3d":
        bpy.ops.wm.read_factory_settings(use_empty=True)
        objs = build_objects(picked, "bp3d", import_bp3d, None)
    else:
        bpy.ops.wm.open_mainfile(filepath=str(ZA_BLEND))
        depsgraph = bpy.context.evaluated_depsgraph_get()
        allowed = za_allowed_names()
        matrices = None
        if not args.whole_region:
            matrices, ok = fit_both_sides(args.region, depsgraph, allowed)
            if not ok:
                print(f"ALIGNMENT TOO LOOSE: a hip joint is off by more than {1000 * MAX_HIP_JOINT_ERROR:.0f} mm. "
                      "Nothing written. Export the whole region from Z-Anatomy with --whole-region instead.")
                sys.exit(1)
            print(f"ALIGNMENT OK: both hip joints within {1000 * MAX_HIP_JOINT_ERROR:.0f} mm")
        objs = build_objects(picked, "z-anatomy",
                             lambda r: za_world_mesh(r["mesh_name"], allowed, depsgraph), matrices)

    report(objs)
    export(objs, out)


main()
