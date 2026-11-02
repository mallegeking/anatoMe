"""Render quick check pictures of the exported hip files.

Runs inside Blender, headless, from the repo root:
  tools/blender/blender -b --factory-startup -P pipeline/assets/render_check_blender.py -- \
      --glb models/hip.glb models/hip-z-anatomy.glb --out docs/phase0/export-check

Writes <out>-front.png and <out>-back.png, both looking at the right hip joint.
Muscles and tendons are hidden so you can see whether the ligaments, capsule,
labrum and bursae sit on the bones. Bones are white, everything else is coloured
by kind (see COLOURS).
Optional: --focus <sid>.<side> to aim at another structure, for example
"anterior-cruciate-ligament.r" for the right knee.
Uses Cycles on the CPU, because headless machines often have no GPU driver
for Workbench or EEVEE.
"""
import argparse
import sys
from pathlib import Path

import bpy
from mathutils import Vector

COLOURS = {
    "bone": (0.92, 0.90, 0.84, 1),
    "ligament": (0.15, 0.45, 0.95, 1),
    "capsule": (0.95, 0.80, 0.15, 1),
    "labrum": (0.10, 0.75, 0.30, 1),
    "bursa": (0.70, 0.25, 0.85, 1),
}
HIDDEN_KINDS = {"muscle", "tendon"}


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser(prog="render_check_blender.py")
    ap.add_argument("--glb", nargs="+", required=True)
    ap.add_argument("--out", required=True, help="path prefix, -front.png and -back.png are added")
    ap.add_argument("--focus", default="acetabular-labrum.r")
    ap.add_argument("--size", type=float, default=0.24, help="width of the view in metres")
    return ap.parse_args(argv)


def material(kind):
    mat = bpy.data.materials.new(kind)
    colour = COLOURS.get(kind, (0.5, 0.5, 0.5, 1))
    mat.diffuse_color = colour
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = colour
    bsdf.inputs["Roughness"].default_value = 0.6
    return mat


def find(sid_side):
    """The imported object whose extras match "<sid>.<side>"."""
    sid, _, side = sid_side.rpartition(".")
    for obj in bpy.data.objects:
        if obj.get("sid") == sid and obj.get("side") == side:
            return obj
    sys.exit(f"no object with sid {sid} and side {side}")


def world_centre(obj):
    corners = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
    return sum(corners, Vector()) / 8


def main():
    args = parse_args()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for path in args.glb:
        bpy.ops.import_scene.gltf(filepath=str(Path(path).resolve()))

    mats = {}
    for obj in bpy.data.objects:
        if obj.type != "MESH":
            continue
        kind = obj.get("kind", "")
        if kind in HIDDEN_KINDS:
            obj.hide_render = True
            continue
        if kind not in mats:
            mats[kind] = material(kind)
        obj.data.materials.clear()
        obj.data.materials.append(mats[kind])

    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    # Few samples, the denoiser and 600 px keep each PNG near 250 KB.
    scene.cycles.samples = 16
    scene.cycles.use_denoising = True
    scene.render.resolution_x = scene.render.resolution_y = 600
    scene.render.image_settings.color_mode = "RGB"
    scene.render.image_settings.color_depth = "8"
    scene.render.image_settings.compression = 100
    if scene.world is None:
        scene.world = bpy.data.worlds.new("World")
    scene.world.color = (0.25, 0.25, 0.28)
    scene.world.use_nodes = True
    scene.world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.25, 0.25, 0.28, 1)

    # Blender frame after import: left is +x, up is +z, the body faces -y.
    focus = world_centre(find(args.focus))
    cam_data = bpy.data.cameras.new("check")
    cam_data.type = "ORTHO"
    cam_data.ortho_scale = args.size
    cam = bpy.data.objects.new("check", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam

    # A sun that shines from behind the camera, so the visible side is lit.
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
    sun.data.energy = 3.0
    scene.collection.objects.link(sun)

    for view, offset in (("front", Vector((0, -1, 0))), ("back", Vector((0, 1, 0)))):
        cam.location = focus + offset
        cam.rotation_euler = (-offset).to_track_quat("-Z", "Y").to_euler()
        sun.rotation_euler = (-offset + Vector((0, 0, -0.5))).to_track_quat("-Z", "Y").to_euler()
        scene.render.filepath = str(Path(f"{args.out}-{view}.png").resolve())
        bpy.ops.render.render(write_still=True)
        print("RENDERED", scene.render.filepath)


main()
