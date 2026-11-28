#!/usr/bin/env bash
# Count ADE's downloads for the site: the release asset downloads of ade-terminal
# (the desktop app) and ade-cli (`ade`), from GitHub's releases API, summed over
# every page of each repo's releases. Writes <site-dir>/_data/downloads.json:
#   {"total": N, "repos": {"ade-terminal": N, "ade-cli": N}, "date": "YYYY-MM-DD"}
# Installs from a package manager or a git clone are not counted.
#
# Never fails the build: on any error (the API down, rate-limited, an answer
# that is not a list, a total under 100) it removes the file, so the pages
# leave the line out rather than show 0 or a stale number, and exits 0.
#
# Usage: scripts/fetch-downloads.sh <site-dir>
# Env:   ADE_API (host, for tests), GITHUB_TOKEN (optional, raises the rate limit).
set -uo pipefail

dest="${1:?usage: fetch-downloads.sh <site-dir>}"
api="${ADE_API:-https://api.github.com}"
repos="better-ade/ade-terminal better-ade/ade-cli"
out="$dest/_data/downloads.json"
max_pages=50

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

auth=()
if [[ -n "${GITHUB_TOKEN:-}" && "$api" == https://* ]]; then
  auth=(-H "Authorization: Bearer $GITHUB_TOKEN")
fi

give_up() {
  rm -f "$out"
  echo "download count not updated ($1); the pages leave the line out" >&2
  exit 0
}

# count <owner/repo>: prints the sum of assets[].download_count over all release pages.
count() {
  local repo="$1" page=1 sum=0 json n len
  while (( page <= max_pages )); do
    json="$(curl -fsSL --max-time 30 ${auth[@]+"${auth[@]}"} -H "Accept: application/vnd.github+json" \
      "$api/repos/$repo/releases?per_page=100&page=$page" 2>/dev/null)" || return 1
    len="$(printf '%s' "$json" | jq -er 'if type == "array" then length else error("not a list") end' 2>/dev/null)" || return 1
    (( len == 0 )) && break
    n="$(printf '%s' "$json" | jq -er '[.[].assets[]?.download_count // 0] | add // 0 | floor' 2>/dev/null)" || return 1
    sum=$(( sum + n ))
    page=$(( page + 1 ))
  done
  (( page <= max_pages )) || return 1
  printf '%s\n' "$sum"
}

command -v jq >/dev/null 2>&1 || give_up "jq is not installed"

total=0
repos_json='{}'
for repo in $repos; do
  n="$(count "$repo")" || give_up "$repo: the releases API did not answer with a list"
  total=$(( total + n ))
  repos_json="$(printf '%s' "$repos_json" | jq -c --arg k "${repo#*/}" --argjson v "$n" '. + {($k): $v}')" || give_up "jq"
done

(( total >= 100 )) || give_up "a total of $total is too small to show"

mkdir -p "$dest/_data" || give_up "cannot write $dest/_data"
jq -n --argjson total "$total" --argjson repos "$repos_json" --arg date "$(date -u +%Y-%m-%d)" \
  '{total: $total, repos: $repos, date: $date}' > "$tmp/downloads.json" || give_up "jq"
mv "$tmp/downloads.json" "$out" || give_up "cannot write $out"
echo "download count: $total ($repos_json)"
