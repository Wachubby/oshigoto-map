---
name: Deployment port coordination
description: Keep independently editable startup and deployment settings consistent
---

Treat the production start script, workflow wait port, and single public port mapping as one coordinated configuration.

**Why:** These settings have drifted independently during publishing work. The app can compile successfully and start normally on one port while readiness checks wait on another.

**How to apply:** Change all three together when changing ports, retain only one external mapping for Autoscale, and use the server's actual startup output plus an HTTP response to verify consistency. A passing build alone is not sufficient.
