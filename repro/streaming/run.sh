#!/usr/bin/env bash
set -euo pipefail
bundle_dir="$(cd "$(dirname "$0")" && pwd)"
run_dir="$(mktemp -d "${TMPDIR:-/tmp}/pr474-repro.XXXXXX")"
ref="${1:-refs/pull/474/head}"
printf 'Source checkout and results: %s\n' "$run_dir"
if [[ -n "${RTS_DIR:-}" ]]; then
  # Copy only renderer sources and dependency manifests, including local edits.
  cp -R "$RTS_DIR/src" "$run_dir/src"
  cp "$RTS_DIR/package.json" "$run_dir/package.json"
  if [[ -f "$RTS_DIR/package-lock.json" ]]; then cp "$RTS_DIR/package-lock.json" "$run_dir/package-lock.json"; fi
  export PR474_SOURCE_COMMIT="$(git -C "$RTS_DIR" rev-parse HEAD 2>/dev/null || printf 'local sources')"
else
  git clone --quiet --no-checkout "${RTS_REPO:-https://github.com/preactjs/preact-render-to-string.git}" "$run_dir"
  git -C "$run_dir" fetch --quiet origin "$ref"
  git -C "$run_dir" checkout --quiet --detach FETCH_HEAD
  export PR474_SOURCE_COMMIT="$(git -C "$run_dir" rev-parse HEAD)"
fi
mkdir "$run_dir/verification"
cp "$bundle_dir"/*.{jsx,cjs} "$run_dir/verification/"
cd "$run_dir"
npm install --ignore-scripts --legacy-peer-deps --no-audit --no-fund
npm install --no-save --ignore-scripts --legacy-peer-deps --no-audit --no-fund preact@11.0.0-rc.1 playwright@1.63.0
if [[ -z "${CHROME_PATH:-}" ]]; then npx playwright install chromium; fi
node verification/build.cjs
node -e 'const fs=require("fs");fs.writeFileSync("verification/environment.json",JSON.stringify({commit:process.env.PR474_SOURCE_COMMIT,localSources:process.env.RTS_DIR||null,preact:require("preact/package.json").version,playwright:require("playwright/package.json").version,node:process.version,chromePath:process.env.CHROME_PATH||"Playwright Chromium"},null,2))'
node verification/server.cjs > verification/server.log 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true' EXIT
# Wait for this process to bind, rather than accidentally using another server.
for attempt in {1..100}; do
  kill -0 "$server_pid" 2>/dev/null || { cat verification/server.log; exit 1; }
  if grep -q 'ready 4197' verification/server.log; then break; fi
  sleep 0.1
done
grep -q 'ready 4197' verification/server.log
node verification/run.cjs > verification/browser.log 2>&1
node verification/svg.cjs >> verification/browser.log 2>&1
set +e
node verification/check.cjs 2>&1 | tee verification/check.log
status=${PIPESTATUS[0]}
set -e
printf '\nResults: %s/verification\n' "$run_dir"
exit "$status"
