#!/usr/bin/env bash
# Downloads Blender 5.2.3 into tools/blender/ so tools/blender/blender exists.
# Safe to run again. It skips the download if the checked tarball is already there.
set -euo pipefail

VERSION="5.2.3"
BASE_URL="https://download.blender.org/release/Blender5.2"
TARBALL="blender-${VERSION}-linux-x64.tar.xz"
SUMS="blender-${VERSION}.sha256"

# Work from the repo root, wherever the script is called from
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DL="$ROOT/tools/downloads"
DEST="$ROOT/tools/blender"
mkdir -p "$DL"

# Checks the tarball against the official checksum file
verify() {
  [ -f "$DL/$TARBALL" ] && [ -f "$DL/$SUMS" ] || return 1
  (cd "$DL" && grep -F "$TARBALL" "$SUMS" | sha256sum -c - >/dev/null 2>&1)
}

if verify; then
  echo "Tarball already downloaded and verified, skipping download."
else
  echo "Downloading $TARBALL (this is a big file)..."
  curl -fsSL --retry 3 -o "$DL/$SUMS" "$BASE_URL/$SUMS"
  curl -fsSL --retry 3 -C - -o "$DL/$TARBALL" "$BASE_URL/$TARBALL"
  # Fail loudly if the checksum does not match
  (cd "$DL" && grep -F "$TARBALL" "$SUMS" | sha256sum -c -)
fi

if [ -x "$DEST/blender" ]; then
  echo "Blender is already unpacked at $DEST/blender"
else
  echo "Unpacking into $DEST ..."
  mkdir -p "$DEST"
  # The tarball has one top folder, which we drop so the binary lands in tools/blender/
  tar -xJf "$DL/$TARBALL" -C "$DEST" --strip-components=1
fi

"$DEST/blender" --version | head -n 1
