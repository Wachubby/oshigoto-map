
# 推しごとマップ MVP - Build Instructions

## What you have now
- Accurate domain-free Japan map: /public/japan-green-base.jpg (your green image, NOT blob)
- Fixed bottom nav (72px), map fixed no-scroll, bottom handle swipe
- Empty-first flow: if no oshi in localStorage, show CTA -> open 推し管理 sheet (same component for first-time & edit)
- Keywords: 正式名 + max 3 nicknames, generic warning (Mickey)
- Whitelist-only search, learning via 「これは違う」

## Quick Start
1. `npm install`
2. `cp .env.example .env` and fill YouTube API key
3. `npm run dev` -> http://localhost:3000
4. Open DevTools > Application > LocalStorage to clear oshi for empty test

## Structure
src/app/page.tsx = main phone frame + tab router
src/components/OshiRegisterSheet.tsx = formal name + 3 nicknames + generic check
src/components/MapView.tsx = green base image + pins ON LAND (Sapporo on Hokkaido)
src/components/CalendarView.tsx = no scroll, dots
src/components/SnsView.tsx = whitelist cards + 「違う」menu
src/data/whitelisted_sources.json = your whitelist (official + related + 正規メディア)
src/app/api/whitelist-search/route.ts = RSS proxy (CORS) + YouTube API, official methods only

## Whitelist Concept
- official: 本人公式
- related: 妻 安倍なつみ etc, only keyword matches
- media: ORICON, ナタリー, モデルプレス - RSS title+link only, no body copy (copyright safe)

## Learning
Each card: ... > これは違う推しの情報です / このキーワードを除外 / 提供元をミュート
-> localStorage blocked list, toast + undo, auto-mute after 3 flags on same keyword

## Terms
src/app/terms/page.tsx contains updated Article 2-6 with whitelist + keyword + learning + info@wachubby.com

## Map Pin Positions (ON LAND - fixed)
① 東京 62%/42% ② 名古屋 55%/52% ③ 大阪 48%/58% ④ 広島 35%/58% ⑤ 福岡 18%/72% ⑥ 札幌 72%/18% ON HOKKAIDO LAND

## Next Steps to Production
- Replace RSS proxy with cron that fetches RSS every 30min
- Add YouTube Data API v3 key
- Add PWA manifest
- Later swap green image with Meta MapLibre vector + fallback
