#!/usr/bin/env bash
# Downloads the raw anatomy sources into sources/ and unpacks them.
#   bash pipeline/fetch-sources.sh            checks every file against pipeline/sources.sha256
#   bash pipeline/fetch-sources.sh --record   writes pipeline/sources.sha256 instead
# Safe to run again. Files that are already there are not downloaded twice.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SUMS="$ROOT/pipeline/sources.sha256"
BP3D="$ROOT/sources/bp3d"
ZANAT="$ROOT/sources/z-anatomy"
BP3D_URL="https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST"
ZANAT_REPO="https://github.com/Z-Anatomy/Models-of-human-anatomy"

MODE="check"
case "${1:-}" in
  "") ;;
  --record) MODE="record" ;;
  *) echo "Usage: $0 [--record]" >&2; exit 2 ;;
esac

mkdir -p "$BP3D" "$ZANAT"

# BodyParts3D: the mesh zip plus the part lists
BP3D_FILES=(
  isa_BP3D_4.0_obj_99.zip
  isa_parts_list_e.txt
  isa_element_parts.txt
  partof_parts_list_e.txt
  partof_element_parts.txt
)
for f in "${BP3D_FILES[@]}"; do
  if [ ! -s "$BP3D/$f" ]; then
    echo "Downloading $f ..."
    # The server drops big transfers now and then, so resume until it is done
    tries=0
    until curl -fsSL -C - -o "$BP3D/$f.part" "$BP3D_URL/$f"; do
      tries=$((tries + 1))
      [ "$tries" -lt 30 ] || { echo "Giving up on $f" >&2; exit 1; }
      echo "Transfer interrupted, resuming ($tries) ..."
      sleep 2
    done
    mv "$BP3D/$f.part" "$BP3D/$f"
  fi
done

# Z-Anatomy: shallow clone into a temp folder, keep only the three files we need
ZANAT_FILES=(Z-Anatomy.zip TA2.csv License.txt)
need_clone=0
for f in "${ZANAT_FILES[@]}"; do
  [ -s "$ZANAT/$f" ] || need_clone=1
done
if [ "$need_clone" = 1 ]; then
  TMP="$(mktemp -d)"
  trap 'rm -rf "$TMP"' EXIT
  echo "Cloning Z-Anatomy (shallow) ..."
  git clone --depth 1 "$ZANAT_REPO" "$TMP/repo"
  for f in "${ZANAT_FILES[@]}"; do
    cp "$TMP/repo/$f" "$ZANAT/$f"
  done
fi

# Paths in the checksum file are relative to the repo root
FILES=()
for f in "${BP3D_FILES[@]}"; do FILES+=("sources/bp3d/$f"); done
for f in "${ZANAT_FILES[@]}"; do FILES+=("sources/z-anatomy/$f"); done

cd "$ROOT"
if [ "$MODE" = "record" ]; then
  sha256sum "${FILES[@]}" > "$SUMS"
  echo "Wrote $SUMS"
else
  [ -f "$SUMS" ] || { echo "Missing $SUMS, run with --record first." >&2; exit 1; }
  # Only the files we download are checked, not the unpacked ones
  sha256sum -c "$SUMS"
fi

# Unpack the zips next to the downloads (-n keeps files that already exist)
unzip -q -n "$BP3D/isa_BP3D_4.0_obj_99.zip" -d "$BP3D"
unzip -q -n "$ZANAT/Z-Anatomy.zip" -d "$ZANAT"
echo "Unpacked."
