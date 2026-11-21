#!/usr/bin/env bash
# Copy ADE's installers (install.sh, install.ps1) from ade-terminal into the
# site folder, so https://ade.ardata.tech/install.sh keeps serving them.
#
# Source: the latest GitHub release's tag when it has both files, else main.
# The pair always comes from one ref. Nothing is written unless both fetched.
#
# Usage: scripts/fetch-installers.sh <site-dir>
# Env:   ADE_REPO (better-ade/ade-terminal), ADE_API, ADE_RAW (hosts, for tests),
#        GITHUB_TOKEN (optional, raises the API rate limit).
set -euo pipefail

dest="${1:?usage: fetch-installers.sh <site-dir>}"
repo="${ADE_REPO:-better-ade/ade-terminal}"
api="${ADE_API:-https://api.github.com}"
raw="${ADE_RAW:-https://raw.githubusercontent.com}"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

auth=()
if [[ -n "${GITHUB_TOKEN:-}" && "$api" == https://* ]]; then
  auth=(-H "Authorization: Bearer $GITHUB_TOKEN")
fi

tag=""
if json="$(curl -fsSL ${auth[@]+"${auth[@]}"} "$api/repos/$repo/releases/latest" 2>/dev/null)"; then
  tag="$(printf '%s' "$json" | jq -r '.tag_name // empty' 2>/dev/null || true)"
fi

# fetch <ref>: both installers into $tmp/<ref>/, checked; non-zero if either is missing or wrong.
fetch() {
  local ref="$1" out="$tmp/$1"
  mkdir -p "$out"
  curl -fsSL "$raw/$repo/$ref/docs/install.sh" -o "$out/install.sh" 2>/dev/null || return 1
  curl -fsSL "$raw/$repo/$ref/docs/install.ps1" -o "$out/install.ps1" 2>/dev/null || return 1
  [[ -s "$out/install.ps1" ]] || return 1
  head -n1 "$out/install.sh" | grep -q '^#!' || { echo "install.sh at $ref is not a shell script" >&2; return 1; }
}

for ref in ${tag:+"$tag"} main; do
  if fetch "$ref"; then
    cp "$tmp/$ref/install.sh" "$tmp/$ref/install.ps1" "$dest/"
    echo "installers copied from $repo@$ref"
    exit 0
  fi
  echo "installers not usable at $repo@$ref" >&2
done

echo "error: no ref of $repo has both installers" >&2
exit 1
