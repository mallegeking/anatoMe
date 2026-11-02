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
```

Open the viewer, drag to turn the model and tap a structure to see its name. Add `?perf=1` to the address to see how long the page took to become usable.

The build works from any folder. Copy the contents of `apps/web/dist/` to any web server.

## License

- Code is MIT, see [LICENSE](LICENSE).
- Our own data is CC BY 4.0, see [data/LICENSE](data/LICENSE).
- 3D models are licensed per file, see [models/LICENSE](models/LICENSE).
- Credit texts for all sources are in [ATTRIBUTION.md](ATTRIBUTION.md).
