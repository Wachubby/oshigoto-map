---
name: Dependency lock validation
description: Validate clean-install compatibility rather than trusting an incremental install
---

Check that the committed lockfile supports a clean installation before declaring publishing ready. Successful incremental installation alone is insufficient.

**Why:** Repeated npm installs produced a lockfile with missing optional dependency metadata while the existing installation still built successfully. Regenerating with no existing dependency tree resolved the clean-install validation failure.

**How to apply:** Validate the lockfile with a clean-install check before publishing. If incremental lock regeneration repeats the same metadata failure, regenerate from a fresh dependency tree rather than bypassing peer checks or repeatedly reinstalling over the same tree. Keep temporary dependency backups outside the source tree so TypeScript does not scan them.
