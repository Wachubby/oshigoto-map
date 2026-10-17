#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

# Reconcile dependencies with the committed lockfile. Replit restarts the
# configured workflows after this script succeeds.
npm ci --include=dev --no-audit --no-fund
