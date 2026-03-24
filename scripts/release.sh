#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

VERSION=$(node -e "console.log(require('$ROOT_DIR/src-tauri/tauri.conf.json').version)")
TAG="v$VERSION"

echo "→ Releasing $TAG..."
git -C "$ROOT_DIR" push origin main
git -C "$ROOT_DIR" tag "$TAG"
git -C "$ROOT_DIR" push origin "$TAG"
echo "Done! GitHub Actions is now building the release."
