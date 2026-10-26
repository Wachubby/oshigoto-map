---
name: V1 locked product rules
description: Product rules for onboarding profiles, event approval, unknown-venue review, social matching, and map pins
---

- The app must work for any oshi name entered during onboarding; do not add hardcoded people or event schedules as defaults.
- Only the 70 venues in `venues_whitelist.json` can appear as approved events. A venue not on that list is a review candidate handled by `unknown_venue_collector.ts`, never an approved event. Keep the collector trigger at 20 unique candidates OR 14 days.
- Social Mode A applies when a helper matches a verified group account: include all available posts from that account without requiring caption keywords. Mode B applies when no group helper matches: include posts whose caption or tags match the oshi name/helper aliases, or whose verified author is identified as a personal account.
- Social filtering does not authorize scraping arbitrary profiles; only use verified, whitelisted sources.
- Calendar event selection uses a button and a bottom sheet while leaving the calendar visible behind it. Map event pins are 32px white circles with purple borders and date-only labels.

**Why:** The user explicitly locked these v1 behaviors to prevent invented event data, accidental venue approval, and hardcoded people or social rules.

**How to apply:** Follow these constraints for future onboarding, calendar, map, event ingestion, and social-source changes. If live social sources are not configured, state that clearly rather than implying posts were fetched.
