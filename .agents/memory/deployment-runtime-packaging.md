---
name: Deployment runtime packaging
description: Preserve runtime dependencies and verify the packaging boundary, not only workspace startup
---

Keep runtime dependencies and compiled output out of Git, but do not exclude them from the deployed runtime. A standard Next.js production server needs both its installed dependencies and its compiled output.

**Why:** A successful build and working workspace did not establish production readiness: the deployed process exited with `next: not found` while the workspace still had the executable. Deployment exclusions removed files that workspace-only checks could still access.

**How to apply:** Review deployment exclusions separately from Git exclusions. Verify startup from an isolated copy containing only the deployable runtime files; do not treat a workspace HTTP check as proof that the runtime bundle is complete.
