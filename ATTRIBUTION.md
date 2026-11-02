# Attribution

anatoMe builds on the work of others. This page lists every source, its license and the credit text we show.

| Source | What we use | License | Credit text | Link |
| --- | --- | --- | --- | --- |
| BodyParts3D | 3D anatomy meshes | CC BY 4.0 | BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International | https://lifesciencedb.jp/bp3d/ |
| Z-Anatomy | 3D anatomy meshes | CC BY-SA 4.0 | Z-Anatomy - The libre 3D atlas of anatomy - CC-BY-SA 4.0 | https://www.z-anatomy.com/ |
| three.js | 3D rendering library | MIT | three.js, MIT License | https://threejs.org/ |
| Draco decoder | Mesh decompression | Apache 2.0, full text in `apps/web/public/draco/LICENSE` (shipped next to the decoder) | Draco, Apache License 2.0 | https://github.com/google/draco |
| Other npm libraries bundled into the app (React, React Three Fiber, drei, camera-controls, zustand and their helpers) | App framework and 3D helpers | MIT | The build writes every bundled library with its licence text to `third-party-licenses.txt` next to the app, linked from the Credits screen | `apps/web/dist/third-party-licenses.txt` after `npm run build` |

## Model files

These are the 3D model files in `models/`, where each one comes from, and its license. `models/manifest.json` holds the same list for the app.

| File | Source | License | What is in it |
| --- | --- | --- | --- |
| `models/hip.glb` | BodyParts3D | CC BY 4.0 | Hip region bones, muscles and the iliotibial tract (65 meshes) |
| `models/hip-z-anatomy.glb` | Z-Anatomy | CC BY-SA 4.0 | Hip region ligaments, joint capsule, acetabular labrum and bursae, plus four knee ligaments (34 meshes) |

Changes we made to the source meshes: we reduced the number of triangles, removed materials, texture coordinates and colours, and converted them to glTF with Draco compression. The Z-Anatomy meshes were also scaled, turned and moved (a separate fit for each side) so they sit on the BodyParts3D bones. Built by `pipeline/assets/build_region_blender.py`.

## A note on BodyParts3D licensing

Older BodyParts3D OBJ file headers mention CC BY-SA 2.1 Japan. The license page of the Database Center for Life Science (updated 2025/02/27) supersedes those headers. It states CC BY 4.0, so we follow the license page.

## How licenses apply in this repository

- Code is MIT, see `LICENSE`.
- Our own data is CC BY 4.0, see `data/LICENSE`.
- Each mesh file has its own license, recorded in `models/manifest.json` and explained in `models/LICENSE`.
- Short quotations in the `says` fields under `data/` keep the license of their source, listed in `data/citations.yaml`.

## Note on React Three Fiber

The npm package of `@react-three/fiber` ships no license file, so `third-party-licenses.txt` names it as MIT without the text. Its license is the MIT License, Copyright (c) 2019-2025 Poimandres, see https://github.com/pmndrs/react-three-fiber/blob/master/LICENSE.
