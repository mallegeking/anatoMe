# anatoMe

anatoMe is an educational tool for understanding how the body moves. It is not a diagnostic tool and it is not medical advice. If you have a health concern, please talk to a qualified health professional.

anatoMe is a free, open-source, browser-based 3D anatomy explorer. It starts with the hip.

## What it does today

The project is in its Phase 0 spike. This phase checks that the data pipeline and the 3D viewer work end to end before we build the full explorer.

## How to run it

You need Node.js 22 or newer.

```bash
npm install
npm run dev      # starts the viewer, open the address it prints
npm run build    # writes the finished site to apps/web/dist/
npm test         # runs all the tests
npm run e2e -w apps/web  # opens the built app in a browser (run npm run build first)
npm run validate      # checks the knowledge base in data/
npm run check-models  # checks the meshes in models/ against data/
```

The Python tests for the mesh pipeline need pytest in a local virtual environment:

```bash
python3 -m venv .venv
.venv/bin/pip install pytest
npm run test:py
```

Open the viewer, drag to turn the model and tap a structure to see its name. Add `?perf=1` to the address to see how long the page took to become usable.

The build works from any folder. Copy the contents of `apps/web/dist/` to any web server.

### Rebuilding the models

You only need this to change the meshes. The finished files in `models/` are committed, so the app and the checks work without it. Run these from the repo root:

```bash
bash pipeline/get-blender.sh      # downloads Blender into tools/blender/
bash pipeline/fetch-sources.sh    # downloads BodyParts3D and Z-Anatomy into sources/ and checks them
.venv/bin/python pipeline/assets/bp3d_inventory.py
tools/blender/blender -b --factory-startup -P pipeline/assets/za_inventory_blender.py
tools/blender/blender -b --factory-startup -P pipeline/assets/build_region_blender.py -- \
    --region hip --source bp3d --out models/hip.glb
tools/blender/blender -b --factory-startup -P pipeline/assets/build_region_blender.py -- \
    --region hip --source z-anatomy --out models/hip-z-anatomy.glb
```

Why each mesh comes from the source it does is explained in [docs/phase0/mesh-source-decision.md](docs/phase0/mesh-source-decision.md).

## License

- Code is MIT, see [LICENSE](LICENSE).
- Our own data is CC BY 4.0, see [data/LICENSE](data/LICENSE).
- 3D models are licensed per file, see [models/LICENSE](models/LICENSE).
- Credit texts for all sources are in [ATTRIBUTION.md](ATTRIBUTION.md).
