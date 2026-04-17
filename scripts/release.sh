#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

VERSION="${1:?Usage: release.sh <version> (e.g. 1.2.3)}"
TAG="v$VERSION"

echo "→ Setting version to $VERSION..."

node -e "
  const fs = require('fs');
  const path = '$ROOT_DIR/src-tauri/tauri.conf.json';
  const cfg = JSON.parse(fs.readFileSync(path, 'utf8'));
  cfg.version = '$VERSION';
  fs.writeFileSync(path, JSON.stringify(cfg, null, 2) + '\n');
"

sed -i '' "s/^version = \".*\"/version = \"$VERSION\"/" "$ROOT_DIR/src-tauri/Cargo.toml"

echo "→ Updating Cargo.lock..."
cargo check --manifest-path "$ROOT_DIR/src-tauri/Cargo.toml"

echo "→ Checking Build..."
pnpm --dir "$ROOT_DIR" build

echo "→ Committing version bump..."
git -C "$ROOT_DIR" add src-tauri/tauri.conf.json src-tauri/Cargo.toml src-tauri/Cargo.lock
git -C "$ROOT_DIR" commit -m "chore: release $TAG"

echo "→ Tagging and releasing $TAG..."
git -C "$ROOT_DIR" push origin main
git -C "$ROOT_DIR" tag "$TAG"
git -C "$ROOT_DIR" push origin "$TAG"
echo "Done! GitHub Actions is now building the release."
