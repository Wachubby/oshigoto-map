---
name: V1 locked product rules
description: Product rules for profiles, official sources, venue approval, social matching, map pins, and navigation
---

- The app must work for any oshi name entered during onboarding; do not add hardcoded people or event schedules as defaults.
- Calendar events may come only from the configured official source and are filtered by the oshi profile; they do not require venue-whitelist membership.
- Map pins require an exact venue whitelist match. Unknown venues stay review candidates handled by `unknown_venue_collector.ts`, never approved Map pins. Keep the collector trigger at 20 unique candidates OR 14 days.
- When migrating V1 venues to tiers, preserve their existing venue fields and assign `livehouse` when `type` starts with `livehouse`; assign `mid` to other legacy types. New supplied major venues use `major`.
- Group mode is generic: when a helper matches a group name in official-source tags, include all events for that group; otherwise match the display name or helper aliases. Do not hardcode a specific group.
- Social Mode A applies when a helper matches a verified group account: include all available posts from that account without requiring caption keywords. Mode B applies when no group helper matches: include posts whose caption or tags match the oshi name/helper aliases, or whose verified author is identified as a personal account.
- Social filtering does not authorize scraping arbitrary profiles; only use verified, whitelisted sources.
- Calendar event selection uses a button and a bottom sheet while leaving the calendar visible behind it. Map event pins are 32px white circles with purple borders and date-only labels.
- Feature pages have a one-line `{displayName}の推しごとマップ` header with only a hamburger at right, plus a fixed three-item bottom navigation: カレンダー, マップ, ソーシャル. Home redirects to Calendar.

**Why:** The user explicitly separated official-source Calendar dates from venue-approved Map pins to prevent invented events and accidental venue approval while supporting any onboarding profile.

**Why:** The tier labels preserve the user's V1 classification while distinguishing newly supplied major venues.

**Why:** The user locked the feature header and bottom navigation to this exact three-section layout.

**How to apply:** Follow these constraints for future onboarding, calendar, map, event ingestion, and social-source changes. If live social sources are not configured, state that clearly rather than implying posts were fetched. Venue-list updates must use the user's supplied list; never invent rows.

**How to apply:** For future venue-list additions, retain existing IDs, names, regions, types, and search keywords; only use the user's explicit tier assignment for new rows.

**How to apply:** Keep section links out of the header and do not add a Home tab or any fourth bottom-navigation item.
