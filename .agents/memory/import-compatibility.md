---
name: Import compatibility
description: Setup scope and the reason for the imported framework upgrade
---

Preserve the imported app's structure and feature behavior during setup work.

**Why:** The user requested getting the import running, not a redesign or migration. The imported Next.js 14 line was blocked by the package firewall for a critical CVE, so a compatible current Next.js/React pair was necessary.

**How to apply:** Do not downgrade to the imported versions to match the old README. Treat connecting real news and event data as separate feature work, not setup.
