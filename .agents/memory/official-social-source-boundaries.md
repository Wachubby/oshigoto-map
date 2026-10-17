---
name: Official social-source boundaries
description: The approved public methods and scope for social updates in 推しごとマップ
---

Use public Instagram oEmbed and YouTube oEmbed only for individual post/video URLs explicitly listed in `whitelisted_sources.json`, alongside the whitelisted RSS feeds. Do not use the Instagram Graph API to search arbitrary public profiles.

**Why:** The user specified these official data methods for 推しごとマップ and disallowed arbitrary-profile Graph API access.

**How to apply:** Do not infer post lists from handles. When no post/video URLs are listed, report the source as unavailable instead of scraping or inventing results.
