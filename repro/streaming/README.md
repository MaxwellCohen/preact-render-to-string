# PR #474 browser reproductions

From this directory, run the PR in a fresh temporary checkout against **unmodified Preact 11.0.0-rc.1**:

```sh
./run.sh
```

Requires Node 20+, npm, Git, network access, and free localhost port 4197. Playwright installs Chromium unless `CHROME_PATH` points to an existing Chrome executable. On Linux, Chromium may also need OS browser dependencies.

The harness verifies actual DPU parsing with the feature enabled and disabled. If the browser cannot exercise both modes, the run fails instead of silently treating them as equivalent.

To test uncommitted changes, run from the repository root:

```sh
RTS_DIR="$PWD" ./repro/streaming/run.sh
```

This copies the local `src` tree and dependency manifests into the temporary directory; the working checkout is left untouched. The recorded commit identifies the starting revision, not the uncommitted changes.

To exercise a different revision or fork:

```sh
./run.sh 77da82f798a7f0cc2e63709b25b3e38f438d003f
RTS_REPO=https://github.com/MaxwellCohen/preact-render-to-string.git ./run.sh dpu-template-for-streaming
```

The browser matrix covers:

- Server B resolves before A; B should become visible while A is pending.
- Client ready before hydration, or resolving after hydration but before the server: preserve the same button, its click handler and counter; discard late templates.
- Server completes while client hydration is suspended: reuse the server content.
- Deliberate server/client tag mismatches: recover with working interaction. Expected mismatch warnings are retained in the log.
- Template opening tag and contents delivered in separate writes: preserve final content.
- Valid HTML inside SVG `foreignObject`: preserve node identity and handlers; MutationObserver must settle.

The SVG reproduction caps each observer at 31 callbacks to prevent a runaway loop; reaching the cap fails the assertion. The template split case checks final integrity, not every possible parser interleaving.

`check.cjs` exits nonzero for failed expectations. The checkout is retained, with `verification/environment.json`, `results.json`, `svg-results.json`, `browser.log`, and `check.log`. Raw results include phase-by-phase DOM snapshots, console diagnostics and MutationObserver records. Nothing is posted to GitHub.

On September 5, commit `77da82f` passed all 222 existing unit tests, while this browser investigation found failures in chunk visibility, hydration ownership and SVG node preservation. Those observations are historical; use the generated logs for the revision you run.

This bundle targets the template transport in #474. It is not a reproduction suite for main's legacy `preact-island` transport. Hydration-race failures can require coordinated work beyond #474; running the suite does not attribute every failure to that PR.
