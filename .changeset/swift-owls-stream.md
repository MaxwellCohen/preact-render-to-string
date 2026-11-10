---
"preact-render-to-string": minor
---

Add an opt-in `dpu: true` option to `renderToChunks`, `renderToReadableStream` and `renderToPipeableStream` that streams deferred content using declarative partial updates (`<template for>` patches, `<?start>`/`<?end>` fallback markers and a single MutationObserver init script) instead of `<preact-island>` custom elements.

The existing `<preact-island>` wire format stays the default, so this is a minor. Making `dpu` the default would change the wire format and must be released as a major.
