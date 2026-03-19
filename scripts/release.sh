#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# ─── Check gh CLI ─────────────────────────────────────────────────────────────

if ! command -v gh &>/dev/null; then
  echo "Error: gh CLI is not installed. Install it with: brew install gh"
  exit 1
fi

if ! gh auth status &>/dev/null; then
  echo "Error: gh CLI is not authenticated. Run: gh auth login"
  exit 1
fi

# ─── Load env vars ────────────────────────────────────────────────────────────

SET_ENVS="$(dirname "$0")/set_envs.sh"
if [ ! -f "$SET_ENVS" ]; then
  echo "Error: $SET_ENVS not found. Create it to export TAURI_SIGNING_PRIVATE_KEY and TAURI_SIGNING_PRIVATE_KEY_PASSWORD."
  exit 1
fi
# shellcheck source=set_envs.sh
source "$SET_ENVS"

if [ -z "$TAURI_SIGNING_PRIVATE_KEY" ]; then
  echo "Error: TAURI_SIGNING_PRIVATE_KEY is not set in set_envs.sh"
  exit 1
fi

# ─── Derived values ───────────────────────────────────────────────────────────

VERSION=$(node -e "console.log(require('$ROOT_DIR/src-tauri/tauri.conf.json').version)")
TAG="v$VERSION"

ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
  PLATFORM_KEY="darwin-aarch64"
else
  PLATFORM_KEY="darwin-x86_64"
fi

REMOTE_URL=$(git -C "$ROOT_DIR" remote get-url origin 2>/dev/null || true)
REPO=$(echo "$REMOTE_URL" | sed 's|.*github.com[:/]||' | sed 's|\.git$||')

if [ -z "$REPO" ]; then
  echo "Error: Could not determine GitHub repo from git remote. Make sure 'origin' points to a GitHub repo."
  exit 1
fi

BUNDLE_DIR="$ROOT_DIR/src-tauri/target/release/bundle"

echo "→ Version:  $VERSION"
echo "→ Tag:      $TAG"
echo "→ Repo:     $REPO"
echo "→ Platform: $PLATFORM_KEY"
echo ""

# ─── Build ────────────────────────────────────────────────────────────────────

echo "→ Building..."
cd "$ROOT_DIR"
pnpm tauri build

# ─── Locate artifacts ─────────────────────────────────────────────────────────

TAR_GZ=$(find "$BUNDLE_DIR/macos" -name "*.app.tar.gz" | head -1)
SIG_FILE="${TAR_GZ}.sig"
DMG=$(find "$BUNDLE_DIR/dmg" -name "*.dmg" | head -1)

if [ -z "$TAR_GZ" ] || [ ! -f "$TAR_GZ" ]; then
  echo "Error: Could not find .app.tar.gz in $BUNDLE_DIR/macos"
  exit 1
fi

if [ ! -f "$SIG_FILE" ]; then
  echo "Error: Could not find .sig file at $SIG_FILE"
  echo "  Make sure TAURI_SIGNING_PRIVATE_KEY is set correctly."
  exit 1
fi

TAR_GZ_FILENAME=$(basename "$TAR_GZ")
echo "→ Artifacts found:"
echo "   $TAR_GZ"
echo "   $SIG_FILE"
[ -n "$DMG" ] && echo "   $DMG"
echo ""

# ─── Create GitHub Release ────────────────────────────────────────────────────

echo "→ Tagging and pushing $TAG..."
git -C "$ROOT_DIR" tag "$TAG"
git -C "$ROOT_DIR" push origin "$TAG"

echo "→ Creating GitHub release $TAG..."
UPLOAD_ARGS=("$TAR_GZ" "$SIG_FILE")
[ -n "$DMG" ] && UPLOAD_ARGS+=("$DMG")

gh release create "$TAG" \
  --title "Postchi $VERSION" \
  --notes "Release $VERSION" \
  "${UPLOAD_ARGS[@]}"

# ─── Create and upload latest.json ────────────────────────────────────────────

SIGNATURE=$(cat "$SIG_FILE")
DOWNLOAD_URL="https://github.com/$REPO/releases/download/$TAG/$TAR_GZ_FILENAME"
PUB_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

LATEST_JSON_PATH="/tmp/latest.json"
cat > "$LATEST_JSON_PATH" <<EOF
{
  "version": "$VERSION",
  "notes": "Release $VERSION",
  "pub_date": "$PUB_DATE",
  "platforms": {
    "$PLATFORM_KEY": {
      "signature": "$SIGNATURE",
      "url": "$DOWNLOAD_URL"
    }
  }
}
EOF

echo "→ Uploading latest.json..."
gh release upload "$TAG" "$LATEST_JSON_PATH"

echo ""
echo "Done! Release $TAG is live."
echo "  https://github.com/$REPO/releases/tag/$TAG"
echo ""
echo "  Updater endpoint:"
echo "  https://github.com/$REPO/releases/latest/download/latest.json"
